/**
 * Photos kept in this repository for exercises of the library: src/data/exercise-images/<slug>/
 * holds the frames of that exercise (0.jpg, 1.jpg…, in name order) and replaces its images.
 *
 * The site publishes each photo under a name holding a hash of its content, so a changed photo
 * gets a new URL and every URL can be cached forever. Shared by scripts/build-exercise-library.mjs,
 * which writes those URLs into the library, and the site, which publishes the files.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

/** Same address as site/astro.config.mjs. */
export const EXERCISE_IMAGES_URL = 'https://repso-app-android.vercel.app/exercise-images/';

const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
/** Left by the file explorers of Windows and macOS. */
const SYSTEM_FILES = /^(\..*|Thumbs\.db|desktop\.ini)$/i;
/** Each photo is downloaded by every phone: about 800 px wide is plenty. */
const MAX_BYTES = 500_000;

/**
 * The photos of src/data/exercise-images/ (`directory`), by exercise slug:
 * { file: "<slug>/0.<hash>.jpg", content }[], in frame order.
 */
export function readExerciseImages(directory) {
  const images = new Map();
  if (!existsSync(directory)) return images;

  for (const slug of readdirSync(directory)) {
    const frames = readdirSync(join(directory, slug))
      .filter((name) => !SYSTEM_FILES.test(name))
      .sort();
    images.set(
      slug,
      frames.map((name) => {
        const extension = extname(name).toLowerCase();
        if (!EXTENSIONS.includes(extension)) {
          throw new Error(`exercise-images/${slug}/${name}: expected ${EXTENSIONS.join(', ')}`);
        }
        const content = readFileSync(join(directory, slug, name));
        if (content.length > MAX_BYTES) {
          throw new Error(
            `exercise-images/${slug}/${name}: ${Math.round(content.length / 1000)} kB, ` +
              `resize it under ${MAX_BYTES / 1000} kB`,
          );
        }
        const hash = createHash('sha256').update(content).digest('hex').slice(0, 10);
        const frame = name.slice(0, -extname(name).length);
        return { file: `${slug}/${frame}.${hash}${extension}`, content };
      }),
    );
  }
  return images;
}
