import type { APIRoute } from 'astro';

import removed from '../../../../src/data/exercise-removed.json';
import { LIBRARY_VERSION } from '../../config';

/**
 * Read by installed apps (src/features/exercises/remote-library.ts, format in library-format.ts):
 * they download the library only when its version is newer than theirs, then take the removed
 * exercises out of their database.
 */
export const GET: APIRoute = () =>
  Response.json({
    format: 'repso.library',
    version: LIBRARY_VERSION,
    url: `v${LIBRARY_VERSION}.json`,
    removed,
  });
