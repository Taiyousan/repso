import { slugify } from '@/lib/text';

import type { ProgramFileExercise, ProgramFileProgram } from './format';
import type { ExerciseMatch } from './matching';

/** A distinct exercise of the imported program, resolved once for all its workouts. */
export type ImportRef = {
  key: string;
  /** As written in the file. */
  label: string;
  /** First occurrence, which carries the definition used to create a custom exercise. */
  entry: ProgramFileExercise;
  match: ExerciseMatch;
};

export type Resolution =
  /** `toCheck`: a suggested match the user has not confirmed yet. */
  | { kind: 'library'; exerciseId: number; toCheck?: boolean }
  /** New custom exercise named after the label. */
  | { kind: 'create' }
  /** Left out of the imported workouts. */
  | { kind: 'skip' };

export function refKey(entry: ProgramFileExercise): string {
  return entry.slug ? `slug:${slugify(entry.slug)}` : `name:${slugify(entry.name ?? '')}`;
}

export function listImportRefs(
  program: ProgramFileProgram,
  match: (entry: ProgramFileExercise) => ExerciseMatch,
): ImportRef[] {
  const refs = new Map<string, ImportRef>();
  for (const workout of program.workouts) {
    for (const entry of workout.exercises) {
      const key = refKey(entry);
      if (refs.has(key)) continue;
      refs.set(key, { key, label: entry.name ?? entry.slug ?? '', entry, match: match(entry) });
    }
  }
  return [...refs.values()];
}

export function defaultResolution(match: ExerciseMatch): Resolution {
  if (match.kind === 'none') return { kind: 'create' };
  return { kind: 'library', exerciseId: match.exerciseId, toCheck: match.kind === 'suggested' };
}
