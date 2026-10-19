#!/usr/bin/env node
/**
 * Builds src/data/exercise-library.json from free-exercise-db (Unlicense).
 * https://github.com/yuhonas/free-exercise-db
 *
 * The source is pinned to a commit so builds are reproducible; bump SOURCE_COMMIT
 * (and LIBRARY_VERSION in src/features/exercises/library.ts) to update the library.
 */
import { writeFile } from 'node:fs/promises';

const SOURCE_COMMIT = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5';
const SOURCE_URL = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${SOURCE_COMMIT}/dist/exercises.json`;
const OUTPUT = new URL('../src/data/exercise-library.json', import.meta.url);

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

const response = await fetch(SOURCE_URL);
if (!response.ok) throw new Error(`Download failed: ${response.status}`);
const source = await response.json();

const library = source.map((exercise) => ({
  slug: toSlug(exercise.id),
  name: exercise.name.trim(),
  primaryMuscles: exercise.primaryMuscles,
  secondaryMuscles: exercise.secondaryMuscles,
  equipment: exercise.equipment ?? null,
  category: exercise.category ?? null,
  force: exercise.force ?? null,
  level: exercise.level ?? null,
  mechanic: exercise.mechanic ?? null,
  instructions: exercise.instructions,
  images: exercise.images,
  trackingType: trackingTypeOf(exercise),
}));

const slugs = new Set(library.map((exercise) => exercise.slug));
if (slugs.size !== library.length) throw new Error('Duplicate slugs after conversion');

library.sort((a, b) => a.name.localeCompare(b.name));
await writeFile(OUTPUT, JSON.stringify(library) + '\n');
console.log(`Wrote ${library.length} exercises to ${OUTPUT.pathname}`);
