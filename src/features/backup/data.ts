import { eq, isNotNull } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';

import { db } from '@/db/client';
import { useLiveData } from '@/db/live';
import {
  appMeta,
  exercises,
  programs,
  sessionExercises,
  sessionSets,
  sessionTags,
  tags,
  templateExercises,
  workoutSessions,
  workoutTemplates,
} from '@/db/schema';

import type { BackupData } from './format';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const LAST_BACKUP_KEY = 'last_backup_at';

/** Everything the user entered, apart from the running workout. */
export function readBackupData(): BackupData {
  const allExercises = db.select().from(exercises).all();
  const slugs = new Map(allExercises.map((exercise) => [exercise.id, exercise.slug]));
  const slugOf = (id: number) => slugs.get(id)!;

  const templates = db
    .select()
    .from(workoutTemplates)
    .all()
    .flatMap(({ isDraft, ...template }) => (isDraft ? [] : [template]));
  const templateIds = new Set(templates.map((template) => template.id));
  const items = db
    .select()
    .from(templateExercises)
    .all()
    .filter((item) => templateIds.has(item.templateId));

  const sessions = db
    .select()
    .from(workoutSessions)
    .where(isNotNull(workoutSessions.endedAt))
    .all() as BackupData['workoutSessions'];
  const sessionIds = new Set(sessions.map((session) => session.id));
  const performed = db
    .select()
    .from(sessionExercises)
    .all()
    .filter((item) => sessionIds.has(item.sessionId));
  const performedIds = new Set(performed.map((item) => item.id));

  const used = new Set([...items, ...performed].map((item) => item.exerciseId));

  return {
    exercises: allExercises.flatMap(({ id, ...exercise }) =>
      exercise.isCustom || used.has(id) ? [exercise] : [],
    ),
    programs: db.select().from(programs).all(),
    workoutTemplates: templates,
    templateExercises: items.map(({ exerciseId, ...item }) => ({
      ...item,
      exerciseSlug: slugOf(exerciseId),
    })),
    workoutSessions: sessions,
    sessionExercises: performed.map(({ exerciseId, ...item }) => ({
      ...item,
      exerciseSlug: slugOf(exerciseId),
    })),
    sessionSets: db
      .select()
      .from(sessionSets)
      .all()
      .filter((set) => performedIds.has(set.sessionExerciseId)),
    tags: db.select().from(tags).all(),
    sessionTags: db
      .select()
      .from(sessionTags)
      .all()
      .filter((tag) => sessionIds.has(tag.sessionId)),
  };
}

function insertAll<T extends SQLiteTable>(tx: Transaction, table: T, rows: T['$inferInsert'][]) {
  const CHUNK_SIZE = 100;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    tx.insert(table)
      .values(rows.slice(i, i + CHUNK_SIZE) as never)
      .run();
  }
}

/**
 * Replaces all the user's data with the backup. A single transaction: on any error, nothing
 * changes. The caller makes sure no workout is running, as it would be deleted too.
 */
export function restoreBackupData(data: BackupData): void {
  db.transaction((tx) => {
    // Cascades to everything below them, and frees the exercises.
    tx.delete(workoutSessions).run();
    tx.delete(tags).run();
    tx.delete(programs).run();
    tx.delete(exercises).where(eq(exercises.isCustom, true)).run();

    const installed = new Set(
      tx
        .select({ slug: exercises.slug })
        .from(exercises)
        .all()
        .map((exercise) => exercise.slug),
    );
    insertAll(
      tx,
      exercises,
      data.exercises.filter((exercise) => !installed.has(exercise.slug)),
    );
    const ids = new Map(
      tx
        .select({ id: exercises.id, slug: exercises.slug })
        .from(exercises)
        .all()
        .map((exercise) => [exercise.slug, exercise.id]),
    );
    const idOf = (slug: string) => ids.get(slug)!;

    insertAll(tx, programs, data.programs);
    insertAll(tx, workoutTemplates, data.workoutTemplates);
    insertAll(
      tx,
      templateExercises,
      data.templateExercises.map(({ exerciseSlug, ...item }) => ({
        ...item,
        exerciseId: idOf(exerciseSlug),
      })),
    );
    insertAll(tx, workoutSessions, data.workoutSessions);
    insertAll(
      tx,
      sessionExercises,
      data.sessionExercises.map(({ exerciseSlug, ...item }) => ({
        ...item,
        exerciseId: idOf(exerciseSlug),
      })),
    );
    insertAll(tx, sessionSets, data.sessionSets);
    insertAll(tx, tags, data.tags);
    insertAll(tx, sessionTags, data.sessionTags);
  });
}

function readLastBackup(): Date | null {
  const row = db.select().from(appMeta).where(eq(appMeta.key, LAST_BACKUP_KEY)).get();
  return row ? new Date(Number(row.value)) : null;
}

export function useLastBackup(): Date | null {
  return useLiveData(readLastBackup, ['app_meta'], 'last-backup');
}

export function markBackupDone(): void {
  const value = String(Date.now());
  db.insert(appMeta)
    .values({ key: LAST_BACKUP_KEY, value })
    .onConflictDoUpdate({ target: appMeta.key, set: { value } })
    .run();
}
