import type { APIRoute, GetStaticPaths } from 'astro';
import { resolve } from 'node:path';

import { readExerciseImages } from '../../../../scripts/exercise-images.mjs';

/**
 * The photos of src/data/exercise-images/, under the hashed names the library refers to
 * (scripts/build-exercise-library.mjs). vercel.json caches them forever.
 */
export const getStaticPaths = (() => {
  // Astro runs from site/: its npm scripts, and Vercel's `npm run build --prefix site`.
  const images = readExerciseImages(resolve('../src/data/exercise-images'));
  return [...images.values()].flat().map(({ file, content }) => ({
    params: { file },
    props: { content },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => new Response(props.content);
