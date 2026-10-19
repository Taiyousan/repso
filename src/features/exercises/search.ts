import { normalizeText } from '@/lib/text';

import { muscleLabel } from './labels';

type SearchableExercise = {
  name: string;
  nameEn: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string | null;
  isEssential: boolean;
  isCustom: boolean;
};

export type ExerciseFilters = {
  query: string;
  muscle: string | null;
  equipment: string | null;
  /** Restricts to essential exercises; custom exercises are always kept. */
  essentialsOnly: boolean;
};

/**
 * Every word of the query must match the French or English name, or a primary muscle
 * (English id or French label). The muscle filter matches primary muscles only.
 */
export function filterExercises<T extends SearchableExercise>(
  exercises: T[],
  { query, muscle, equipment, essentialsOnly }: ExerciseFilters,
): T[] {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);

  return exercises.filter((exercise) => {
    if (essentialsOnly && !exercise.isEssential && !exercise.isCustom) return false;
    if (muscle && !exercise.primaryMuscles.includes(muscle)) return false;
    if (equipment && exercise.equipment !== equipment) return false;
    if (words.length === 0) return true;

    const haystack = normalizeText(
      [
        exercise.name,
        exercise.nameEn ?? '',
        ...exercise.primaryMuscles,
        ...exercise.primaryMuscles.map(muscleLabel),
      ].join(' '),
    );
    return words.every((word) => haystack.includes(word));
  });
}
