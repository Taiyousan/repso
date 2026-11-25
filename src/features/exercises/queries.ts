import { eq } from 'drizzle-orm';
import { useMemo } from 'react';

import { db } from '@/db/client';
import { useLiveData } from '@/db/live';
import { exercises } from '@/db/schema';
import { normalizeText } from '@/lib/text';

/**
 * SQLite's default collation sorts accented letters after "z" ("Écarté" after "Zercher").
 * Sorting on accent-free keys computed once avoids ~10k Intl.Collator calls, slow on Hermes.
 */
function sortByName<T extends { name: string }>(items: T[]): T[] {
  return items
    .map((item) => ({ item, key: normalizeText(item.name) }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    .map(({ item }) => item);
}

/*
 * Not Drizzle's useLiveQuery: it re-runs its query once per changed row, so installing the
 * library (~900 upserted rows) queued ~900 reads of the whole table and as many renders, freezing
 * the app. useLiveData reads once per burst of writes.
 */

/** The library: every exercise but the hidden ones. */
export function useExerciseList() {
  const data = useLiveData(
    () => db.select().from(exercises).where(eq(exercises.isHidden, false)).all(),
    ['exercises'],
    'exercise-list',
  );
  const sorted = useMemo(() => sortByName(data), [data]);
  return { data: sorted };
}

export function useExercise(id: number) {
  const exercise = useLiveData(
    () => db.select().from(exercises).where(eq(exercises.id, id)).get(),
    ['exercises'],
    id,
  );
  return { exercise };
}
