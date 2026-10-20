import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { db } from '@/db/client';
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

export function useExerciseList() {
  const { data, ...rest } = useLiveQuery(db.select().from(exercises));
  const sorted = useMemo(() => sortByName(data), [data]);
  return { data: sorted, ...rest };
}

export function useExercise(id: number) {
  const { data, ...rest } = useLiveQuery(
    db.select().from(exercises).where(eq(exercises.id, id)).limit(1),
    [id],
  );
  return { exercise: data[0] as (typeof data)[number] | undefined, ...rest };
}
