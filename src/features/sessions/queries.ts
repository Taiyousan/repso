import { and, asc, desc, eq, inArray, isNotNull, isNull, lt, ne, type SQL, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { computeRecords, type ExerciseRecords } from '@/domain/records';
import { useLiveData } from '@/db/live';
import {
  exercises,
  programs,
  sessionExercises,
  sessionSets,
  sessionTags,
  tags,
  templateExercises,
  workoutSessions,
  workoutTemplates,
} from '@/db/schema';

import type { SetPerformance } from './logic';

/**
 * Last finished performance of each exercise, whatever the session it was done in, optionally
 * before a date. Finished sessions only keep completed sets, so every match has at least one set.
 */
export function readPreviousPerformance(
  exerciseIds: number[],
  excludeSessionId?: number,
  before?: Date,
): Map<number, SetPerformance[]> {
  const result = new Map<number, SetPerformance[]>();
  if (exerciseIds.length === 0) return result;

  const candidates = db
    .select({ id: sessionExercises.id, exerciseId: sessionExercises.exerciseId })
    .from(sessionExercises)
    .innerJoin(workoutSessions, eq(workoutSessions.id, sessionExercises.sessionId))
    .where(
      and(
        inArray(sessionExercises.exerciseId, exerciseIds),
        isNotNull(workoutSessions.endedAt),
        excludeSessionId == null ? undefined : ne(workoutSessions.id, excludeSessionId),
        before == null ? undefined : lt(workoutSessions.startedAt, before),
      ),
    )
    .orderBy(desc(workoutSessions.startedAt), desc(sessionExercises.position))
    .all();

  const latestByExercise = new Map<number, number>();
  for (const candidate of candidates) {
    if (!latestByExercise.has(candidate.exerciseId)) {
      latestByExercise.set(candidate.exerciseId, candidate.id);
    }
  }
  if (latestByExercise.size === 0) return result;

  const sets = db
    .select()
    .from(sessionSets)
    .where(
      and(
        inArray(sessionSets.sessionExerciseId, [...latestByExercise.values()]),
        isNotNull(sessionSets.completedAt),
      ),
    )
    .orderBy(asc(sessionSets.position))
    .all();

  for (const [exerciseId, sessionExerciseId] of latestByExercise) {
    result.set(
      exerciseId,
      sets.filter((set) => set.sessionExerciseId === sessionExerciseId),
    );
  }
  return result;
}

/**
 * Best value of each record of the given exercises, over finished sessions only. `before` and
 * `excludeSessionId` leave out a session, so its own sets don't hide the records it beat.
 */
export function readExerciseRecords(
  exerciseIds: number[],
  excludeSessionId?: number,
  before?: Date,
): Map<number, ExerciseRecords> {
  const result = new Map<number, ExerciseRecords>();
  if (exerciseIds.length === 0) return result;

  const rows = db
    .select({
      exerciseId: sessionExercises.exerciseId,
      trackingType: exercises.trackingType,
      type: sessionSets.type,
      weight: sessionSets.weight,
      reps: sessionSets.reps,
      durationSeconds: sessionSets.durationSeconds,
      at: workoutSessions.startedAt,
    })
    .from(sessionSets)
    .innerJoin(sessionExercises, eq(sessionExercises.id, sessionSets.sessionExerciseId))
    .innerJoin(exercises, eq(exercises.id, sessionExercises.exerciseId))
    .innerJoin(workoutSessions, eq(workoutSessions.id, sessionExercises.sessionId))
    .where(
      and(
        inArray(sessionExercises.exerciseId, exerciseIds),
        isNotNull(workoutSessions.endedAt),
        isNotNull(sessionSets.completedAt),
        ne(sessionSets.type, 'warmup'),
        excludeSessionId == null ? undefined : ne(workoutSessions.id, excludeSessionId),
        before == null ? undefined : lt(workoutSessions.startedAt, before),
      ),
    )
    .orderBy(asc(workoutSessions.startedAt))
    .all();

  for (const exerciseId of exerciseIds) {
    const own = rows.filter((row) => row.exerciseId === exerciseId);
    if (own.length === 0) continue;
    result.set(exerciseId, computeRecords(own, own[0].trackingType));
  }
  return result;
}

/** Exercises done in a finished session, most recently done first. */
export function useRecentExerciseIds() {
  return useLiveData(
    () =>
      db
        .select({ exerciseId: sessionExercises.exerciseId })
        .from(sessionExercises)
        .innerJoin(workoutSessions, eq(workoutSessions.id, sessionExercises.sessionId))
        .where(isNotNull(workoutSessions.endedAt))
        .groupBy(sessionExercises.exerciseId)
        .orderBy(desc(sql`max(${workoutSessions.startedAt})`))
        .all()
        .map((row) => row.exerciseId),
    ['workout_sessions', 'session_exercises'],
    'recent-exercises',
  );
}

/** Records of one exercise, for its detail screen. */
export function useExerciseRecords(exerciseId: number) {
  return useLiveData(
    () => readExerciseRecords([exerciseId]).get(exerciseId) ?? {},
    ['workout_sessions', 'session_exercises', 'session_sets'],
    exerciseId,
  );
}

/** The session in progress, if any (only one at a time). */
export function readActiveSession() {
  return db
    .select()
    .from(workoutSessions)
    .where(isNull(workoutSessions.endedAt))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(1)
    .get();
}

export function useActiveSession() {
  return useLiveData(readActiveSession, ['workout_sessions'], 'active');
}

export function useSession(id: number) {
  return useLiveData(
    () => {
      const session = db.select().from(workoutSessions).where(eq(workoutSessions.id, id)).get();
      if (!session) return undefined;

      const rows = db
        .select({
          item: sessionExercises,
          exercise: exercises,
          target: templateExercises.target,
        })
        .from(sessionExercises)
        .innerJoin(exercises, eq(exercises.id, sessionExercises.exerciseId))
        .leftJoin(
          templateExercises,
          eq(templateExercises.id, sessionExercises.sourceTemplateExerciseId),
        )
        .where(eq(sessionExercises.sessionId, id))
        .orderBy(asc(sessionExercises.position))
        .all();
      const itemIds = rows.map((row) => row.item.id);

      const sets =
        itemIds.length === 0
          ? []
          : db
              .select()
              .from(sessionSets)
              .where(inArray(sessionSets.sessionExerciseId, itemIds))
              .orderBy(asc(sessionSets.position))
              .all();

      // Before this session, so a past one is compared with what preceded it.
      const previous = readPreviousPerformance(
        rows.map((row) => row.exercise.id),
        id,
        session.startedAt,
      );
      const records = readExerciseRecords(
        rows.map((row) => row.exercise.id),
        id,
        session.startedAt,
      );

      const sessionTagList = db
        .select({ id: tags.id, name: tags.name })
        .from(sessionTags)
        .innerJoin(tags, eq(tags.id, sessionTags.tagId))
        .where(eq(sessionTags.sessionId, id))
        .orderBy(asc(tags.name))
        .all();

      return {
        ...session,
        tags: sessionTagList,
        exercises: rows.map(({ item, exercise, target }) => ({
          ...item,
          exercise,
          target,
          sets: sets.filter((set) => set.sessionExerciseId === item.id),
          previous: previous.get(exercise.id) ?? [],
          records: records.get(exercise.id) ?? {},
        })),
      };
    },
    ['workout_sessions', 'session_exercises', 'session_sets', 'session_tags', 'tags'],
    id,
  );
}

export type SessionDetail = NonNullable<ReturnType<typeof useSession>>;
export type SessionExerciseDetail = SessionDetail['exercises'][number];

/** Workouts that can be started, grouped by program. */
export function useStartableWorkouts() {
  return useLiveData(
    () => {
      const rows = db
        .select({
          programId: programs.id,
          programName: programs.name,
          workoutId: workoutTemplates.id,
          workoutName: workoutTemplates.name,
        })
        .from(workoutTemplates)
        .innerJoin(programs, eq(programs.id, workoutTemplates.programId))
        .where(eq(workoutTemplates.isDraft, false))
        .orderBy(asc(programs.createdAt), asc(workoutTemplates.position))
        .all();

      const groups: { id: number; name: string; workouts: { id: number; name: string }[] }[] = [];
      for (const row of rows) {
        let group = groups.at(-1);
        if (group?.id !== row.programId) {
          group = { id: row.programId, name: row.programName, workouts: [] };
          groups.push(group);
        }
        group.workouts.push({ id: row.workoutId, name: row.workoutName });
      }
      return groups;
    },
    ['programs', 'workout_templates'],
    'startable',
  );
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

/** Finished sessions with their totals (working sets only, as in recap.ts), newest first. */
function readSessionSummaries(where?: SQL, limit?: number) {
  const working = sql`${sessionSets.type} != 'warmup'`;
  const query = db
    .select({
      id: workoutSessions.id,
      name: workoutSessions.name,
      startedAt: workoutSessions.startedAt,
      endedAt: workoutSessions.endedAt,
      perceivedEffort: workoutSessions.perceivedEffort,
      setCount: sql<number>`count(case when ${working} then 1 end)`,
      volume: sql<number>`coalesce(sum(case when ${working} then ${sessionSets.weight} * ${sessionSets.reps} end), 0)`,
    })
    .from(workoutSessions)
    .leftJoin(sessionExercises, eq(sessionExercises.sessionId, workoutSessions.id))
    .leftJoin(sessionSets, eq(sessionSets.sessionExerciseId, sessionExercises.id))
    .where(and(isNotNull(workoutSessions.endedAt), where))
    .groupBy(workoutSessions.id)
    .orderBy(desc(workoutSessions.startedAt));
  return limit == null ? query.all() : query.limit(limit).all();
}

export type SessionSummary = ReturnType<typeof readSessionSummaries>[number] & {
  endedAt: Date;
  tags: string[];
};

export function useSessionHistory() {
  return useLiveData(
    (): SessionSummary[] => {
      const summaries = readSessionSummaries();
      const tagRows = db
        .select({ sessionId: sessionTags.sessionId, name: tags.name })
        .from(sessionTags)
        .innerJoin(tags, eq(tags.id, sessionTags.tagId))
        .orderBy(asc(tags.name))
        .all();
      return summaries.map((summary) => ({
        ...summary,
        endedAt: summary.endedAt!,
        tags: tagRows.filter((row) => row.sessionId === summary.id).map((row) => row.name),
      }));
    },
    ['workout_sessions', 'session_exercises', 'session_sets', 'session_tags', 'tags'],
    'history',
  );
}

/** Last finished session of the same workout before `before`, to compare with. */
export function readPreviousTemplateSession(templateId: number, before: Date) {
  return readSessionSummaries(
    and(eq(workoutSessions.templateId, templateId), lt(workoutSessions.startedAt, before)),
    1,
  ).at(0);
}

export function useTags() {
  return useLiveData(() => db.select().from(tags).orderBy(asc(tags.name)).all(), ['tags'], 'tags');
}

export function useSessionTagIds(sessionId: number) {
  return useLiveData(
    () =>
      new Set(
        db
          .select({ id: sessionTags.tagId })
          .from(sessionTags)
          .where(eq(sessionTags.sessionId, sessionId))
          .all()
          .map((row) => row.id),
      ),
    ['session_tags'],
    sessionId,
  );
}

/** Current content of a workout template, to diff a session against it. */
export function readTemplateForUpdate(templateId: number) {
  const template = db
    .select({ id: workoutTemplates.id, name: workoutTemplates.name })
    .from(workoutTemplates)
    .where(and(eq(workoutTemplates.id, templateId), eq(workoutTemplates.isDraft, false)))
    .get();
  if (!template) return undefined;
  const items = db
    .select({
      id: templateExercises.id,
      exerciseId: templateExercises.exerciseId,
      restSeconds: templateExercises.restSeconds,
      name: exercises.name,
    })
    .from(templateExercises)
    .innerJoin(exercises, eq(exercises.id, templateExercises.exerciseId))
    .where(eq(templateExercises.templateId, templateId))
    .orderBy(asc(templateExercises.position))
    .all();
  return { ...template, items };
}
