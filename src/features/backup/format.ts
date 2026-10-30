import {
  CONTENT_LANGUAGES,
  type Exercise,
  type Program,
  type SessionExercise,
  type SessionSet,
  SET_TYPES,
  type Tag,
  type TemplateExercise,
  TRACKING_TYPES,
  type WorkoutSession,
  type WorkoutTemplate,
} from '@/db/schema';

/**
 * Backup file of everything the user entered. Rows keep their ids, except exercises: they are
 * referenced by slug because the ids of library exercises differ between installations.
 * Bump BACKUP_VERSION for any change, and keep parsing the older versions.
 */
export const BACKUP_FORMAT = 'workout-planner.backup';
export const BACKUP_VERSION = 1;

type WithSlug<T> = Omit<T, 'exerciseId'> & { exerciseSlug: string };

export type BackupData = {
  /** Custom exercises, and the library ones in use in case a later library drops them. */
  exercises: Omit<Exercise, 'id'>[];
  programs: Program[];
  workoutTemplates: Omit<WorkoutTemplate, 'isDraft'>[];
  templateExercises: WithSlug<TemplateExercise>[];
  /** Finished ones only: the workout in progress isn't part of a backup. */
  workoutSessions: (WorkoutSession & { endedAt: Date })[];
  sessionExercises: WithSlug<SessionExercise>[];
  sessionSets: SessionSet[];
  tags: Tag[];
  sessionTags: { sessionId: number; tagId: number }[];
};

export type Backup = { exportedAt: Date; data: BackupData };

export type BackupParseResult = { ok: true; backup: Backup } | { ok: false; error: string };

/** A "?" suffix allows null; an array lists the allowed values. */
type FieldSpec =
  | 'number'
  | 'number?'
  | 'string'
  | 'string?'
  | 'boolean'
  | 'date'
  | 'date?'
  | 'strings'
  | readonly string[];

const TABLES: Record<keyof BackupData, Record<string, FieldSpec>> = {
  exercises: {
    slug: 'string',
    name: 'string',
    nameEn: 'string?',
    primaryMuscles: 'strings',
    secondaryMuscles: 'strings',
    equipment: 'string?',
    category: 'string?',
    force: 'string?',
    level: 'string?',
    mechanic: 'string?',
    instructions: 'strings',
    instructionsLanguage: CONTENT_LANGUAGES,
    images: 'strings',
    trackingType: TRACKING_TYPES,
    isEssential: 'boolean',
    isCustom: 'boolean',
    createdAt: 'date',
  },
  programs: {
    id: 'number',
    name: 'string',
    description: 'string?',
    createdAt: 'date',
    updatedAt: 'date?',
    archivedAt: 'date?',
  },
  workoutTemplates: {
    id: 'number',
    programId: 'number',
    name: 'string',
    position: 'number',
    notes: 'string?',
  },
  templateExercises: {
    id: 'number',
    templateId: 'number',
    exerciseSlug: 'string',
    position: 'number',
    restSeconds: 'number?',
    target: 'string?',
    notes: 'string?',
  },
  workoutSessions: {
    id: 'number',
    templateId: 'number?',
    name: 'string',
    startedAt: 'date',
    endedAt: 'date',
    perceivedEffort: 'number?',
    notes: 'string?',
  },
  sessionExercises: {
    id: 'number',
    sessionId: 'number',
    exerciseSlug: 'string',
    sourceTemplateExerciseId: 'number?',
    position: 'number',
    restSeconds: 'number?',
    notes: 'string?',
  },
  sessionSets: {
    id: 'number',
    sessionExerciseId: 'number',
    position: 'number',
    type: SET_TYPES,
    weight: 'number?',
    reps: 'number?',
    durationSeconds: 'number?',
    distanceMeters: 'number?',
    rpe: 'number?',
    completedAt: 'date?',
  },
  tags: { id: 'number', name: 'string', color: 'string?' },
  sessionTags: { sessionId: 'number', tagId: 'number' },
};

/** Table, field, referenced table, referenced field. */
const REFERENCES: [keyof BackupData, string, keyof BackupData, string][] = [
  ['workoutTemplates', 'programId', 'programs', 'id'],
  ['templateExercises', 'templateId', 'workoutTemplates', 'id'],
  ['templateExercises', 'exerciseSlug', 'exercises', 'slug'],
  ['workoutSessions', 'templateId', 'workoutTemplates', 'id'],
  ['sessionExercises', 'sessionId', 'workoutSessions', 'id'],
  ['sessionExercises', 'exerciseSlug', 'exercises', 'slug'],
  ['sessionExercises', 'sourceTemplateExerciseId', 'templateExercises', 'id'],
  ['sessionSets', 'sessionExerciseId', 'sessionExercises', 'id'],
  ['sessionTags', 'sessionId', 'workoutSessions', 'id'],
  ['sessionTags', 'tagId', 'tags', 'id'],
];

const INVALID = Symbol('invalid');

function readField(spec: FieldSpec, value: unknown): unknown {
  if (typeof spec !== 'string') return spec.includes(value as string) ? value : INVALID;
  const nullable = spec.endsWith('?');
  if (value === null || value === undefined) return nullable ? null : INVALID;

  switch (nullable ? spec.slice(0, -1) : spec) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? value : INVALID;
    case 'string':
      return typeof value === 'string' ? value : INVALID;
    case 'boolean':
      return typeof value === 'boolean' ? value : INVALID;
    case 'date': {
      const date = typeof value === 'string' ? new Date(value) : null;
      return date && !Number.isNaN(date.getTime()) ? date : INVALID;
    }
    case 'strings':
      return Array.isArray(value) && value.every((item) => typeof item === 'string')
        ? value
        : INVALID;
    default:
      return INVALID;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const damaged = (where: string): BackupParseResult => ({
  ok: false,
  error: `Ce fichier de sauvegarde est abîmé (${where}). Rien n’a été modifié.`,
});

/** Strict: restoring replaces everything, so a file with anything wrong is refused as a whole. */
export function parseBackup(text: string): BackupParseResult {
  let root: unknown;
  try {
    root = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Ce fichier n’est pas une sauvegarde Workout Planner.' };
  }
  if (!isRecord(root) || root.format !== BACKUP_FORMAT) {
    return { ok: false, error: 'Ce fichier n’est pas une sauvegarde Workout Planner.' };
  }
  if (typeof root.version !== 'number' || root.version > BACKUP_VERSION) {
    return {
      ok: false,
      error: 'Cette sauvegarde vient d’une version plus récente : mets l’application à jour.',
    };
  }
  const exportedAt = readField('date', root.exportedAt);
  if (exportedAt === INVALID) return damaged('exportedAt');
  if (!isRecord(root.data)) return damaged('data');

  const data: Record<string, Record<string, unknown>[]> = {};
  for (const [table, fields] of Object.entries(TABLES)) {
    const rows = root.data[table];
    if (!Array.isArray(rows)) return damaged(table);
    data[table] = [];
    for (const [index, row] of rows.entries()) {
      if (!isRecord(row)) return damaged(`${table}, ligne ${index + 1}`);
      const parsed: Record<string, unknown> = {};
      for (const [field, spec] of Object.entries(fields)) {
        parsed[field] = readField(spec, row[field]);
        if (parsed[field] === INVALID) return damaged(`${table}, ligne ${index + 1}, ${field}`);
      }
      data[table].push(parsed);
    }
  }

  for (const [table, field, target, targetField] of REFERENCES) {
    const known = new Set(data[target].map((row) => row[targetField]));
    const orphan = data[table].findIndex((row) => row[field] !== null && !known.has(row[field]));
    if (orphan !== -1) return damaged(`${table}, ligne ${orphan + 1}, ${field}`);
  }

  return {
    ok: true,
    backup: { exportedAt: exportedAt as Date, data: data as unknown as BackupData },
  };
}

export function serializeBackup(data: BackupData, exportedAt: Date): string {
  return JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: exportedAt.toISOString(),
    data,
  });
}

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`;

/** "12 entraînements, 2 programmes" */
export function describeBackup(data: BackupData): string {
  return `${plural(data.workoutSessions.length, 'entraînement')}, ${plural(data.programs.length, 'programme')}`;
}

const REMINDER_DAYS = 14;

/** Worth a reminder: workouts done since the last backup, and that backup isn't recent. */
export function isBackupDue(
  lastBackup: Date | null,
  latestWorkout: Date | null,
  now = new Date(),
): boolean {
  if (!latestWorkout) return false;
  if (!lastBackup) return true;
  return (
    latestWorkout > lastBackup &&
    now.getTime() - lastBackup.getTime() >= REMINDER_DAYS * 24 * 60 * 60 * 1000
  );
}
