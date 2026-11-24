/// <reference types="node" />

import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  exercises,
  programs,
  sessionExercises,
  templateExercises,
  workoutSessions,
  workoutTemplates,
} from '@/db/schema';

import { installLibrary, readInstalledLibraryVersion } from './library';
import type { LibraryExercise } from './library-format';

type MockParams = (string | number | null)[];

/** The app's database, migrated, on node:sqlite behind the methods Drizzle's expo-sqlite driver calls. */
jest.mock('@/db/client', () => {
  const { readdirSync, readFileSync } = jest.requireActual<typeof import('node:fs')>('node:fs');
  const { join } = jest.requireActual<typeof import('node:path')>('node:path');
  const { DatabaseSync } = jest.requireActual<typeof import('node:sqlite')>('node:sqlite');
  const { drizzle } = jest.requireActual('drizzle-orm/expo-sqlite');
  const schema = jest.requireActual('@/db/schema');

  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');
  const dir = join(__dirname, '../../db/migrations');
  for (const file of readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    for (const statement of readFileSync(join(dir, file), 'utf8').split(
      '--> statement-breakpoint',
    )) {
      sqlite.exec(statement);
    }
  }

  const client = {
    prepareSync(query: string) {
      const statement = sqlite.prepare(query);
      return {
        executeSync(params: MockParams) {
          if (statement.columns().length === 0) {
            const { changes, lastInsertRowid } = statement.run(...params);
            return { changes, lastInsertRowId: Number(lastInsertRowid) };
          }
          const rows = statement.all(...params);
          return { getAllSync: () => rows, getFirstSync: () => rows[0] ?? null };
        },
        executeForRawResultSync(params: MockParams) {
          statement.setReturnArrays(true);
          const rows = statement.all(...params);
          statement.setReturnArrays(false);
          return { getAllSync: () => rows };
        },
      };
    },
  };
  return { db: drizzle(client, { schema }) };
});
jest.mock('./local-images', () => ({}));
jest.mock('./library-images', () => ({}));

const exercise = (slug: string): LibraryExercise => ({
  slug,
  name: slug,
  nameEn: slug,
  primaryMuscles: ['triceps'],
  secondaryMuscles: [],
  equipment: 'machine',
  category: 'strength',
  force: 'push',
  level: 'beginner',
  mechanic: 'compound',
  instructions: [],
  instructionsLanguage: 'fr',
  images: [],
  trackingType: 'weight_reps',
  isEssential: true,
});

const exerciseId = (slug: string) =>
  db.select().from(exercises).where(eq(exercises.slug, slug)).get()?.id;
const row = (slug: string) => db.select().from(exercises).where(eq(exercises.slug, slug)).get();

/** A program and a workout, each with the exercise. */
function useExercise(slug: string) {
  const id = exerciseId(slug)!;
  const programId = db.insert(programs).values({ name: 'P' }).returning().get().id;
  const templateId = db
    .insert(workoutTemplates)
    .values({ programId, name: 'S', position: 0 })
    .returning()
    .get().id;
  db.insert(templateExercises).values({ templateId, exerciseId: id, position: 0 }).run();
  const sessionId = db
    .insert(workoutSessions)
    .values({ name: 'S', startedAt: new Date() })
    .returning()
    .get().id;
  db.insert(sessionExercises).values({ sessionId, exerciseId: id, position: 0 }).run();
}

const usages = (id: number) => [
  ...db.select().from(templateExercises).where(eq(templateExercises.exerciseId, id)).all(),
  ...db.select().from(sessionExercises).where(eq(sessionExercises.exerciseId, id)).all(),
];

beforeEach(() => {
  db.delete(sessionExercises).run();
  db.delete(workoutSessions).run();
  db.delete(programs).run();
  db.delete(exercises).run();
});

describe('installLibrary', () => {
  it('installs the library and records its version', () => {
    installLibrary([exercise('dip-machine')], 3, {});
    expect(row('dip-machine')?.isEssential).toBe(true);
    expect(readInstalledLibraryVersion()).toBe(3);
  });

  it('moves programs and workouts to the replacement, then deletes the duplicate', () => {
    installLibrary([exercise('dip-machine'), exercise('duplicate')], 1, {});
    useExercise('duplicate');

    installLibrary([exercise('dip-machine')], 2, { duplicate: 'dip-machine' });

    expect(row('duplicate')).toBeUndefined();
    expect(usages(exerciseId('dip-machine')!)).toHaveLength(2);
  });

  it('deletes an unused exercise and hides a used one', () => {
    installLibrary([exercise('unused'), exercise('used')], 1, {});
    useExercise('used');

    installLibrary([exercise('other')], 2, { unused: null, used: null });

    expect(row('unused')).toBeUndefined();
    expect(row('used')).toMatchObject({ isHidden: true, isEssential: false });
    expect(usages(exerciseId('used')!)).toHaveLength(2);
  });

  it('hides a used exercise whose replacement is missing', () => {
    installLibrary([exercise('used')], 1, {});
    useExercise('used');

    installLibrary([exercise('other')], 2, { used: 'not-installed' });

    expect(row('used')).toMatchObject({ isHidden: true });
  });

  it('ignores slugs it does not have and never touches custom exercises', () => {
    db.insert(exercises)
      .values({ ...exercise('custom-mine'), isCustom: true })
      .run();

    installLibrary([exercise('other')], 2, { 'never-installed': null, 'custom-mine': null });

    expect(row('custom-mine')).toBeDefined();
    expect(row('other')).toBeDefined();
  });
});
