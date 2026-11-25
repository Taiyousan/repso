/// <reference types="node" />

/**
 * Stands in for ./client in tests that need a real database:
 * `jest.mock('@/db/client', () => jest.requireActual('@/db/test-client'))`.
 * The app's database, migrated, on node:sqlite behind the methods Drizzle's expo-sqlite driver calls.
 */
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import * as schema from './schema';

type Params = (string | number | null)[];

const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys = ON;');
const dir = join(__dirname, 'migrations');
for (const file of readdirSync(dir)
  .filter((name) => name.endsWith('.sql'))
  .sort()) {
  for (const statement of readFileSync(join(dir, file), 'utf8').split('--> statement-breakpoint')) {
    sqlite.exec(statement);
  }
}

const client = {
  prepareSync(query: string) {
    const statement = sqlite.prepare(query);
    return {
      executeSync(params: Params) {
        if (statement.columns().length === 0) {
          const { changes, lastInsertRowid } = statement.run(...params);
          return { changes, lastInsertRowId: Number(lastInsertRowid) };
        }
        const rows = statement.all(...params);
        return { getAllSync: () => rows, getFirstSync: () => rows[0] ?? null };
      },
      executeForRawResultSync(params: Params) {
        statement.setReturnArrays(true);
        const rows = statement.all(...params);
        statement.setReturnArrays(false);
        return { getAllSync: () => rows };
      },
    };
  },
};

export const db = drizzle(client as never, { schema });
