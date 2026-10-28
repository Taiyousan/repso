import { createExerciseMatcher, type CatalogExercise } from './matching';
import { defaultResolution, listImportRefs } from './plan';

const catalog: CatalogExercise[] = [
  {
    id: 1,
    slug: 'barbell-bench-press-medium-grip',
    name: 'Développé couché à la barre',
    nameEn: 'Barbell Bench Press - Medium Grip',
    isEssential: true,
  },
  {
    id: 2,
    slug: 'dumbbell-bench-press',
    name: 'Développé couché aux haltères',
    nameEn: 'Dumbbell Bench Press',
    isEssential: true,
  },
  {
    id: 3,
    slug: 'barbell-curl',
    name: 'Curl à la barre',
    nameEn: 'Barbell Curl',
    isEssential: true,
  },
  {
    id: 4,
    slug: 'barbell-curls-lying-against-an-incline',
    name: 'Curl allongé sur banc incliné',
    nameEn: 'Barbell Curls Lying Against An Incline',
    isEssential: false,
  },
  { id: 5, slug: 'custom-y-raise-abc', name: 'Y raise', nameEn: null, isEssential: false },
  {
    id: 6,
    slug: 'decline-barbell-bench-press',
    name: 'Développé décliné à la barre',
    nameEn: 'Decline Barbell Bench Press',
    isEssential: true,
  },
  {
    id: 7,
    slug: 'incline-dumbbell-press',
    name: 'Développé incliné aux haltères',
    nameEn: 'Incline Dumbbell Press',
    isEssential: true,
  },
  {
    id: 8,
    slug: 'side-lateral-raise',
    name: 'Élévations latérales',
    nameEn: 'Side Lateral Raise',
    isEssential: true,
  },
  {
    id: 9,
    slug: 'dumbbell-raise',
    name: 'Élévation à l’haltère',
    nameEn: 'Dumbbell Raise',
    isEssential: false,
  },
  {
    id: 10,
    slug: 'lateral-raise-with-bands',
    name: 'Élévation latérale avec élastique',
    nameEn: 'Lateral Raise - With Bands',
    isEssential: false,
  },
];

const match = createExerciseMatcher(catalog);

describe('createExerciseMatcher', () => {
  it('matches by slug, including the upstream spelling', () => {
    expect(match({ slug: 'barbell-curl' })).toEqual({ kind: 'exact', exerciseId: 3 });
    expect(match({ slug: 'Barbell_Curl' })).toEqual({ kind: 'exact', exerciseId: 3 });
  });

  it('falls back to the French or English name when the slug is unknown', () => {
    expect(match({ slug: 'bench-press', name: 'développé couché aux haltères' })).toEqual({
      kind: 'exact',
      exerciseId: 2,
    });
    expect(match({ name: 'Barbell Bench Press – Medium Grip' })).toEqual({
      kind: 'exact',
      exerciseId: 1,
    });
  });

  it('matches custom exercises by name', () => {
    expect(match({ name: 'Y Raise' })).toEqual({ kind: 'exact', exerciseId: 5 });
  });

  it('suggests the closest name, tolerating plurals', () => {
    expect(match({ name: 'Barbell Bench Press' })).toEqual({ kind: 'suggested', exerciseId: 1 });
    expect(match({ name: 'Barbell Curls' })).toEqual({ kind: 'suggested', exerciseId: 3 });
  });

  it('keeps incline and decline variants apart', () => {
    expect(match({ name: 'Incline Dumbbell Bench Press' })).toEqual({
      kind: 'suggested',
      exerciseId: 7,
    });
  });

  it('weighs the movement over the equipment, but avoids another equipment', () => {
    expect(match({ name: 'Dumbbell Lateral Raise' })).toEqual({ kind: 'suggested', exerciseId: 8 });
  });

  it('gives up when no name is close enough', () => {
    expect(match({ name: 'Hip Thrust' })).toEqual({ kind: 'none' });
    expect(match({ slug: 'unknown' })).toEqual({ kind: 'none' });
  });
});

describe('listImportRefs', () => {
  it('lists each exercise once across workouts', () => {
    const refs = listImportRefs(
      {
        name: 'Full body',
        workouts: [
          { name: 'A', exercises: [{ slug: 'barbell-curl' }, { name: 'Hip Thrust' }] },
          { name: 'B', exercises: [{ slug: 'barbell-curl', restSeconds: 60 }] },
        ],
      },
      match,
    );
    expect(refs.map(({ label, match }) => ({ label, match }))).toEqual([
      { label: 'barbell-curl', match: { kind: 'exact', exerciseId: 3 } },
      { label: 'Hip Thrust', match: { kind: 'none' } },
    ]);
  });
});

describe('defaultResolution', () => {
  it('keeps matches, flags suggestions and creates the rest', () => {
    expect(defaultResolution({ kind: 'exact', exerciseId: 1 })).toEqual({
      kind: 'library',
      exerciseId: 1,
      toCheck: false,
    });
    expect(defaultResolution({ kind: 'suggested', exerciseId: 1 })).toEqual({
      kind: 'library',
      exerciseId: 1,
      toCheck: true,
    });
    expect(defaultResolution({ kind: 'none' })).toEqual({ kind: 'create' });
  });
});
