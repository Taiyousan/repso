import library from '@/data/exercise-library.json';

import { SUGGESTED_PROGRAMS } from './suggested';
import { parseProgramFile, serializeProgramFile } from './transfer/format';

jest.mock('@/db/client', () => ({ db: {} }));

const essentials = new Set(library.filter((exercise) => exercise.isEssential).map((e) => e.slug));

describe('SUGGESTED_PROGRAMS', () => {
  it('only uses essential exercises of the library', () => {
    const slugs = SUGGESTED_PROGRAMS.flatMap((program) =>
      program.workouts.flatMap((workout) => workout.exercises.map((entry) => entry.slug)),
    );
    expect(slugs.filter((slug) => !slug || !essentials.has(slug))).toEqual([]);
  });

  it('are valid program files', () => {
    for (const program of SUGGESTED_PROGRAMS) {
      expect(parseProgramFile(serializeProgramFile(program, new Date())).ok).toBe(true);
    }
  });
});
