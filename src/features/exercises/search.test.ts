import { filterExercises } from './search';

const exercises = [
  {
    name: 'Barbell Bench Press - Medium Grip',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'barbell',
  },
  {
    name: 'Dumbbell Bench Press',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps'],
    equipment: 'dumbbell',
  },
  {
    name: 'Barbell Full Squat',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: ['glutes'],
    equipment: 'barbell',
  },
];

const noFilter = { query: '', muscle: null, equipment: null };
const names = (list: typeof exercises) => list.map((exercise) => exercise.name);

describe('filterExercises', () => {
  it('returns everything without filters', () => {
    expect(filterExercises(exercises, noFilter)).toHaveLength(3);
  });

  it('matches every word of the query, in any order', () => {
    expect(names(filterExercises(exercises, { ...noFilter, query: 'press barbell' }))).toEqual([
      'Barbell Bench Press - Medium Grip',
    ]);
  });

  it('matches the French muscle label, ignoring accents', () => {
    expect(filterExercises(exercises, { ...noFilter, query: 'pectoraux' })).toHaveLength(2);
  });

  it('filters by primary muscle only', () => {
    expect(filterExercises(exercises, { ...noFilter, muscle: 'triceps' })).toHaveLength(0);
    expect(filterExercises(exercises, { ...noFilter, muscle: 'chest' })).toHaveLength(2);
  });

  it('combines muscle and equipment filters', () => {
    expect(
      names(filterExercises(exercises, { ...noFilter, muscle: 'chest', equipment: 'dumbbell' })),
    ).toEqual(['Dumbbell Bench Press']);
  });
});
