import { and, asc, eq, inArray } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, programs, templateExercises, workoutTemplates } from '@/db/schema';

import { type ProgramFileExercise, serializeProgramFile } from './format';

/** Program file shared from the program screen, or null if the program no longer exists. */
export function exportProgram(programId: number): { name: string; json: string } | null {
  const program = db.select().from(programs).where(eq(programs.id, programId)).get();
  if (!program) return null;

  const templates = db
    .select()
    .from(workoutTemplates)
    .where(and(eq(workoutTemplates.programId, programId), eq(workoutTemplates.isDraft, false)))
    .orderBy(asc(workoutTemplates.position))
    .all();
  const rows =
    templates.length === 0
      ? []
      : db
          .select({ item: templateExercises, exercise: exercises })
          .from(templateExercises)
          .innerJoin(exercises, eq(exercises.id, templateExercises.exerciseId))
          .where(
            inArray(
              templateExercises.templateId,
              templates.map((template) => template.id),
            ),
          )
          .orderBy(asc(templateExercises.position))
          .all();

  const toEntry = ({ item, exercise }: (typeof rows)[number]): ProgramFileExercise => ({
    slug: exercise.slug,
    name: exercise.name,
    ...(item.restSeconds !== null ? { restSeconds: item.restSeconds } : {}),
    ...(item.target ? { target: item.target } : {}),
    // Another phone won't have the custom exercise: its definition lets the import recreate it.
    ...(exercise.isCustom
      ? {
          primaryMuscles: exercise.primaryMuscles,
          secondaryMuscles: exercise.secondaryMuscles,
          ...(exercise.equipment ? { equipment: exercise.equipment } : {}),
          trackingType: exercise.trackingType,
        }
      : {}),
  });

  const json = serializeProgramFile(
    {
      name: program.name,
      ...(program.description ? { description: program.description } : {}),
      workouts: templates.map((template) => ({
        name: template.name,
        exercises: rows.filter((row) => row.item.templateId === template.id).map(toEntry),
      })),
    },
    new Date(),
  );
  return { name: program.name, json };
}
