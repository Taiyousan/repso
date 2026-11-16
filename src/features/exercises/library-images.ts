/** Same commit as scripts/build-exercise-library.mjs. Images are served by jsDelivr's CDN. */
export const IMAGE_BASE_URL =
  'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/';

/**
 * An image of the library: a full URL (exercises added outside free-exercise-db) or a path in
 * free-exercise-db. Free of app imports: the website (site/) uses it too.
 */
export const libraryImageUrl = (path: string): string =>
  /^https?:\/\//.test(path) ? path : IMAGE_BASE_URL + path;
