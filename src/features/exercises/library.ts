import { eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { appMeta, exercises, type TrackingType } from '@/db/schema';
import libraryData from '@/data/exercise-library.json';

/** Bump when src/data/exercise-library.json changes, so installed apps re-import it. */
export const LIBRARY_VERSION = 1;
const LIBRARY_VERSION_KEY = 'exercise_library_version';

/** Same commit as scripts/build-exercise-library.mjs. Images are served by jsDelivr's CDN. */
const IMAGE_BASE_URL =
  'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/';

type LibraryExercise = Omit<typeof exercises.$inferInsert, 'id' | 'isCustom' | 'createdAt'> & {
  trackingType: TrackingType;
};

const library = libraryData as LibraryExercise[];

export function exerciseImageUrl(path: string): string {
  return IMAGE_BASE_URL + path;
}

/**
 * Imports the bundled library on first launch, and upserts it (by slug) when LIBRARY_VERSION
 * changes. Custom exercises use a `custom-` slug prefix and are never touched.
 */
export function seedExerciseLibrary(): void {
  const installed = db.select().from(appMeta).where(eq(appMeta.key, LIBRARY_VERSION_KEY)).get();
  if (installed?.value === String(LIBRARY_VERSION)) return;

  db.transaction((tx) => {
    const CHUNK_SIZE = 100;
    for (let i = 0; i < library.length; i += CHUNK_SIZE) {
      tx.insert(exercises)
        .values(library.slice(i, i + CHUNK_SIZE))
        .onConflictDoUpdate({
          target: exercises.slug,
          set: {
            name: sql`excluded.name`,
            primaryMuscles: sql`excluded.primary_muscles`,
            secondaryMuscles: sql`excluded.secondary_muscles`,
            equipment: sql`excluded.equipment`,
            category: sql`excluded.category`,
            force: sql`excluded.force`,
            level: sql`excluded.level`,
            mechanic: sql`excluded.mechanic`,
            instructions: sql`excluded.instructions`,
            images: sql`excluded.images`,
            trackingType: sql`excluded.tracking_type`,
          },
        })
        .run();
    }

    tx.insert(appMeta)
      .values({ key: LIBRARY_VERSION_KEY, value: String(LIBRARY_VERSION) })
      .onConflictDoUpdate({ target: appMeta.key, set: { value: String(LIBRARY_VERSION) } })
      .run();
  });
}
