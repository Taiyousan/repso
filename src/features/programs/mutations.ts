import { eq, max } from 'drizzle-orm';

import { db } from '@/db/client';
import { programs, templateExercises, workoutTemplates } from '@/db/schema';

export type ProgramInput = { name: string; description: string | null };

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

/** Starts a hidden workout, filled in the creation screen then published or discarded. */
export function createDraftWorkoutTemplate(programId: number): number {
  const last = db
    .select({ value: max(workoutTemplates.position) })
    .from(workoutTemplates)
    .where(eq(workoutTemplates.programId, programId))
    .get();
  return db
    .insert(workoutTemplates)
    .values({ programId, name: '', position: (last?.value ?? -1) + 1, isDraft: true })
    .returning({ id: workoutTemplates.id })
    .get().id;
}

export function publishWorkoutTemplate(id: number, name: string): void {
  db.update(workoutTemplates)
    .set({ name, isDraft: false })
    .where(eq(workoutTemplates.id, id))
    .run();
}

/** Drafts left by an interrupted creation (app closed meanwhile). */
export function discardDraftWorkoutTemplates(): void {
  db.delete(workoutTemplates).where(eq(workoutTemplates.isDraft, true)).run();
}

export function renameWorkoutTemplate(id: number, name: string): void {
  db.update(workoutTemplates).set({ name }).where(eq(workoutTemplates.id, id)).run();
}

export function deleteWorkoutTemplate(id: number): void {
  db.delete(workoutTemplates).where(eq(workoutTemplates.id, id)).run();
}

export function reorderWorkoutTemplates(orderedIds: number[]): void {
  db.transaction((tx) => {
    orderedIds.forEach((id, position) => {
      tx.update(workoutTemplates).set({ position }).where(eq(workoutTemplates.id, id)).run();
    });
  });
}

// ---------------------------------------------------------------------------
// Template exercises
// ---------------------------------------------------------------------------

/** Appends exercises in the given order. */
export function addExercisesToTemplate(templateId: number, exerciseIds: number[]): void {
  if (exerciseIds.length === 0) return;

  db.transaction((tx) => {
    const last = tx
      .select({ value: max(templateExercises.position) })
      .from(templateExercises)
      .where(eq(templateExercises.templateId, templateId))
      .get();
    const start = (last?.value ?? -1) + 1;
    tx.insert(templateExercises)
      .values(
        exerciseIds.map((exerciseId, index) => ({
          templateId,
          exerciseId,
          position: start + index,
        })),
      )
      .run();
  });
}

export function removeTemplateExercise(id: number): void {
  db.delete(templateExercises).where(eq(templateExercises.id, id)).run();
}

export function reorderTemplateExercises(orderedIds: number[]): void {
  db.transaction((tx) => {
    orderedIds.forEach((id, position) => {
      tx.update(templateExercises).set({ position }).where(eq(templateExercises.id, id)).run();
    });
  });
}

/** `null` falls back to the default rest time. */
export function setTemplateExerciseRest(id: number, restSeconds: number | null): void {
  db.update(templateExercises).set({ restSeconds }).where(eq(templateExercises.id, id)).run();
}

/** Free text such as "4 × 8-10"; empty clears it. */
export function setTemplateExerciseTarget(id: number, target: string): void {
  db.update(templateExercises)
    .set({ target: target.trim() || null })
    .where(eq(templateExercises.id, id))
    .run();
}
