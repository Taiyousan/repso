import { and, asc, desc, eq, inArray, isNull, max, notInArray } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  sessionExercises,
  sessionSets,
  sessionTags,
  type SetType,
  tags,
  templateExercises,
  workoutSessions,
  workoutTemplates,
} from '@/db/schema';
import { normalizeText } from '@/lib/text';

import { initialSetTypes, type SetPerformance } from './logic';
import { readPreviousPerformance } from './queries';
import type { PlannedItem } from './recap';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type NewSessionExercise = {
  exerciseId: number;
  sourceTemplateExerciseId: number | null;
  restSeconds: number | null;
};

/** Inserts exercises at the end of a session, each with as many sets as last time. */
function insertSessionExercises(
  tx: Transaction,
  sessionId: number,
  items: NewSessionExercise[],
  previous: Map<number, SetPerformance[]>,
) {
  const last = tx
    .select({ value: max(sessionExercises.position) })
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, sessionId))
    .get();
  let position = (last?.value ?? -1) + 1;

  for (const item of items) {
    const created = tx
      .insert(sessionExercises)
      .values({ ...item, sessionId, position: position++ })
      .returning({ id: sessionExercises.id })
      .get();
    const types = initialSetTypes(previous.get(item.exerciseId) ?? []);
    tx.insert(sessionSets)
      .values(
        types.map((type, index) => ({ sessionExerciseId: created.id, position: index, type })),
      )
      .run();
  }
}

/** Starts a session from a workout template (copying its exercises) or an empty free session. */
export function startSession(templateId: number | null): number {
  const items = templateId
    ? db
        .select()
        .from(templateExercises)
        .where(eq(templateExercises.templateId, templateId))
        .orderBy(asc(templateExercises.position))
        .all()
    : [];
  const previous = readPreviousPerformance(items.map((item) => item.exerciseId));

  return db.transaction((tx) => {
    const template = templateId
      ? tx.select().from(workoutTemplates).where(eq(workoutTemplates.id, templateId)).get()
      : undefined;
    const session = tx
      .insert(workoutSessions)
      .values({ templateId, name: template?.name ?? 'Séance libre', startedAt: new Date() })
      .returning({ id: workoutSessions.id })
      .get();
    insertSessionExercises(
      tx,
      session.id,
      items.map((item) => ({
        exerciseId: item.exerciseId,
        sourceTemplateExerciseId: item.id,
        restSeconds: item.restSeconds,
      })),
      previous,
    );
    return session.id;
  });
}

export function addExercisesToSession(sessionId: number, exerciseIds: number[]): void {
  if (exerciseIds.length === 0) return;
  const previous = readPreviousPerformance(exerciseIds, sessionId);
  db.transaction((tx) => {
    insertSessionExercises(
      tx,
      sessionId,
      exerciseIds.map((exerciseId) => ({
        exerciseId,
        sourceTemplateExerciseId: null,
        restSeconds: null,
      })),
      previous,
    );
  });
}

export function removeSessionExercise(id: number): void {
  db.delete(sessionExercises).where(eq(sessionExercises.id, id)).run();
}

export function reorderSessionExercises(orderedIds: number[]): void {
  db.transaction((tx) => {
    orderedIds.forEach((id, position) => {
      tx.update(sessionExercises).set({ position }).where(eq(sessionExercises.id, id)).run();
    });
  });
}

export function setSessionExerciseRest(id: number, restSeconds: number | null): void {
  db.update(sessionExercises).set({ restSeconds }).where(eq(sessionExercises.id, id)).run();
}

// ---------------------------------------------------------------------------
// Sets
// ---------------------------------------------------------------------------

/** New set after the last one, with the same type (a warm-up is followed by a working set). */
export function addSessionSet(sessionExerciseId: number): void {
  db.transaction((tx) => {
    const last = tx
      .select()
      .from(sessionSets)
      .where(eq(sessionSets.sessionExerciseId, sessionExerciseId))
      .orderBy(desc(sessionSets.position))
      .limit(1)
      .get();
    const type: SetType = !last || last.type === 'warmup' ? 'normal' : last.type;
    tx.insert(sessionSets)
      .values({ sessionExerciseId, position: (last?.position ?? -1) + 1, type })
      .run();
  });
}

/** Removes the last set that isn't validated yet, if any. */
export function removeLastPendingSet(sessionExerciseId: number): void {
  const last = db
    .select({ id: sessionSets.id })
    .from(sessionSets)
    .where(
      and(eq(sessionSets.sessionExerciseId, sessionExerciseId), isNull(sessionSets.completedAt)),
    )
    .orderBy(desc(sessionSets.position))
    .limit(1)
    .get();
  if (last) db.delete(sessionSets).where(eq(sessionSets.id, last.id)).run();
}

export type SetValues = Pick<SetPerformance, 'weight' | 'reps' | 'durationSeconds'>;

export function updateSessionSet(id: number, values: Partial<SetValues & { type: SetType }>): void {
  db.update(sessionSets).set(values).where(eq(sessionSets.id, id)).run();
}

export function completeSessionSet(id: number, values: SetValues): void {
  db.update(sessionSets)
    .set({ ...values, completedAt: new Date() })
    .where(eq(sessionSets.id, id))
    .run();
}

export function uncompleteSessionSet(id: number): void {
  db.update(sessionSets).set({ completedAt: null }).where(eq(sessionSets.id, id)).run();
}

// ---------------------------------------------------------------------------
// End of session
// ---------------------------------------------------------------------------

/** Keeps validated sets only, drops exercises left without any, and closes the session. */
export function finishSession(id: number): void {
  db.transaction((tx) => {
    const itemIds = tx
      .select({ id: sessionExercises.id })
      .from(sessionExercises)
      .where(eq(sessionExercises.sessionId, id))
      .all()
      .map((row) => row.id);

    if (itemIds.length > 0) {
      tx.delete(sessionSets)
        .where(
          and(inArray(sessionSets.sessionExerciseId, itemIds), isNull(sessionSets.completedAt)),
        )
        .run();
      const withSets = new Set(
        tx
          .select({ id: sessionSets.sessionExerciseId })
          .from(sessionSets)
          .where(inArray(sessionSets.sessionExerciseId, itemIds))
          .all()
          .map((row) => row.id),
      );
      const empty = itemIds.filter((itemId) => !withSets.has(itemId));
      if (empty.length > 0) {
        tx.delete(sessionExercises).where(inArray(sessionExercises.id, empty)).run();
      }
    }

    tx.update(workoutSessions).set({ endedAt: new Date() }).where(eq(workoutSessions.id, id)).run();
  });
}

/** Also used to delete a finished session from the history. */
export function discardSession(id: number): void {
  db.delete(workoutSessions).where(eq(workoutSessions.id, id)).run();
}

export function setSessionEffort(id: number, perceivedEffort: number | null): void {
  db.update(workoutSessions).set({ perceivedEffort }).where(eq(workoutSessions.id, id)).run();
}

export function setSessionNotes(id: number, notes: string): void {
  db.update(workoutSessions)
    .set({ notes: notes.trim() || null })
    .where(eq(workoutSessions.id, id))
    .run();
}

export function setSessionTag(sessionId: number, tagId: number, enabled: boolean): void {
  if (enabled) {
    db.insert(sessionTags).values({ sessionId, tagId }).onConflictDoNothing().run();
  } else {
    db.delete(sessionTags)
      .where(and(eq(sessionTags.sessionId, sessionId), eq(sessionTags.tagId, tagId)))
      .run();
  }
}

/** Tags the session, creating the tag unless one already has this name (ignoring case and accents). */
export function addSessionTagByName(sessionId: number, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  db.transaction((tx) => {
    const key = normalizeText(trimmed);
    const existing = tx
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .all()
      .find((tag) => normalizeText(tag.name) === key);
    const tagId =
      existing?.id ?? tx.insert(tags).values({ name: trimmed }).returning({ id: tags.id }).get().id;
    tx.insert(sessionTags).values({ sessionId, tagId }).onConflictDoNothing().run();
  });
}

/** Removes the tag from every session. */
export function deleteTag(id: number): void {
  db.delete(tags).where(eq(tags.id, id)).run();
}

/** Rewrites a workout template as planned from a session, and links the session to it. */
export function updateTemplateFromSession(templateId: number, plan: PlannedItem[]): void {
  db.transaction((tx) => {
    const kept = plan.flatMap((item) =>
      item.templateExerciseId == null ? [] : [item.templateExerciseId],
    );
    tx.delete(templateExercises)
      .where(
        and(
          eq(templateExercises.templateId, templateId),
          kept.length > 0 ? notInArray(templateExercises.id, kept) : undefined,
        ),
      )
      .run();

    plan.forEach((item, position) => {
      let templateExerciseId = item.templateExerciseId;
      if (templateExerciseId == null) {
        templateExerciseId = tx
          .insert(templateExercises)
          .values({
            templateId,
            exerciseId: item.exerciseId,
            position,
            restSeconds: item.restSeconds,
          })
          .returning({ id: templateExercises.id })
          .get().id;
      } else {
        tx.update(templateExercises)
          .set({ position, restSeconds: item.restSeconds })
          .where(eq(templateExercises.id, templateExerciseId))
          .run();
      }
      if (item.sessionExerciseId != null) {
        tx.update(sessionExercises)
          .set({ sourceTemplateExerciseId: templateExerciseId })
          .where(eq(sessionExercises.id, item.sessionExerciseId))
          .run();
      }
    });
  });
}
