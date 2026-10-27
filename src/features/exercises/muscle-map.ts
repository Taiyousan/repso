import type { ExtendedBodyPart, Slug } from 'react-native-body-highlighter';

import type { Muscle } from './labels';

/** free-exercise-db muscles -> react-native-body-highlighter parts. */
const BODY_PARTS: Record<Muscle, Slug[]> = {
  chest: ['chest'],
  shoulders: ['deltoids'],
  triceps: ['triceps'],
  biceps: ['biceps'],
  forearms: ['forearm'],
  lats: ['upper-back'],
  'middle back': ['upper-back'],
  traps: ['trapezius'],
  'lower back': ['lower-back'],
  abdominals: ['abs', 'obliques'],
  quadriceps: ['quadriceps'],
  hamstrings: ['hamstring'],
  glutes: ['gluteal'],
  calves: ['calves'],
  adductors: ['adductors'],
  abductors: ['gluteal'],
  neck: ['neck'],
};

export const PRIMARY_INTENSITY = 1;
export const SECONDARY_INTENSITY = 2;

function partsOf(muscles: string[]): Set<Slug> {
  return new Set(muscles.flatMap((muscle) => BODY_PARTS[muscle as Muscle] ?? []));
}

/** Highlight data: primary muscles win over secondary ones mapped to the same part. */
export function toBodyParts(
  primaryMuscles: string[],
  secondaryMuscles: string[],
): ExtendedBodyPart[] {
  const primary = partsOf(primaryMuscles);
  const secondary = [...partsOf(secondaryMuscles)].filter((slug) => !primary.has(slug));

  return [
    ...[...primary].map((slug) => ({ slug, intensity: PRIMARY_INTENSITY })),
    ...secondary.map((slug) => ({ slug, intensity: SECONDARY_INTENSITY })),
  ];
}

/**
 * Highlight data scaled on a value per muscle: intensity 1 (least) to `levels` (most), relative to
 * the highest value. Muscles sharing a part show the bigger value.
 */
export function toBodyHeat(values: { muscle: string; value: number }[], levels: number) {
  const byPart = new Map<Slug, number>();
  for (const { muscle, value } of values) {
    for (const slug of BODY_PARTS[muscle as Muscle] ?? []) {
      byPart.set(slug, Math.max(byPart.get(slug) ?? 0, value));
    }
  }
  const max = Math.max(0, ...byPart.values());
  return [...byPart]
    .filter(([, value]) => value > 0)
    .map(([slug, value]): ExtendedBodyPart => ({
      slug,
      intensity: Math.max(1, Math.ceil((value / max) * levels)),
    }));
}
