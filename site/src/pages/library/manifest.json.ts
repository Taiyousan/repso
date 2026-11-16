import type { APIRoute } from 'astro';

import { LIBRARY_VERSION } from '../../config';

/**
 * Read by installed apps (src/features/exercises/remote-library.ts, format in library-format.ts):
 * they download the library only when its version is newer than theirs.
 */
export const GET: APIRoute = () =>
  Response.json({
    format: 'repso.library',
    version: LIBRARY_VERSION,
    url: `v${LIBRARY_VERSION}.json`,
  });
