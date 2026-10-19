import { and, asc, desc, eq, gt, inArray, lt, max } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  exercises,
  programs,
  templateExercises,
  templateSets,
  workoutTemplates,
} from '@/db/schema';

import { defaultSets, nextSet, type TemplateSetValues } from './sets';

export type ProgramInput = { name: string; description: string | null };

export type MoveDirection = 'up' | 'down';

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

export function createProgram(input: ProgramInput): number {
  return db.insert(programs).values(input).returning({ id: programs.id }).get().id;
}

export function updateProgram(id: number, input: ProgramInput): void {
  db.update(programs)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(programs.id, id))
    .run();
}

/** Also deletes its workouts; past sessions are kept, detached from the template. */
export function deleteProgram(id: number): void {
  db.delete(programs).where(eq(programs.id, id)).run();
}

// ---------------------------------------------------------------------------
// Workout templates
// ---------------------------------------------------------------------------

export function createWorkoutTemplate(programId: number, name: string): number {
  const last = db
    .select({ value: max(workoutTemplates.position) })
    .from(workoutTemplates)
    .where(eq(workoutTemplates.programId, programId))
    .get();
  return db
    .insert(workoutTemplates)
    .values({ programId, name, position: (last?.value ?? -1) + 1 })
    .returning({ id: workoutTemplates.id })
    .get().id;
}

export function renameWorkoutTemplate(id: number, name: string): void {
  db.update(workoutTemplates).set({ name }).where(eq(workoutTemplates.id, id)).run();
}

export function deleteWorkoutTemplate(id: number): void {
  db.delete(workoutTemplates).where(eq(workoutTemplates.id, id)).run();
}

export function moveWorkoutTemplate(id: number, direction: MoveDirection): void {
  db.transaction((tx) => {
    const current = tx.select().from(workoutTemplates).where(eq(workoutTemplates.id, id)).get();
    if (!current) return;
    const neighbor = tx
      .select()
      .from(workoutTemplates)
      .where(
        and(
          eq(workoutTemplates.programId, current.programId),
          direction === 'up'
            ? lt(workoutTemplates.position, current.position)
            : gt(workoutTemplates.position, current.position),
        ),
      )
      .orderBy(
        direction === 'up' ? desc(workoutTemplates.position) : asc(workoutTemplates.position),
      )
      .limit(1)
      .get();
    if (!neighbor) return;
    tx.update(workoutTemplates)
      .set({ position: neighbor.position })
      .where(eq(workoutTemplates.id, current.id))
      .run();
    tx.update(workoutTemplates)
      .set({ position: current.position })
      .where(eq(workoutTemplates.id, neighbor.id))
      .run();
  });
}

// ---------------------------------------------------------------------------
// Template exercises
// ---------------------------------------------------------------------------

/** Appends exercises in the given order, each with default sets for its tracking type. */
export function addExercisesToTemplate(templateId: number, exerciseIds: number[]): void {
  if (exerciseIds.length === 0) return;

  db.transaction((tx) => {
    const last = tx
      .select({ value: max(templateExercises.position) })
      .from(templateExercises)
      .where(eq(templateExercises.templateId, templateId))
      .get();
    let position = (last?.value ?? -1) + 1;

    const rows = tx
      .select({ id: exercises.id, trackingType: exercises.trackingType })
      .from(exercises)
      .where(inArray(exercises.id, exerciseIds))
      .all();
    const trackingTypeById = new Map(rows.map((row) => [row.id, row.trackingType]));

    for (const exerciseId of exerciseIds) {
      const trackingType = trackingTypeById.get(exerciseId);
      if (!trackingType) continue;
      const item = tx
        .insert(templateExercises)
        .values({ templateId, exerciseId, position: position++ })
        .returning({ id: templateExercises.id })
        .get();
      tx.insert(templateSets)
        .values(
          defaultSets(trackingType).map((set, index) => ({
            ...set,
            templateExerciseId: item.id,
            position: index,
          })),
        )
        .run();
    }
  });
}

export function removeTemplateExercise(id: number): void {
  db.delete(templateExercises).where(eq(templateExercises.id, id)).run();
}

export function moveTemplateExercise(id: number, direction: MoveDirection): void {
  db.transaction((tx) => {
    const current = tx.select().from(templateExercises).where(eq(templateExercises.id, id)).get();
    if (!current) return;
    const neighbor = tx
      .select()
      .from(templateExercises)
      .where(
        and(
          eq(templateExercises.templateId, current.templateId),
          direction === 'up'
            ? lt(templateExercises.position, current.position)
            : gt(templateExercises.position, current.position),
        ),
      )
      .orderBy(
        direction === 'up' ? desc(templateExercises.position) : asc(templateExercises.position),
      )
      .limit(1)
      .get();
    if (!neighbor) return;
    tx.update(templateExercises)
      .set({ position: neighbor.position })
      .where(eq(templateExercises.id, current.id))
      .run();
    tx.update(templateExercises)
      .set({ position: current.position })
      .where(eq(templateExercises.id, neighbor.id))
      .run();
  });
}

/** `null` falls back to the default rest time. */
export function setTemplateExerciseRest(id: number, restSeconds: number | null): void {
  db.update(templateExercises).set({ restSeconds }).where(eq(templateExercises.id, id)).run();
}

// ---------------------------------------------------------------------------
// Template sets
// ---------------------------------------------------------------------------

export function addTemplateSet(templateExerciseId: number): void {
  db.transaction((tx) => {
    const item = tx
      .select({ trackingType: exercises.trackingType })
      .from(templateExercises)
      .innerJoin(exercises, eq(exercises.id, templateExercises.exerciseId))
      .where(eq(templateExercises.id, templateExerciseId))
      .get();
    if (!item) return;
    const last = tx
      .select()
      .from(templateSets)
      .where(eq(templateSets.templateExerciseId, templateExerciseId))
      .orderBy(desc(templateSets.position))
      .limit(1)
      .get();
    const values = nextSet(last, item.trackingType);
    tx.insert(templateSets)
      .values({
        type: values.type,
        targetReps: values.targetReps,
        targetWeight: values.targetWeight,
        targetDurationSeconds: values.targetDurationSeconds,
        templateExerciseId,
        position: (last?.position ?? -1) + 1,
      })
      .run();
  });
}

export function updateTemplateSet(id: number, values: Partial<TemplateSetValues>): void {
  db.update(templateSets).set(values).where(eq(templateSets.id, id)).run();
}

export function removeTemplateSet(id: number): void {
  db.delete(templateSets).where(eq(templateSets.id, id)).run();
}
