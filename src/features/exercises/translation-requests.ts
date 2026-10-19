import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '@/db/client';
import { exercises, translationRequests } from '@/db/schema';

export function useTranslationRequested(exerciseId: number): boolean {
  const { data } = useLiveQuery(
    db
      .select({ exerciseId: translationRequests.exerciseId })
      .from(translationRequests)
      .where(eq(translationRequests.exerciseId, exerciseId)),
    [exerciseId],
  );
  return data.length > 0;
}

export function setTranslationRequested(exerciseId: number, requested: boolean): void {
  if (requested) {
    db.insert(translationRequests).values({ exerciseId }).onConflictDoNothing().run();
  } else {
    db.delete(translationRequests).where(eq(translationRequests.exerciseId, exerciseId)).run();
  }
}

export function useTranslationRequests() {
  return useLiveQuery(
    db
      .select({
        slug: exercises.slug,
        name: exercises.name,
        nameEn: exercises.nameEn,
        requestedAt: translationRequests.requestedAt,
      })
      .from(translationRequests)
      .innerJoin(exercises, eq(exercises.id, translationRequests.exerciseId))
      .orderBy(desc(translationRequests.requestedAt)),
  );
}

export function clearTranslationRequests(): void {
  db.delete(translationRequests).run();
}

/** JSON shared from the settings screen; slugs match src/data/exercise-instructions.fr.json. */
export function buildTranslationRequestsExport(
  requests: { slug: string; name: string; nameEn: string | null }[],
): string {
  return JSON.stringify(
    {
      type: 'translation-requests',
      version: 1,
      exportedAt: new Date().toISOString(),
      exercises: requests.map(({ slug, name, nameEn }) => ({ slug, name, nameEn })),
    },
    null,
    2,
  );
}
