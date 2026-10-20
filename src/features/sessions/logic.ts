import type { SetType, TrackingType } from '@/db/schema';
import { formatDecimal, parseDecimal, parseInteger } from '@/features/programs/sets';

/** Sets an exercise starts with when it has never been done. */
export const DEFAULT_SESSION_SET_COUNT = 3;

export type SetPerformance = {
  type: SetType;
  weight: number | null;
  reps: number | null;
  durationSeconds: number | null;
};

/**
 * Sets created when an exercise enters a session: same count and types as last time,
 * values left empty (the previous ones are shown as placeholders).
 */
export function initialSetTypes(previous: SetPerformance[]): SetType[] {
  if (previous.length === 0)
    return Array.from({ length: DEFAULT_SESSION_SET_COUNT }, () => 'normal');
  return previous.map((set) => set.type);
}

/** Reference shown for a set: same position last time, else the last set done then. */
export function previousFor(previous: SetPerformance[], index: number): SetPerformance | null {
  return previous[index] ?? previous.at(-1) ?? null;
}

/** "80 × 8", "× 12" (bodyweight), "45 s" */
export function formatPerformance(set: SetPerformance | null, trackingType: TrackingType): string {
  if (!set) return '—';
  if (trackingType === 'duration' || trackingType === 'distance') {
    return set.durationSeconds == null ? '—' : `${set.durationSeconds} s`;
  }
  const reps = set.reps == null ? '?' : String(set.reps);
  if (trackingType === 'bodyweight_reps' || set.weight == null) return `× ${reps}`;
  return `${formatDecimal(set.weight)} × ${reps}`;
}

export type SetInput = { weight: string; reps: string; duration: string };

/** Values saved when a set is validated: what was typed, else the placeholder from last time. */
export function resolveSetValues(
  input: SetInput,
  placeholder: SetPerformance | null,
  trackingType: TrackingType,
): Pick<SetPerformance, 'weight' | 'reps' | 'durationSeconds'> {
  const pick = <T>(typed: T | null, fallback: T | null | undefined) => typed ?? fallback ?? null;

  if (trackingType === 'duration' || trackingType === 'distance') {
    return {
      weight: null,
      reps: null,
      durationSeconds: pick(parseInteger(input.duration), placeholder?.durationSeconds),
    };
  }
  return {
    weight:
      trackingType === 'weight_reps' ? pick(parseDecimal(input.weight), placeholder?.weight) : null,
    reps: pick(parseInteger(input.reps), placeholder?.reps),
    durationSeconds: null,
  };
}

/** A set can be validated once it has a value, typed or from last time. */
export function canComplete(
  values: ReturnType<typeof resolveSetValues>,
  trackingType: TrackingType,
) {
  if (trackingType === 'duration' || trackingType === 'distance')
    return values.durationSeconds != null;
  return values.reps != null;
}

/** Seconds left before `endsAt`, never negative. */
export function remainingSeconds(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

/** 754 -> "12:34", 3754 -> "1:02:34" */
export function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes);
  return `${hours > 0 ? `${hours}:` : ''}${mm}:${String(seconds).padStart(2, '0')}`;
}

/** An exercise is done once every one of its sets is validated. */
export function isExerciseComplete(sets: { completedAt: Date | null }[]): boolean {
  return sets.length > 0 && sets.every((set) => set.completedAt != null);
}

/** Best set of an exercise: heaviest (then most reps), most reps, or longest. */
export function bestSet(sets: SetPerformance[], trackingType: TrackingType): SetPerformance | null {
  const score = (set: SetPerformance): [number, number] => {
    if (trackingType === 'duration' || trackingType === 'distance') {
      return [set.durationSeconds ?? 0, 0];
    }
    if (trackingType === 'bodyweight_reps') return [set.reps ?? 0, 0];
    return [set.weight ?? 0, set.reps ?? 0];
  };
  let best: SetPerformance | null = null;
  for (const set of sets) {
    if (!best) {
      best = set;
      continue;
    }
    const [a1, a2] = score(set);
    const [b1, b2] = score(best);
    if (a1 > b1 || (a1 === b1 && a2 > b2)) best = set;
  }
  return best;
}
