import { inArray } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises } from '@/db/schema';

import type { ProgramFileExercise, ProgramFileProgram } from './transfer/format';
import { importProgram } from './transfer/import';
import { listImportRefs, type Resolution } from './transfer/plan';

const item = (slug: string, target: string, restSeconds: number): ProgramFileExercise => ({
  slug,
  target,
  restSeconds,
});

/** Classic programs offered to start with, built from essential library exercises. */
export const SUGGESTED_PROGRAMS: ProgramFileProgram[] = [
  {
    name: 'Full body débutant',
    description:
      '3 séances par semaine en alternant A et B, par exemple lundi A, mercredi B, vendredi A. Idéal pour débuter.',
    workouts: [
      {
        name: 'Full body A',
        exercises: [
          item('barbell-squat', '3 × 8-10', 120),
          item('barbell-bench-press-medium-grip', '3 × 8-10', 120),
          item('bent-over-barbell-row', '3 × 8-10', 90),
          item('dumbbell-shoulder-press', '3 × 10-12', 90),
          item('lying-leg-curls', '3 × 10-12', 60),
          item('plank', '3 × 30-45 s', 60),
        ],
      },
      {
        name: 'Full body B',
        exercises: [
          item('romanian-deadlift', '3 × 8-10', 120),
          item('incline-dumbbell-press', '3 × 10-12', 90),
          item('wide-grip-lat-pulldown', '3 × 10-12', 90),
          item('leg-press', '3 × 10-12', 90),
          item('side-lateral-raise', '3 × 12-15', 60),
          item('crunches', '3 × 15', 60),
        ],
      },
    ],
  },
  {
    name: 'Push Pull Legs',
    description:
      '3 séances par semaine, ou 6 en enchaînant deux tours : poussée, tirage, puis jambes.',
    workouts: [
      {
        name: 'Push',
        exercises: [
          item('barbell-bench-press-medium-grip', '4 × 6-8', 150),
          item('dumbbell-shoulder-press', '3 × 8-10', 90),
          item('incline-dumbbell-press', '3 × 10-12', 90),
          item('side-lateral-raise', '3 × 12-15', 60),
          item('triceps-pushdown-rope-attachment', '3 × 10-12', 60),
          item('dips-triceps-version', '3 × max', 90),
        ],
      },
      {
        name: 'Pull',
        exercises: [
          item('bent-over-barbell-row', '4 × 6-8', 120),
          item('wide-grip-lat-pulldown', '3 × 8-10', 90),
          item('seated-cable-rows', '3 × 10-12', 90),
          item('face-pull', '3 × 12-15', 60),
          item('barbell-curl', '3 × 8-10', 60),
          item('hammer-curls', '3 × 10-12', 60),
        ],
      },
      {
        name: 'Legs',
        exercises: [
          item('barbell-squat', '4 × 6-8', 180),
          item('romanian-deadlift', '3 × 8-10', 120),
          item('leg-press', '3 × 10-12', 90),
          item('lying-leg-curls', '3 × 10-12', 60),
          item('leg-extensions', '3 × 12-15', 60),
          item('standing-calf-raises', '4 × 10-15', 60),
        ],
      },
    ],
  },
  {
    name: 'Haut / Bas',
    description:
      '4 séances par semaine, par exemple lundi Haut A, mardi Bas A, jeudi Haut B, vendredi Bas B. Pour progresser après quelques mois.',
    workouts: [
      {
        name: 'Haut A',
        exercises: [
          item('barbell-bench-press-medium-grip', '4 × 6-8', 150),
          item('bent-over-barbell-row', '4 × 6-8', 120),
          item('dumbbell-shoulder-press', '3 × 8-10', 90),
          item('wide-grip-lat-pulldown', '3 × 10-12', 90),
          item('barbell-curl', '3 × 10-12', 60),
          item('triceps-pushdown', '3 × 10-12', 60),
        ],
      },
      {
        name: 'Bas A',
        exercises: [
          item('barbell-squat', '4 × 6-8', 180),
          item('romanian-deadlift', '3 × 8-10', 120),
          item('leg-press', '3 × 10-12', 90),
          item('lying-leg-curls', '3 × 10-12', 60),
          item('standing-calf-raises', '4 × 10-15', 60),
          item('plank', '3 × 45 s', 60),
        ],
      },
      {
        name: 'Haut B',
        exercises: [
          item('incline-dumbbell-press', '4 × 8-10', 120),
          item('seated-cable-rows', '4 × 8-10', 90),
          item('pullups', '3 × max', 120),
          item('side-lateral-raise', '3 × 12-15', 60),
          item('hammer-curls', '3 × 10-12', 60),
          item('triceps-overhead-extension-with-rope', '3 × 10-12', 60),
        ],
      },
      {
        name: 'Bas B',
        exercises: [
          item('barbell-deadlift', '3 × 5', 180),
          item('split-squat-with-dumbbells', '3 × 8-10', 90),
          item('barbell-hip-thrust', '3 × 8-10', 90),
          item('leg-extensions', '3 × 12-15', 60),
          item('seated-calf-raise', '4 × 12-15', 60),
          item('hanging-leg-raise', '3 × 10-12', 60),
        ],
      },
    ],
  },
];

const slugsOf = (programs: ProgramFileProgram[]) =>
  programs.flatMap((program) =>
    program.workouts.flatMap((workout) => workout.exercises.map((entry) => entry.slug ?? '')),
  );

function readExercises(slugs: string[]) {
  return db
    .select({ id: exercises.id, slug: exercises.slug, name: exercises.name })
    .from(exercises)
    .where(inArray(exercises.slug, slugs))
    .all();
}

/** French names of the suggested programs' exercises, by slug. */
export function readSuggestedExerciseNames(): Map<string, string> {
  return new Map(readExercises(slugsOf(SUGGESTED_PROGRAMS)).map((row) => [row.slug, row.name]));
}

/** Adds a copy of a suggested program, with its exercises found in the library by slug. */
export function addSuggestedProgram(program: ProgramFileProgram): number {
  const ids = new Map(readExercises(slugsOf([program])).map((row) => [row.slug, row.id]));
  const refs = listImportRefs(program, (entry) => {
    const exerciseId = ids.get(entry.slug ?? '');
    return exerciseId == null ? { kind: 'none' } : { kind: 'exact', exerciseId };
  });
  const resolutions = Object.fromEntries(
    refs.map((ref): [string, Resolution] => [
      ref.key,
      ref.match.kind === 'none'
        ? { kind: 'skip' }
        : { kind: 'library', exerciseId: ref.match.exerciseId },
    ]),
  );
  return importProgram(program, refs, resolutions);
}
