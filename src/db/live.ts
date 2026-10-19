import { addDatabaseChangeListener } from 'expo-sqlite';
import { useMemo, useSyncExternalStore } from 'react';

/**
 * Drizzle's useLiveQuery only watches the main table of a query. This hook re-runs a synchronous
 * read whenever any of the given tables changes, for screens that join several tables.
 *
 * `key` identifies what is read (e.g. the displayed id): the store is rebuilt when it changes,
 * capturing `read` and `tables` at that time.
 */
export function useLiveData<T>(read: () => T, tables: readonly string[], key: string | number): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const store = useMemo(() => createLiveStore(read, tables), [key]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

function createLiveStore<T>(read: () => T, tables: readonly string[]) {
  let value = read();
  const listeners = new Set<() => void>();
  let subscription: { remove: () => void } | null = null;
  let pendingRefresh: ReturnType<typeof setTimeout> | null = null;

  const refresh = () => {
    pendingRefresh = null;
    value = read();
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
          if (tables.includes(tableName)) scheduleRefresh();
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
  };
}
