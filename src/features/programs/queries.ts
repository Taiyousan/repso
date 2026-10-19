import { asc, count, eq, inArray } from 'drizzle-orm';

import { db } from '@/db/client';
import { useLiveData } from '@/db/live';
import {
  exercises,
  programs,
  templateExercises,
  templateSets,
  workoutTemplates,
} from '@/db/schema';

import { mainMuscles } from './sets';

export function usePrograms() {
  return useLiveData(
    () => {
      const rows = db.select().from(programs).orderBy(asc(programs.createdAt)).all();
      const counts = db
        .select({ programId: workoutTemplates.programId, value: count() })
        .from(workoutTemplates)
        .groupBy(workoutTemplates.programId)
        .all();
      const countByProgram = new Map(counts.map((row) => [row.programId, row.value]));
      return rows.map((program) => ({
        ...program,
        workoutCount: countByProgram.get(program.id) ?? 0,
      }));
    },
    ['programs', 'workout_templates'],
    'programs',
  );
}

export function useProgram(id: number) {
  return useLiveData(
    () => {
      const program = db.select().from(programs).where(eq(programs.id, id)).get();
      if (!program) return undefined;

      const templates = db
        .select()
        .from(workoutTemplates)
        .where(eq(workoutTemplates.programId, id))
        .orderBy(asc(workoutTemplates.position))
        .all();
      const templateIds = templates.map((template) => template.id);

      const items =
        templateIds.length === 0
          ? []
          : db
              .select({
                templateId: templateExercises.templateId,
                primaryMuscles: exercises.primaryMuscles,
              })
              .from(templateExercises)
              .innerJoin(exercises, eq(exercises.id, templateExercises.exerciseId))
              .where(inArray(templateExercises.templateId, templateIds))
              .all();

      const setCounts =
        templateIds.length === 0
          ? []
          : db
              .select({ templateId: templateExercises.templateId, value: count() })
              .from(templateSets)
              .innerJoin(
                templateExercises,
                eq(templateExercises.id, templateSets.templateExerciseId),
              )
              .where(inArray(templateExercises.templateId, templateIds))
              .groupBy(templateExercises.templateId)
              .all();
      const setCountByTemplate = new Map(setCounts.map((row) => [row.templateId, row.value]));

      return {
        ...program,
        workouts: templates.map((template) => {
          const templateItems = items.filter((item) => item.templateId === template.id);
          return {
            ...template,
            exerciseCount: templateItems.length,
            setCount: setCountByTemplate.get(template.id) ?? 0,
            muscles: mainMuscles(templateItems),
          };
        }),
      };
    },
    ['programs', 'workout_templates', 'template_exercises', 'template_sets'],
    id,
  );
}

export function useWorkoutTemplate(id: number) {
  return useLiveData(
    () => {
      const template = db.select().from(workoutTemplates).where(eq(workoutTemplates.id, id)).get();
      if (!template) return undefined;

      const program = db
        .select({ name: programs.name })
        .from(programs)
        .where(eq(programs.id, template.programId))
        .get();

      const rows = db
        .select({ item: templateExercises, exercise: exercises })
        .from(templateExercises)
        .innerJoin(exercises, eq(exercises.id, templateExercises.exerciseId))
        .where(eq(templateExercises.templateId, id))
        .orderBy(asc(templateExercises.position))
        .all();
      const itemIds = rows.map((row) => row.item.id);

      const sets =
        itemIds.length === 0
          ? []
          : db
              .select()
              .from(templateSets)
              .where(inArray(templateSets.templateExerciseId, itemIds))
              .orderBy(asc(templateSets.position))
              .all();

      return {
        ...template,
        programName: program?.name ?? '',
        exercises: rows.map(({ item, exercise }) => ({
          ...item,
          exercise,
          sets: sets.filter((set) => set.templateExerciseId === item.id),
        })),
      };
    },
    ['workout_templates', 'template_exercises', 'template_sets'],
    id,
  );
}

export type WorkoutTemplateDetail = NonNullable<ReturnType<typeof useWorkoutTemplate>>;
export type TemplateExerciseDetail = WorkoutTemplateDetail['exercises'][number];
