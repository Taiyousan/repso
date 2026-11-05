import library from '@/data/exercise-library.json';

import { STARTER_PROGRAMS } from './starters';
import { parseProgramFile, serializeProgramFile } from './transfer/format';

jest.mock('@/db/client', () => ({ db: {} }));

const essentials = new Set(library.filter((exercise) => exercise.isEssential).map((e) => e.slug));

describe('STARTER_PROGRAMS', () => {
  it('only uses essential exercises of the library', () => {
    const slugs = STARTER_PROGRAMS.flatMap((program) =>
      program.workouts.flatMap((workout) => workout.exercises.map((entry) => entry.slug)),
    );
    expect(slugs.filter((slug) => !slug || !essentials.has(slug))).toEqual([]);
  });

  it('are valid program files', () => {
    for (const program of STARTER_PROGRAMS) {
      expect(parseProgramFile(serializeProgramFile(program, new Date())).ok).toBe(true);
    }
  });
});
