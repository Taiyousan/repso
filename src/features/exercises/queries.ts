import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { db } from '@/db/client';
import { exercises } from '@/db/schema';

// SQLite's default collation sorts accented letters after "z" ("Écarté" after "Zercher").
const collator = new Intl.Collator('fr', { sensitivity: 'base' });

export function useExerciseList() {
  const { data, ...rest } = useLiveQuery(db.select().from(exercises));
  const sorted = useMemo(() => [...data].sort((a, b) => collator.compare(a.name, b.name)), [data]);
  return { data: sorted, ...rest };
}

export function useExercise(id: number) {
  const { data, ...rest } = useLiveQuery(
    db.select().from(exercises).where(eq(exercises.id, id)).limit(1),
    [id],
  );
  return { exercise: data[0] as (typeof data)[number] | undefined, ...rest };
}
