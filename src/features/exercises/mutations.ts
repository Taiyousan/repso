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

/**
 * The timestamp suffix keeps slugs unique when two custom exercises share a name; `index`
 * separates exercises created in the same millisecond (program import).
 */
export function customExerciseSlug(name: string, index = 0): string {
  const suffix = Date.now().toString(36) + (index > 0 ? `-${index}` : '');
  return `custom-${slugify(name) || 'exercise'}-${suffix}`;
}

export function createCustomExercise(input: CustomExerciseInput): number {
  const created = db
    .insert(exercises)
    .values({ ...input, slug: customExerciseSlug(input.name), images: [], isCustom: true })
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
