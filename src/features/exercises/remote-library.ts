import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { useLiveData } from '@/db/live';
import { appMeta } from '@/db/schema';

import { installLibrary, readInstalledLibraryVersion } from './library';
import { parseLibrary, parseLibraryManifest } from './library-format';

/** Published by scripts/build-site.mjs. */
const LIBRARY_URL = 'https://repso-app-android.vercel.app/library/';
const CHECKED_AT_KEY = 'exercise_library_checked_at';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 15_000;

export type LibraryUpdate =
  | { status: 'updated'; version: number }
  | { status: 'up-to-date'; version: number }
  | { status: 'failed'; message: string };

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`Réponse ${response.status} du site.`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function readCheckedAt(): Date | null {
  const row = db.select().from(appMeta).where(eq(appMeta.key, CHECKED_AT_KEY)).get();
  return row ? new Date(Number(row.value)) : null;
}

export function useLibraryCheckedAt(): Date | null {
  return useLiveData(readCheckedAt, ['app_meta'], 'library-checked-at');
}

function markChecked(): void {
  const value = String(Date.now());
  db.insert(appMeta)
    .values({ key: CHECKED_AT_KEY, value })
    .onConflictDoUpdate({ target: appMeta.key, set: { value } })
    .run();
}

/**
 * Installs the library published on the site when it is newer than the installed one. The
 * manifest is read first: the library itself (~1 MB) is only downloaded when it changed.
 */
export async function updateExerciseLibrary(): Promise<LibraryUpdate> {
  try {
    const manifest = parseLibraryManifest(await fetchJson(`${LIBRARY_URL}manifest.json`));
    if (!manifest) {
      return { status: 'failed', message: 'Le site publie une bibliothèque illisible.' };
    }
    const installed = readInstalledLibraryVersion();
    if (manifest.version <= installed) {
      markChecked();
      return { status: 'up-to-date', version: installed };
    }

    const library = parseLibrary(await fetchJson(LIBRARY_URL + manifest.url));
    if (!library) {
      return {
        status: 'failed',
        message: 'La bibliothèque du site est abîmée ou demande une version plus récente de Repso.',
      };
    }
    installLibrary(library, manifest.version);
    markChecked();
    return { status: 'updated', version: manifest.version };
  } catch (error) {
    // fetch fails with a TypeError when offline, an AbortError on timeout.
    const offline = error instanceof TypeError || (error as Error)?.name === 'AbortError';
    return {
      status: 'failed',
      message: offline
        ? 'Impossible de joindre le site. Vérifie ta connexion.'
        : error instanceof Error
          ? error.message
          : String(error),
    };
  }
}

/** At launch, at most once a day, silently: the bundled library always works offline. */
export function updateExerciseLibraryInBackground(): void {
  const checkedAt = readCheckedAt();
  if (checkedAt && Date.now() - checkedAt.getTime() < CHECK_INTERVAL_MS) return;
  void updateExerciseLibrary();
}
