#!/usr/bin/env node
/**
 * Builds src/data/exercise-library.json from free-exercise-db (Unlicense).
 * https://github.com/yuhonas/free-exercise-db
 *
 * French translations and the "essentials" selection are maintained in this repo:
 * - src/data/exercise-names.fr.json         { slug: name }, every exercise
 * - src/data/exercise-instructions.fr.json  { slug: steps[] }, translated exercises only
 * - src/data/exercise-essentials.json       [slug], exercises shown by default
 * - src/data/exercise-extras.json           complete exercises missing from free-exercise-db
 * - src/data/exercise-removed.json          { slug: replacement slug | null }, exercises taken out
 *                                           of the library (and out of installed apps)
 * - src/data/exercise-images/<slug>/        photos replacing the images of an exercise
 *
 * Images of an extra exercise are paths in free-exercise-db, or full URLs. Photos of
 * exercise-images/ become URLs of the site, which publishes them (scripts/exercise-images.mjs).
 *
 * The source is pinned to a commit so builds are reproducible. After any change here or in
 * those files, run `npm run library:build` and bump LIBRARY_VERSION in
 * src/features/exercises/library.ts so installed apps re-import the library.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { EXERCISE_IMAGES_URL, readExerciseImages } from './exercise-images.mjs';

const SOURCE_COMMIT = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5';
const SOURCE_URL = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${SOURCE_COMMIT}/dist/exercises.json`;
const DATA_DIR = new URL('../src/data/', import.meta.url);
const OUTPUT = new URL('exercise-library.json', DATA_DIR);

const readJson = async (file) => JSON.parse(await readFile(new URL(file, DATA_DIR), 'utf8'));

/** "3_4_Sit-Up" -> "3-4-sit-up" */
function toSlug(id) {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * free-exercise-db has no equipment for "your body, plus a load or an assistance": those are
 * listed by hand. A belt, a vest or a band then goes in the weight field.
 */
const TRACKING_OVERRIDES = {
  'band-assisted-pull-up': 'assisted_reps',
  'weighted-pull-ups': 'weighted_bodyweight',
  'weighted-bench-dip': 'weighted_bodyweight',
  'dips-chest-version': 'weighted_bodyweight',
  'parallel-bar-dip': 'weighted_bodyweight',
  'ring-dips': 'weighted_bodyweight',
  'muscle-up': 'weighted_bodyweight',
  'one-arm-chin-up': 'weighted_bodyweight',
  'mixed-grip-chin': 'weighted_bodyweight',
  'side-to-side-chins': 'weighted_bodyweight',
  'gironda-sternum-chins': 'weighted_bodyweight',
};

function trackingTypeOf(exercise, slug) {
  if (TRACKING_OVERRIDES[slug]) return TRACKING_OVERRIDES[slug];
  if (exercise.category === 'stretching' || exercise.category === 'cardio') return 'duration';
  const bodyweight = exercise.equipment === 'body only' || exercise.equipment == null;
  if (exercise.force === 'static' && bodyweight) return 'duration';
  if (bodyweight) return 'bodyweight_reps';
  return 'weight_reps';
}

/** Fails on keys that don't match an exercise, so typos never go unnoticed. */
function assertKnownSlugs(file, keys, slugs) {
  const unknown = keys.filter((slug) => !slugs.has(slug));
  if (unknown.length > 0) throw new Error(`${file}: unknown slugs ${unknown.join(', ')}`);
}

const response = await fetch(SOURCE_URL);
if (!response.ok) throw new Error(`Download failed: ${response.status}`);
const source = await response.json();

const [frenchNames, frenchInstructions, essentials, extras, removed] = await Promise.all([
  readJson('exercise-names.fr.json'),
  readJson('exercise-instructions.fr.json'),
  readJson('exercise-essentials.json'),
  readJson('exercise-extras.json'),
  readJson('exercise-removed.json'),
]);

const slugs = new Set(source.map((exercise) => toSlug(exercise.id)));
if (slugs.size !== source.length) throw new Error('Duplicate slugs after conversion');
assertKnownSlugs('exercise-names.fr.json', Object.keys(frenchNames), slugs);
assertKnownSlugs('exercise-instructions.fr.json', Object.keys(frenchInstructions), slugs);
assertKnownSlugs('exercise-essentials.json', essentials, slugs);
assertKnownSlugs('TRACKING_OVERRIDES', Object.keys(TRACKING_OVERRIDES), slugs);
const takenSlugs = extras.filter(
  (extra) => slugs.has(extra.slug) || extra.slug.startsWith('custom-'),
);
if (takenSlugs.length > 0) {
  throw new Error(`exercise-extras.json: slugs already used ${takenSlugs.map((e) => e.slug)}`);
}

const essentialSlugs = new Set(essentials);

/** A free-exercise-db exercise is removed by leaving it out; an extra, by deleting its entry. */
const extraSlugs = new Set(extras.map((extra) => extra.slug));
const removedExtras = Object.keys(removed).filter((slug) => extraSlugs.has(slug));
if (removedExtras.length > 0) {
  throw new Error(`exercise-removed.json: delete ${removedExtras} from exercise-extras.json`);
}

const library = source
  .filter((exercise) => !(toSlug(exercise.id) in removed))
  .map((exercise) => {
    const slug = toSlug(exercise.id);
    const translatedInstructions = frenchInstructions[slug];
    return {
      slug,
      name: frenchNames[slug] ?? exercise.name.trim(),
      nameEn: exercise.name.trim(),
      primaryMuscles: exercise.primaryMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
      equipment: exercise.equipment ?? null,
      category: exercise.category ?? null,
      force: exercise.force ?? null,
      level: exercise.level ?? null,
      mechanic: exercise.mechanic ?? null,
      instructions: translatedInstructions ?? exercise.instructions,
      instructionsLanguage: translatedInstructions ? 'fr' : 'en',
      images: exercise.images,
      trackingType: trackingTypeOf(exercise, slug),
      isEssential: essentialSlugs.has(slug),
    };
  });
library.push(...extras);

const librarySlugs = new Set(library.map((exercise) => exercise.slug));
for (const [slug, replacement] of Object.entries(removed)) {
  if (slug.startsWith('custom-')) throw new Error(`exercise-removed.json: ${slug} is custom`);
  if (essentialSlugs.has(slug)) throw new Error(`exercise-essentials.json: ${slug} is removed`);
  if (replacement !== null && !librarySlugs.has(replacement)) {
    throw new Error(`exercise-removed.json: replacement ${replacement} isn't in the library`);
  }
}

const photos = readExerciseImages(fileURLToPath(new URL('exercise-images/', DATA_DIR)));
assertKnownSlugs('exercise-images/', [...photos.keys()], librarySlugs);
for (const exercise of library) {
  const frames = photos.get(exercise.slug);
  if (frames) exercise.images = frames.map(({ file }) => EXERCISE_IMAGES_URL + file);
}

library.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
await writeFile(OUTPUT, JSON.stringify(library) + '\n');

const translated = library.filter((exercise) => exercise.instructionsLanguage === 'fr').length;
console.log(
  `Wrote ${library.length} exercises (${essentialSlugs.size} essentials, ` +
    `${translated} with French instructions) to ${OUTPUT.pathname}`,
);
