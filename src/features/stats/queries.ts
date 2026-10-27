import { and, asc, eq, gte, isNotNull, ne, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { useLiveData } from '@/db/live';
import { exercises, sessionExercises, sessionSets, workoutSessions } from '@/db/schema';
import { periodStart, setsPerMuscle } from '@/domain/stats';

/** Working sets of finished sessions; finished sessions only keep completed sets. */
const workingSetOfFinishedSession = and(
  isNotNull(workoutSessions.endedAt),
  isNotNull(sessionSets.completedAt),
  ne(sessionSets.type, 'warmup'),
);

/** Working sets per muscle over the last `days` days, most trained first. */
export function useMuscleSets(days: number) {
  return useLiveData(
    () =>
      setsPerMuscle(
        db
          .select({
            primaryMuscles: exercises.primaryMuscles,
            secondaryMuscles: exercises.secondaryMuscles,
            sets: sql<number>`count(*)`,
          })
          .from(sessionSets)
          .innerJoin(sessionExercises, eq(sessionExercises.id, sessionSets.sessionExerciseId))
          .innerJoin(exercises, eq(exercises.id, sessionExercises.exerciseId))
          .innerJoin(workoutSessions, eq(workoutSessions.id, sessionExercises.sessionId))
          .where(
            and(workingSetOfFinishedSession, gte(workoutSessions.startedAt, periodStart(days))),
          )
          .groupBy(exercises.id)
          .all(),
      ),
    ['workout_sessions', 'session_exercises', 'session_sets', 'exercises'],
    `muscle-sets-${days}`,
  );
}

/** Working sets of an exercise with their session, oldest first, to chart its progress. */
export function useExerciseProgressSets(exerciseId: number) {
  return useLiveData(
    () =>
      db
        .select({
          sessionId: workoutSessions.id,
          at: workoutSessions.startedAt,
          type: sessionSets.type,
          weight: sessionSets.weight,
          reps: sessionSets.reps,
          durationSeconds: sessionSets.durationSeconds,
        })
        .from(sessionSets)
        .innerJoin(sessionExercises, eq(sessionExercises.id, sessionSets.sessionExerciseId))
        .innerJoin(workoutSessions, eq(workoutSessions.id, sessionExercises.sessionId))
        .where(and(eq(sessionExercises.exerciseId, exerciseId), workingSetOfFinishedSession))
        .orderBy(asc(workoutSessions.startedAt))
        .all(),
    ['workout_sessions', 'session_exercises', 'session_sets'],
    `progress-${exerciseId}`,
  );
}
