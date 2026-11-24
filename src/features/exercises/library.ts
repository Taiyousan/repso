import { eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { useLiveData } from '@/db/live';
import { appMeta, exercises } from '@/db/schema';

import type { LibraryExercise } from './library-format';
import { libraryImageUrl } from './library-images';
import { isLocalImage, localImageFile, localImageName } from './local-images';

/**
 * Bump when src/data/exercise-library.json changes: installed apps re-import it, from the site
 * once it is deployed (remote-library.ts), from the app itself after an update.
 */
export const LIBRARY_VERSION = 9;
const LIBRARY_VERSION_KEY = 'exercise_library_version';

/** An image is a photo kept on the phone or an image of the library. */
export function exerciseImageUrl(path: string): string {
  if (isLocalImage(path)) return localImageFile(localImageName(path)).uri;
  return libraryImageUrl(path);
}

/** Version of the library in the database, 0 before the first launch. */
export function readInstalledLibraryVersion(): number {
  const installed = db.select().from(appMeta).where(eq(appMeta.key, LIBRARY_VERSION_KEY)).get();
  return Number(installed?.value ?? 0);
}

export function useInstalledLibraryVersion(): number {
  return useLiveData(readInstalledLibraryVersion, ['app_meta'], 'library-version');
}

/**
 * Imports the bundled library on first launch, and when the app brings a newer one than the
 * installed library (which can also come from the site).
 */
export function seedExerciseLibrary(): void {
  if (readInstalledLibraryVersion() >= LIBRARY_VERSION) return;

  // Required here rather than imported: ~1 MB of JSON that would otherwise be evaluated at every
  // launch, while it only serves on the first one and after an update of the library.
  installLibrary(require('@/data/exercise-library.json') as LibraryExercise[], LIBRARY_VERSION);
}

/**
 * Upserts the library by slug and records its version, in one transaction. Custom exercises use a
 * `custom-` slug prefix and are never touched; exercises dropped from the library stay, as
 * programs and workouts may use them.
 */
export function installLibrary(library: LibraryExercise[], version: number): void {
  db.transaction((tx) => {
    const CHUNK_SIZE = 100;
    for (let i = 0; i < library.length; i += CHUNK_SIZE) {
      tx.insert(exercises)
        .values(library.slice(i, i + CHUNK_SIZE))
        .onConflictDoUpdate({
          target: exercises.slug,
          set: {
            name: sql`excluded.name`,
            nameEn: sql`excluded.name_en`,
            primaryMuscles: sql`excluded.primary_muscles`,
            secondaryMuscles: sql`excluded.secondary_muscles`,
            equipment: sql`excluded.equipment`,
            category: sql`excluded.category`,
            force: sql`excluded.force`,
            level: sql`excluded.level`,
            mechanic: sql`excluded.mechanic`,
            instructions: sql`excluded.instructions`,
            instructionsLanguage: sql`excluded.instructions_language`,
            images: sql`excluded.images`,
            trackingType: sql`excluded.tracking_type`,
            isEssential: sql`excluded.is_essential`,
          },
        })
        .run();
    }

    tx.insert(appMeta)
      .values({ key: LIBRARY_VERSION_KEY, value: String(version) })
      .onConflictDoUpdate({ target: appMeta.key, set: { value: String(version) } })
      .run();
  });
}
