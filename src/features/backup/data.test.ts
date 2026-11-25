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
import { installLibrary } from '@/features/exercises/library';
import type { LibraryExercise } from '@/features/exercises/library-format';

import { readBackupData, restoreBackupData } from './data';

jest.mock('@/db/client', () => jest.requireActual('@/db/test-client'));
jest.mock('@/data/exercise-removed.json', () => ({ 'old-press': 'dip-machine' }));
jest.mock('@/features/exercises/local-images', () => ({
  readLocalImages: () => [],
  writeLocalImages: () => {},
}));
jest.mock('@/features/exercises/library-images', () => ({}));

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

const row = (slug: string) => db.select().from(exercises).where(eq(exercises.slug, slug)).get();

/** A program and a finished workout, each with the exercise. */
function useExercise(slug: string) {
  const id = row(slug)!.id;
  const programId = db.insert(programs).values({ name: 'P' }).returning().get().id;
  const templateId = db
    .insert(workoutTemplates)
    .values({ programId, name: 'S', position: 0 })
    .returning()
    .get().id;
  db.insert(templateExercises).values({ templateId, exerciseId: id, position: 0 }).run();
  const sessionId = db
    .insert(workoutSessions)
    .values({ name: 'S', startedAt: new Date(), endedAt: new Date() })
    .returning()
    .get().id;
  db.insert(sessionExercises).values({ sessionId, exerciseId: id, position: 0 }).run();
}

const usedSlugs = () =>
  [
    ...db
      .select({ slug: exercises.slug })
      .from(templateExercises)
      .innerJoin(exercises, eq(exercises.id, templateExercises.exerciseId))
      .all(),
    ...db
      .select({ slug: exercises.slug })
      .from(sessionExercises)
      .innerJoin(exercises, eq(exercises.id, sessionExercises.exerciseId))
      .all(),
  ].map(({ slug }) => slug);

/** A new phone: nothing but the given library. */
function reinstall(library: LibraryExercise[]) {
  db.delete(workoutSessions).run();
  db.delete(programs).run();
  db.delete(exercises).run();
  installLibrary(library, 1, {});
}

beforeEach(() => reinstall([]));

describe('restoreBackupData', () => {
  it('moves a backed-up exercise the library replaced since to its replacement', () => {
    reinstall([exercise('dip-machine'), exercise('old-press')]);
    useExercise('old-press');
    const backup = readBackupData();

    reinstall([exercise('dip-machine')]);
    restoreBackupData(backup);

    expect(row('old-press')).toBeUndefined();
    expect(usedSlugs()).toEqual(['dip-machine', 'dip-machine']);
  });

  it('hides a backed-up exercise missing from the library, until the library brings it back', () => {
    reinstall([exercise('curl')]);
    useExercise('curl');
    const backup = readBackupData();

    reinstall([]);
    restoreBackupData(backup);
    expect(row('curl')).toMatchObject({ isHidden: true, isEssential: false });
    expect(usedSlugs()).toEqual(['curl', 'curl']);

    installLibrary([exercise('curl')], 2, {});
    expect(row('curl')).toMatchObject({ isHidden: false, isEssential: true });
  });
});
