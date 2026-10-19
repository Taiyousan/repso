import { filterExercises } from './search';

const base = { isEssential: true, isCustom: false };

const exercises = [
  {
    ...base,
    name: 'Développé couché à la barre',
    nameEn: 'Barbell Bench Press - Medium Grip',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'barbell',
  },
  {
    ...base,
    name: 'Développé couché aux haltères',
    nameEn: 'Dumbbell Bench Press',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps'],
    equipment: 'dumbbell',
  },
  {
    ...base,
    isEssential: false,
    name: 'Squat Zercher',
    nameEn: 'Zercher Squats',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: ['glutes'],
    equipment: 'barbell',
  },
  {
    ...base,
    isEssential: false,
    isCustom: true,
    name: 'Ma presse maison',
    nameEn: null,
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: [],
    equipment: 'machine',
  },
];

const noFilter = { query: '', muscle: null, equipment: null, essentialsOnly: false };
const names = (list: typeof exercises) => list.map((exercise) => exercise.name);

describe('filterExercises', () => {
  it('returns everything without filters', () => {
    expect(filterExercises(exercises, noFilter)).toHaveLength(4);
  });

  it('matches French words, ignoring accents and order', () => {
    expect(names(filterExercises(exercises, { ...noFilter, query: 'barre developpe' }))).toEqual([
      'Développé couché à la barre',
    ]);
  });

  it('matches the English name', () => {
    expect(
      names(filterExercises(exercises, { ...noFilter, query: 'bench press dumbbell' })),
    ).toEqual(['Développé couché aux haltères']);
  });

  it('matches the French muscle label', () => {
    expect(filterExercises(exercises, { ...noFilter, query: 'pectoraux' })).toHaveLength(2);
  });

  it('filters by primary muscle only', () => {
    expect(filterExercises(exercises, { ...noFilter, muscle: 'triceps' })).toHaveLength(0);
    expect(filterExercises(exercises, { ...noFilter, muscle: 'chest' })).toHaveLength(2);
  });

  it('combines muscle and equipment filters', () => {
    expect(
      names(filterExercises(exercises, { ...noFilter, muscle: 'chest', equipment: 'dumbbell' })),
    ).toEqual(['Développé couché aux haltères']);
  });

  it('keeps essential and custom exercises in essentials mode', () => {
    expect(names(filterExercises(exercises, { ...noFilter, essentialsOnly: true }))).toEqual([
      'Développé couché à la barre',
      'Développé couché aux haltères',
      'Ma presse maison',
    ]);
  });
});
