import { and, asc, desc, eq, inArray, isNotNull, isNull, ne } from 'drizzle-orm';

import { db } from '@/db/client';
import { useLiveData } from '@/db/live';
import {
  exercises,
  programs,
  sessionExercises,
  sessionSets,
  templateExercises,
  workoutSessions,
  workoutTemplates,
} from '@/db/schema';

import type { SetPerformance } from './logic';

/**
 * Last finished performance of each exercise, whatever the session it was done in.
 * Finished sessions only keep completed sets, so every match has at least one set.
 */
export function readPreviousPerformance(
  exerciseIds: number[],
  excludeSessionId?: number,
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

      const previous = readPreviousPerformance(
        rows.map((row) => row.exercise.id),
        id,
      );

      return {
        ...session,
        exercises: rows.map(({ item, exercise, target }) => ({
          ...item,
          exercise,
          target,
          sets: sets.filter((set) => set.sessionExerciseId === item.id),
          previous: previous.get(exercise.id) ?? [],
        })),
      };
    },
    ['workout_sessions', 'session_exercises', 'session_sets'],
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
