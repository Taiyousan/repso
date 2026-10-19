import { asc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '@/db/client';
import { exercises } from '@/db/schema';

export function useExerciseList() {
  return useLiveQuery(db.select().from(exercises).orderBy(asc(exercises.name)));
}

export function useExercise(id: number) {
  const { data, ...rest } = useLiveQuery(
    db.select().from(exercises).where(eq(exercises.id, id)).limit(1),
    [id],
  );
  return { exercise: data[0] as (typeof data)[number] | undefined, ...rest };
}
