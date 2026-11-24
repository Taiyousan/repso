import bundled from '@/data/exercise-library.json';
import bundledRemovals from '@/data/exercise-removed.json';

import { parseLibrary, parseLibraryManifest, parseRemovedExercises } from './library-format';

const exercise = {
  slug: 'pullups',
  name: 'Tractions',
  nameEn: 'Pullups',
  primaryMuscles: ['lats'],
  secondaryMuscles: [],
  equipment: 'body only',
  category: 'strength',
  force: 'pull',
  level: 'beginner',
  mechanic: 'compound',
  instructions: ['Monte.'],
  instructionsLanguage: 'fr',
  images: ['Pullups/0.jpg', 'https://example.com/pullups.jpg'],
  trackingType: 'bodyweight_reps',
  isEssential: true,
};

describe('parseLibraryManifest', () => {
  it('reads a manifest', () => {
    expect(parseLibraryManifest({ format: 'repso.library', version: 7, url: 'v7.json' })).toEqual({
      version: 7,
      url: 'v7.json',
      removed: {},
    });
    expect(
      parseLibraryManifest({
        format: 'repso.library',
        version: 10,
        url: 'v10.json',
        removed: { duplicate: 'dip-machine', gone: null },
      })?.removed,
    ).toEqual({ duplicate: 'dip-machine', gone: null });
  });

  it('refuses a manifest with wrong removals', () => {
    expect(
      parseLibraryManifest({ format: 'repso.library', version: 7, url: 'v7.json', removed: [] }),
    ).toBeNull();
  });

  it('refuses another format, a bad version or a link elsewhere', () => {
    expect(parseLibraryManifest({ format: 'other', version: 7, url: 'v7.json' })).toBeNull();
    expect(parseLibraryManifest({ format: 'repso.library', version: '7', url: 'v7.json' })).toBe(
      null,
    );
    expect(
      parseLibraryManifest({ format: 'repso.library', version: 7, url: 'https://x.com/v7.json' }),
    ).toBeNull();
  });
});

describe('parseLibrary', () => {
  it('accepts the bundled library', () => {
    expect(parseLibrary(bundled)).toHaveLength(bundled.length);
  });

  it('keeps known fields only', () => {
    expect(parseLibrary([{ ...exercise, extra: 1 }])).toEqual([exercise]);
  });

  it('refuses the whole file for one wrong exercise', () => {
    expect(parseLibrary([exercise, { ...exercise, slug: 'other', trackingType: 'jumps' }])).toBe(
      null,
    );
    expect(parseLibrary([exercise, { ...exercise, name: '' }])).toBeNull();
  });

  it('refuses duplicate slugs and custom ones', () => {
    expect(parseLibrary([exercise, exercise])).toBeNull();
    expect(parseLibrary([{ ...exercise, slug: 'custom-mine' }])).toBeNull();
  });

  it('refuses images pointing to the phone or outside https', () => {
    expect(parseLibrary([{ ...exercise, images: ['local:a.jpg'] }])).toBeNull();
    expect(parseLibrary([{ ...exercise, images: ['http://example.com/a.jpg'] }])).toBeNull();
    expect(parseLibrary([{ ...exercise, images: ['../a.jpg'] }])).toBeNull();
  });

  it('refuses an empty or non-list file', () => {
    expect(parseLibrary([])).toBeNull();
    expect(parseLibrary({})).toBeNull();
  });
});

describe('parseRemovedExercises', () => {
  it('accepts the bundled removals, whose replacements are in the bundled library', () => {
    const removed = parseRemovedExercises(bundledRemovals);
    expect(removed).not.toBeNull();
    const slugs = new Set(bundled.map((entry) => entry.slug));
    for (const [slug, replacement] of Object.entries(removed!)) {
      expect(slugs.has(slug)).toBe(false);
      if (replacement !== null) expect(slugs.has(replacement)).toBe(true);
    }
  });

  it('refuses custom slugs, chained replacements and bad values', () => {
    expect(parseRemovedExercises({ 'custom-mine': null })).toBeNull();
    expect(parseRemovedExercises({ a: 'custom-mine' })).toBeNull();
    expect(parseRemovedExercises({ a: 'b', b: 'c' })).toBeNull();
    expect(parseRemovedExercises({ a: 'a' })).toBeNull();
    expect(parseRemovedExercises({ a: 1 })).toBeNull();
    expect(parseRemovedExercises({ 'Bad Slug': null })).toBeNull();
  });
});
