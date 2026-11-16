import { asc, desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { useLiveData } from '@/db/live';
import { bodyWeights } from '@/db/schema';
import type { WeighIn } from '@/domain/body-weight';

/** Every weigh-in, oldest first, as bodyWeightAt expects them. */
export function readWeighIns(): WeighIn[] {
  return db
    .select({ measuredAt: bodyWeights.measuredAt, weight: bodyWeights.weight })
    .from(bodyWeights)
    .orderBy(asc(bodyWeights.measuredAt), asc(bodyWeights.id))
    .all();
}

/** Weigh-ins, newest first, for the body weight screen. */
export function useBodyWeights() {
  return useLiveData(
    () =>
      db
        .select()
        .from(bodyWeights)
        .orderBy(desc(bodyWeights.measuredAt), desc(bodyWeights.id))
        .all(),
    ['body_weights'],
    'body-weights',
  );
}

/**
 * Saved at midnight of its day, so a weigh-in done after a workout still applies to it. A second
 * weigh-in on the same day replaces the first.
 */
export function addWeighIn(weight: number, day: Date): void {
  const measuredAt = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  db.transaction((tx) => {
    tx.delete(bodyWeights).where(eq(bodyWeights.measuredAt, measuredAt)).run();
    tx.insert(bodyWeights).values({ measuredAt, weight }).run();
  });
}

export function deleteWeighIn(id: number): void {
  db.delete(bodyWeights).where(eq(bodyWeights.id, id)).run();
}
