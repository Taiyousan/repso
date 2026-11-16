import type { TrackingType } from '@/db/schema';

export type WeighIn = { measuredAt: Date; weight: number };

/**
 * Body weight on a date: the last weigh-in up to it, else the first one after it (a workout older
 * than any weigh-in gets the closest one). Null without any weigh-in. `weighIns` oldest first.
 */
export function bodyWeightAt(weighIns: WeighIn[], date: Date): number | null {
  let weight: number | null = null;
  for (const weighIn of weighIns) {
    if (weighIn.measuredAt > date) return weight ?? weighIn.weight;
    weight = weighIn.weight;
  }
  return weight;
}

/** Exercises whose effective load depends on the body weight. */
export function usesBodyWeight(trackingType: TrackingType): boolean {
  return trackingType === 'weighted_bodyweight' || trackingType === 'assisted_reps';
}

/**
 * What is really lifted on a bodyweight exercise: the body plus the added load, or the body minus
 * the assistance (never below 0). Null for other exercises.
 */
export function effectiveLoad(
  trackingType: TrackingType,
  weight: number | null,
  bodyWeight: number,
): number | null {
  if (trackingType === 'weighted_bodyweight') return bodyWeight + (weight ?? 0);
  if (trackingType === 'assisted_reps') return Math.max(0, bodyWeight - (weight ?? 0));
  return null;
}
