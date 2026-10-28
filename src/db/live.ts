import { useIsFocused } from 'expo-router';
import { addDatabaseChangeListener } from 'expo-sqlite';
import { useLayoutEffect, useMemo, useSyncExternalStore } from 'react';

import { shareEqual } from '@/lib/share-equal';

/**
 * Drizzle's useLiveQuery only watches the main table of a query. This hook re-runs a synchronous
 * read whenever any of the given tables changes, for screens that join several tables.
 *
 * `key` identifies what is read (e.g. the displayed id): the store is rebuilt when it changes,
 * capturing `read` and `tables` at that time.
 *
 * Tabs stay mounted and screens stay under the ones pushed over them: while its screen is not
 * shown, the hook doesn't re-read on every write (each validated set, for instance) but catches up
 * once when the screen comes back.
 */
export function useLiveData<T>(read: () => T, tables: readonly string[], key: string | number): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const store = useMemo(() => createLiveStore(read, tables), [key]);
  const focused = useIsFocused();
  // Before paint, so a screen coming back never shows its outdated data.
  useLayoutEffect(() => store.setPaused(!focused), [store, focused]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

function createLiveStore<T>(read: () => T, tables: readonly string[]) {
  let value = read();
  const listeners = new Set<() => void>();
  let subscription: { remove: () => void } | null = null;
  let pendingRefresh: ReturnType<typeof setTimeout> | null = null;
  let paused = false;
  /** A watched table changed while paused. */
  let stale = false;

  const refresh = () => {
    pendingRefresh = null;
    stale = false;
    // Unchanged parts keep their identity, so memoized components skip them.
    const next = shareEqual(value, read());
    if (next === value) return;
    value = next;
    listeners.forEach((listener) => listener());
  };

  // SQLite reports every changed row: coalesce a burst (e.g. a transaction) into one read.
  const scheduleRefresh = () => {
    pendingRefresh ??= setTimeout(refresh, 16);
  };

  return {
    getSnapshot: () => value,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!subscription) {
        subscription = addDatabaseChangeListener(({ tableName }) => {
          if (!tables.includes(tableName)) return;
          if (paused) stale = true;
          else scheduleRefresh();
        });
        // Catch writes that happened between the first read and the subscription.
        refresh();
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          subscription?.remove();
          subscription = null;
          if (pendingRefresh) clearTimeout(pendingRefresh);
          pendingRefresh = null;
        }
      };
    },
    setPaused(next: boolean) {
      paused = next;
      if (!paused && stale) refresh();
    },
  };
}
