import { and, count, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, sessionExercises, templateExercises, type TrackingType } from '@/db/schema';
import { slugify } from '@/lib/text';

export type CustomExerciseInput = {
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string | null;
  trackingType: TrackingType;
  instructions: string[];
};

export function createCustomExercise(input: CustomExerciseInput): number {
  // The timestamp suffix keeps slugs unique when two custom exercises share a name.
  const slug = `custom-${slugify(input.name) || 'exercise'}-${Date.now().toString(36)}`;
  const created = db
    .insert(exercises)
    .values({ ...input, slug, images: [], isCustom: true })
    .returning({ id: exercises.id })
    .get();
  return created.id;
}

export function updateCustomExercise(id: number, input: CustomExerciseInput): void {
  db.update(exercises)
    .set(input)
    .where(and(eq(exercises.id, id), eq(exercises.isCustom, true)))
    .run();
}

/** Number of programs and sessions referencing the exercise (which prevent its deletion). */
export function countExerciseUsages(id: number): number {
  const inTemplates = db
    .select({ value: count() })
    .from(templateExercises)
    .where(eq(templateExercises.exerciseId, id))
    .get();
  const inSessions = db
    .select({ value: count() })
    .from(sessionExercises)
    .where(eq(sessionExercises.exerciseId, id))
    .get();
  return (inTemplates?.value ?? 0) + (inSessions?.value ?? 0);
}

export function deleteCustomExercise(id: number): void {
  db.delete(exercises)
    .where(and(eq(exercises.id, id), eq(exercises.isCustom, true)))
    .run();
}
