import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const SET_TYPES = ['warmup', 'normal', 'dropset', 'failure'] as const;
export type SetType = (typeof SET_TYPES)[number];

/** How sets of an exercise are logged. */
export const TRACKING_TYPES = ['weight_reps', 'bodyweight_reps', 'duration', 'distance'] as const;
export type TrackingType = (typeof TRACKING_TYPES)[number];

const createdAt = () =>
  integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

/** Internal key/value store (e.g. version of the bundled exercise library). */
export const appMeta = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// ---------------------------------------------------------------------------
// Exercise library
// ---------------------------------------------------------------------------

export const exercises = sqliteTable(
  'exercises',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /** Stable identifier, also used by program import/export. */
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    primaryMuscles: text('primary_muscles', { mode: 'json' }).$type<string[]>().notNull(),
    secondaryMuscles: text('secondary_muscles', { mode: 'json' }).$type<string[]>().notNull(),
    equipment: text('equipment'),
    category: text('category'),
    force: text('force'),
    level: text('level'),
    mechanic: text('mechanic'),
    instructions: text('instructions', { mode: 'json' }).$type<string[]>().notNull(),
    images: text('images', { mode: 'json' }).$type<string[]>().notNull(),
    trackingType: text('tracking_type', { enum: TRACKING_TYPES }).notNull().default('weight_reps'),
    isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index('exercises_name_idx').on(t.name)],
);

// ---------------------------------------------------------------------------
// Programs (templates)
// ---------------------------------------------------------------------------

export const programs = sqliteTable('programs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: createdAt(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
  archivedAt: integer('archived_at', { mode: 'timestamp_ms' }),
});

export const workoutTemplates = sqliteTable(
  'workout_templates',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    programId: integer('program_id')
      .notNull()
      .references(() => programs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    position: integer('position').notNull(),
    notes: text('notes'),
  },
  (t) => [index('workout_templates_program_idx').on(t.programId)],
);

export const templateExercises = sqliteTable(
  'template_exercises',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    templateId: integer('template_id')
      .notNull()
      .references(() => workoutTemplates.id, { onDelete: 'cascade' }),
    exerciseId: integer('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
    /** Null falls back to the global default rest time. */
    restSeconds: integer('rest_seconds'),
    notes: text('notes'),
  },
  (t) => [index('template_exercises_template_idx').on(t.templateId)],
);

export const templateSets = sqliteTable(
  'template_sets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    templateExerciseId: integer('template_exercise_id')
      .notNull()
      .references(() => templateExercises.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    type: text('type', { enum: SET_TYPES }).notNull().default('normal'),
    targetReps: integer('target_reps'),
    targetWeight: real('target_weight'),
    targetDurationSeconds: integer('target_duration_seconds'),
  },
  (t) => [index('template_sets_template_exercise_idx').on(t.templateExerciseId)],
);

// ---------------------------------------------------------------------------
// Sessions (instances of a template, freely editable)
// ---------------------------------------------------------------------------

export const workoutSessions = sqliteTable(
  'workout_sessions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /** Null for a free session started without a template. */
    templateId: integer('template_id').references(() => workoutTemplates.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
    /** Perceived effort of the whole session, 1–10. */
    perceivedEffort: integer('perceived_effort'),
    notes: text('notes'),
  },
  (t) => [index('workout_sessions_started_at_idx').on(t.startedAt)],
);

export const sessionExercises = sqliteTable(
  'session_exercises',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sessionId: integer('session_id')
      .notNull()
      .references(() => workoutSessions.id, { onDelete: 'cascade' }),
    exerciseId: integer('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    /** Origin in the template, used to diff the session against it. Null if added on the fly. */
    sourceTemplateExerciseId: integer('source_template_exercise_id').references(
      () => templateExercises.id,
      { onDelete: 'set null' },
    ),
    position: integer('position').notNull(),
    restSeconds: integer('rest_seconds'),
    notes: text('notes'),
  },
  (t) => [
    index('session_exercises_session_idx').on(t.sessionId),
    index('session_exercises_exercise_idx').on(t.exerciseId),
  ],
);

export const sessionSets = sqliteTable(
  'session_sets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sessionExerciseId: integer('session_exercise_id')
      .notNull()
      .references(() => sessionExercises.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    type: text('type', { enum: SET_TYPES }).notNull().default('normal'),
    weight: real('weight'),
    reps: integer('reps'),
    durationSeconds: integer('duration_seconds'),
    distanceMeters: real('distance_meters'),
    rpe: real('rpe'),
    /** Null while the set is planned but not done yet. */
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  },
  (t) => [index('session_sets_session_exercise_idx').on(t.sessionExerciseId)],
);

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color'),
});

export const sessionTags = sqliteTable(
  'session_tags',
  {
    sessionId: integer('session_id')
      .notNull()
      .references(() => workoutSessions.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.tagId] })],
);

export type Exercise = typeof exercises.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;
export type TemplateExercise = typeof templateExercises.$inferSelect;
export type TemplateSet = typeof templateSets.$inferSelect;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type SessionExercise = typeof sessionExercises.$inferSelect;
export type SessionSet = typeof sessionSets.$inferSelect;
export type Tag = typeof tags.$inferSelect;
