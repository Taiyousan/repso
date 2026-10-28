import { db } from '@/db/client';
import { exercises, programs, templateExercises, workoutTemplates } from '@/db/schema';
import { customExerciseSlug } from '@/features/exercises/mutations';

import type { ProgramFileProgram } from './format';
import { refKey, type ImportRef, type Resolution } from './plan';

/** Creates the program, its workouts and the missing custom exercises in one transaction. */
export function importProgram(
  program: ProgramFileProgram,
  refs: ImportRef[],
  resolutions: Record<string, Resolution>,
): number {
  return db.transaction((tx) => {
    const exerciseIds = new Map<string, number>();
    refs.forEach((ref, index) => {
      const resolution = resolutions[ref.key];
      if (resolution?.kind === 'library') {
        exerciseIds.set(ref.key, resolution.exerciseId);
      } else if (resolution?.kind === 'create') {
        const { entry } = ref;
        const created = tx
          .insert(exercises)
          .values({
            slug: customExerciseSlug(ref.label, index),
            name: ref.label,
            primaryMuscles: entry.primaryMuscles ?? [],
            secondaryMuscles: entry.secondaryMuscles ?? [],
            equipment: entry.equipment ?? null,
            trackingType: entry.trackingType ?? 'weight_reps',
            instructions: [],
            images: [],
            isCustom: true,
          })
          .returning({ id: exercises.id })
          .get();
        exerciseIds.set(ref.key, created.id);
      }
    });

    const programId = tx
      .insert(programs)
      .values({ name: program.name, description: program.description ?? null })
      .returning({ id: programs.id })
      .get().id;

    program.workouts.forEach((workout, position) => {
      const templateId = tx
        .insert(workoutTemplates)
        .values({ programId, name: workout.name, position })
        .returning({ id: workoutTemplates.id })
        .get().id;

      const items = workout.exercises.flatMap((entry) => {
        const exerciseId = exerciseIds.get(refKey(entry));
        return exerciseId === undefined
          ? []
          : [{ exerciseId, restSeconds: entry.restSeconds ?? null, target: entry.target ?? null }];
      });
      if (items.length === 0) return;
      tx.insert(templateExercises)
        .values(items.map((item, index) => ({ ...item, templateId, position: index })))
        .run();
    });

    return programId;
  });
}
