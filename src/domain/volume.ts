import type { SetType, TrackingType } from '@/db/schema';

export type LoggedSet = {
  type: SetType;
  weight: number | null;
  reps: number | null;
};

/** Warm-up sets count neither towards volume nor records. */
export function isWorkingSet(set: Pick<LoggedSet, 'type'>): boolean {
  return set.type !== 'warmup';
}

/**
 * Exercises whose `weight` is a load lifted, which counts towards volume. An assistance takes
 * weight off instead: it never does.
 */
export const VOLUME_TRACKING_TYPES: readonly TrackingType[] = [
  'weight_reps',
  'weighted_bodyweight',
];

export const countsVolume = (trackingType: TrackingType) =>
  VOLUME_TRACKING_TYPES.includes(trackingType);

/** Volume of a single set (weight × reps), 0 when incomplete. */
export function setVolume({ weight, reps }: LoggedSet): number {
  if (weight == null || reps == null) return 0;
  return weight * reps;
}

/** Total volume of working sets. */
export function totalVolume(sets: LoggedSet[]): number {
  return sets.filter(isWorkingSet).reduce((sum, set) => sum + setVolume(set), 0);
}

/** Estimated one-rep max using the Epley formula. */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** 4250.5 -> "4 251 kg" (narrow no-break space between thousands) */
export function formatVolume(volume: number): string {
  return `${String(Math.round(volume)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} kg`;
}
