import { Directory, File, Paths } from 'expo-file-system';

import { db } from '@/db/client';
import { exercises } from '@/db/schema';

/**
 * Photos of custom exercises are copied into the app's documents (a picked file can disappear),
 * and saved in the `images` column as "local:<file name>": the documents path can change, e.g.
 * after a restore on another phone.
 */
export const LOCAL_IMAGE_PREFIX = 'local:';

/** Two images play as a start and end position, like the library's. */
export const MAX_EXERCISE_IMAGES = 2;

export const imageDirectory = () => new Directory(Paths.document, 'exercise-images');

export const isLocalImage = (path: string) => path.startsWith(LOCAL_IMAGE_PREFIX);
export const localImageName = (path: string) => path.slice(LOCAL_IMAGE_PREFIX.length);

export function localImageFile(name: string): File {
  return new File(imageDirectory(), name);
}

/** Removes the copies no exercise uses anymore: removed from a form, or from a deleted exercise. */
export function pruneExerciseImages(): void {
  const directory = imageDirectory();
  if (!directory.exists) return;
  const used = new Set(
    db
      .select({ images: exercises.images })
      .from(exercises)
      .all()
      .flatMap((row) => row.images.filter(isLocalImage).map(localImageName)),
  );
  for (const item of directory.list()) {
    if (item instanceof File && !used.has(item.name)) item.delete();
  }
}

/** Contents of the local images among `paths`, for a backup; missing files are skipped. */
export function readLocalImages(paths: string[]): { name: string; base64: string }[] {
  return paths.filter(isLocalImage).flatMap((path) => {
    const file = localImageFile(localImageName(path));
    return file.exists ? [{ name: file.name, base64: file.base64Sync() }] : [];
  });
}

/** Writes images back from a backup. */
export function writeLocalImages(images: { name: string; base64: string }[]): void {
  if (images.length === 0) return;
  imageDirectory().create({ idempotent: true, intermediates: true });
  for (const { name, base64 } of images) {
    const file = localImageFile(name);
    if (!file.exists) file.create();
    file.writeSync(base64, { encoding: 'base64' });
  }
}
