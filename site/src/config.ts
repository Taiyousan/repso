import appJson from '../../app.json';
import libraryModule from '../../src/features/exercises/library.ts?raw';

/** The latest release APK. */
export const APK_URL = 'https://github.com/Taiyousan/repso/releases/latest/download/repso.apk';
export const PORTFOLIO_URL = 'https://shamsbenhamou.fr';
export const APP_VERSION = appJson.expo.version;

/** The app's LIBRARY_VERSION, read from its source: the library published here carries it. */
export const LIBRARY_VERSION = Number(/LIBRARY_VERSION = (\d+);/.exec(libraryModule)?.[1]);
if (!Number.isInteger(LIBRARY_VERSION)) throw new Error('LIBRARY_VERSION not found');
