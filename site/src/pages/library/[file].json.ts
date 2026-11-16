import type { APIRoute, GetStaticPaths } from 'astro';

import { LIBRARY_VERSION } from '../../config';
import { library } from '../../library';

/**
 * The library under its version, for the apps (v<version>.json, named by the manifest), and under a
 * stable address for everyone else (latest.json). Minified: the repository keeps it readable.
 */
export const getStaticPaths = (() => [
  { params: { file: `v${LIBRARY_VERSION}` } },
  { params: { file: 'latest' } },
]) satisfies GetStaticPaths;

export const GET: APIRoute = () => Response.json(library);
