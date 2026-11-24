import {
  CONTENT_LANGUAGES,
  type ContentLanguage,
  type exercises,
  TRACKING_TYPES,
  type TrackingType,
} from '@/db/schema';

/**
 * The exercise library, bundled in the app (src/data/exercise-library.json) and published by the
 * site (site/src/pages/library/) so installed apps get its updates without a new build:
 * - /library/manifest.json: { format, version, url, removed } — a few bytes, read first
 * - /library/v<version>.json: the library itself, downloaded only when its version is newer
 *
 * `removed` (src/data/exercise-removed.json) lists the exercises taken out of the library, by slug,
 * each with the slug of the exercise replacing it or null. Apps before it ignore the key.
 */
export const LIBRARY_FORMAT = 'repso.library';

export type LibraryExercise = Omit<
  typeof exercises.$inferInsert,
  'id' | 'isCustom' | 'createdAt'
> & {
  trackingType: TrackingType;
  instructionsLanguage: ContentLanguage;
};

/** Slug of a removed exercise → slug of its replacement, or null. */
export type RemovedExercises = Record<string, string | null>;

export type LibraryManifest = { version: number; url: string; removed: RemovedExercises };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Null when it isn't a manifest this app understands. */
export function parseLibraryManifest(value: unknown): LibraryManifest | null {
  if (!isRecord(value) || value.format !== LIBRARY_FORMAT) return null;
  const { version, url } = value;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return null;
  // A file next to the manifest: the app never follows a link elsewhere.
  if (typeof url !== 'string' || !/^v\d+\.json$/.test(url)) return null;
  const removed = parseRemovedExercises(value.removed ?? {});
  if (!removed) return null;
  return { version, url, removed };
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isLibrarySlug = (value: unknown): value is string =>
  typeof value === 'string' && SLUG.test(value) && !value.startsWith('custom-');

/**
 * Null when anything is wrong: a custom slug (never removed by the library), a replacement that is
 * itself removed (it would be deleted right after) or an exercise replaced by itself.
 */
export function parseRemovedExercises(value: unknown): RemovedExercises | null {
  if (!isRecord(value)) return null;
  const removed: RemovedExercises = {};
  for (const [slug, replacement] of Object.entries(value)) {
    if (!isLibrarySlug(slug)) return null;
    if (replacement !== null && (!isLibrarySlug(replacement) || replacement in value)) return null;
    removed[slug] = replacement;
  }
  return removed;
}

const isString = (value: unknown): value is string => typeof value === 'string';
const isOptionalString = (value: unknown) => value === null || isString(value);
const isStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);

/**
 * A path in free-exercise-db (no segment starting with a dot, so never "..") or a full https URL;
 * never a photo of the phone ("local:").
 */
const isImagePath = (path: string) =>
  path.startsWith('https://') || /^[\w-][\w.-]*(\/[\w-][\w.-]*)*$/.test(path);

function readExercise(value: unknown): LibraryExercise | null {
  if (!isRecord(value)) return null;
  const { slug, name, nameEn, primaryMuscles, secondaryMuscles, instructions, images } = value;
  const { equipment, category, force, level, mechanic } = value;
  const { instructionsLanguage, trackingType, isEssential } = value;

  const valid =
    isString(slug) &&
    SLUG.test(slug) &&
    // Custom exercises own that prefix.
    !slug.startsWith('custom-') &&
    isString(name) &&
    name.trim().length > 0 &&
    isOptionalString(nameEn) &&
    isStrings(primaryMuscles) &&
    isStrings(secondaryMuscles) &&
    isStrings(instructions) &&
    isStrings(images) &&
    images.every(isImagePath) &&
    [equipment, category, force, level, mechanic].every(isOptionalString) &&
    CONTENT_LANGUAGES.includes(instructionsLanguage as ContentLanguage) &&
    TRACKING_TYPES.includes(trackingType as TrackingType) &&
    typeof isEssential === 'boolean';
  if (!valid) return null;

  return {
    slug,
    name,
    nameEn: nameEn as string | null,
    primaryMuscles,
    secondaryMuscles,
    equipment: equipment as string | null,
    category: category as string | null,
    force: force as string | null,
    level: level as string | null,
    mechanic: mechanic as string | null,
    instructions,
    instructionsLanguage: instructionsLanguage as ContentLanguage,
    images,
    trackingType: trackingType as TrackingType,
    isEssential,
  };
}

/**
 * The exercises of a downloaded library, or null if anything is wrong: a broken file is refused
 * as a whole, the installed library stays as it was. An unknown tracking type (from a newer app)
 * is wrong too.
 */
export function parseLibrary(value: unknown): LibraryExercise[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const library: LibraryExercise[] = [];
  const slugs = new Set<string>();
  for (const entry of value) {
    const exercise = readExercise(entry);
    if (!exercise || slugs.has(exercise.slug)) return null;
    slugs.add(exercise.slug);
    library.push(exercise);
  }
  return library;
}
