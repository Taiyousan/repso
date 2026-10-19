#!/usr/bin/env node
/**
 * Builds src/data/exercise-library.json from free-exercise-db (Unlicense).
 * https://github.com/yuhonas/free-exercise-db
 *
 * French translations and the "essentials" selection are maintained in this repo:
 * - src/data/exercise-names.fr.json         { slug: name }, every exercise
 * - src/data/exercise-instructions.fr.json  { slug: steps[] }, translated exercises only
 * - src/data/exercise-essentials.json       [slug], exercises shown by default
 *
 * The source is pinned to a commit so builds are reproducible. After any change here or in
 * those files, run `npm run library:build` and bump LIBRARY_VERSION in
 * src/features/exercises/library.ts so installed apps re-import the library.
 */
import { readFile, writeFile } from 'node:fs/promises';

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

function trackingTypeOf(exercise) {
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

const [frenchNames, frenchInstructions, essentials] = await Promise.all([
  readJson('exercise-names.fr.json'),
  readJson('exercise-instructions.fr.json'),
  readJson('exercise-essentials.json'),
]);

const slugs = new Set(source.map((exercise) => toSlug(exercise.id)));
if (slugs.size !== source.length) throw new Error('Duplicate slugs after conversion');
assertKnownSlugs('exercise-names.fr.json', Object.keys(frenchNames), slugs);
assertKnownSlugs('exercise-instructions.fr.json', Object.keys(frenchInstructions), slugs);
assertKnownSlugs('exercise-essentials.json', essentials, slugs);

const essentialSlugs = new Set(essentials);

const library = source.map((exercise) => {
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
    trackingType: trackingTypeOf(exercise),
    isEssential: essentialSlugs.has(slug),
  };
});

library.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
await writeFile(OUTPUT, JSON.stringify(library) + '\n');

const translated = library.filter((exercise) => exercise.instructionsLanguage === 'fr').length;
console.log(
  `Wrote ${library.length} exercises (${essentialSlugs.size} essentials, ` +
    `${translated} with French instructions) to ${OUTPUT.pathname}`,
);
