import { normalizeText } from '@/lib/text';

import { muscleLabel } from './labels';

type SearchableExercise = {
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string | null;
};

export type ExerciseFilters = {
  query: string;
  muscle: string | null;
  equipment: string | null;
};

/**
 * Every word of the query must match the name or a primary muscle (English id or French label).
 * The muscle filter matches primary muscles only.
 */
export function filterExercises<T extends SearchableExercise>(
  exercises: T[],
  { query, muscle, equipment }: ExerciseFilters,
): T[] {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);

  return exercises.filter((exercise) => {
    if (muscle && !exercise.primaryMuscles.includes(muscle)) return false;
    if (equipment && exercise.equipment !== equipment) return false;
    if (words.length === 0) return true;

    const haystack = normalizeText(
      [exercise.name, ...exercise.primaryMuscles, ...exercise.primaryMuscles.map(muscleLabel)].join(
        ' ',
      ),
    );
    return words.every((word) => haystack.includes(word));
  });
}
