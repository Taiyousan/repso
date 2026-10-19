import type { SetType, TrackingType } from '@/db/schema';

/** Rest time used when an exercise doesn't define its own. */
export const DEFAULT_REST_SECONDS = 90;
export const REST_PRESETS = [30, 45, 60, 90, 120, 150, 180, 240, 300] as const;

export type TemplateSetValues = {
  type: SetType;
  targetReps: number | null;
  targetWeight: number | null;
  targetDurationSeconds: number | null;
};

const DEFAULT_SET_COUNT = 3;

/** Sets created when an exercise is added to a workout template. */
export function defaultSets(trackingType: TrackingType): TemplateSetValues[] {
  const set: TemplateSetValues =
    trackingType === 'duration'
      ? { type: 'normal', targetReps: null, targetWeight: null, targetDurationSeconds: 30 }
      : { type: 'normal', targetReps: 10, targetWeight: null, targetDurationSeconds: null };
  return Array.from({ length: DEFAULT_SET_COUNT }, () => ({ ...set }));
}

/** A new set copies the previous one (a warm-up is followed by a working set). */
export function nextSet(
  previous: TemplateSetValues | undefined,
  trackingType: TrackingType,
): TemplateSetValues {
  if (!previous) return defaultSets(trackingType)[0];
  return { ...previous, type: previous.type === 'warmup' ? 'normal' : previous.type };
}

const SET_TYPE_CYCLE: SetType[] = ['normal', 'warmup', 'dropset', 'failure'];

export function nextSetType(type: SetType): SetType {
  return SET_TYPE_CYCLE[(SET_TYPE_CYCLE.indexOf(type) + 1) % SET_TYPE_CYCLE.length];
}

export const SET_TYPE_LABELS: Record<SetType, string> = {
  normal: 'Série normale',
  warmup: 'Échauffement',
  dropset: 'Série dégressive',
  failure: "Jusqu'à l'échec",
};

const SET_TYPE_BADGES: Record<Exclude<SetType, 'normal'>, string> = {
  warmup: 'É',
  dropset: 'D',
  failure: 'E',
};

/** Badge of each set: working sets are numbered, others get a letter. */
export function setBadges(types: SetType[]): string[] {
  let count = 0;
  return types.map((type) => (type === 'normal' ? String(++count) : SET_TYPE_BADGES[type]));
}

/** 90 -> "1:30" */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Accepts "72,5" as well as "72.5"; empty or invalid input gives null. */
export function parseDecimal(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;
  const value = Number(trimmed.replace(',', '.'));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function parseInteger(input: string): number | null {
  const value = parseDecimal(input);
  return value == null ? null : Math.round(value);
}

/** 72.5 -> "72,5" */
export function formatDecimal(value: number | null): string {
  return value == null ? '' : String(value).replace('.', ',');
}

/** Most frequent primary muscles of a workout, most worked first. */
export function mainMuscles(exercises: { primaryMuscles: string[] }[], limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const exercise of exercises) {
    for (const muscle of exercise.primaryMuscles) {
      counts.set(muscle, (counts.get(muscle) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([muscle]) => muscle);
}
