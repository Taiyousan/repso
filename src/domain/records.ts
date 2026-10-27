import type { SetType, TrackingType } from '@/db/schema';

import { estimateOneRepMax, formatVolume, isWorkingSet, setVolume } from './volume';

/** Records tracked, each the best value ever reached on a working set. */
export const RECORD_KINDS = ['weight', 'oneRepMax', 'volume', 'reps', 'duration'] as const;
export type RecordKind = (typeof RECORD_KINDS)[number];

export const RECORD_LABELS: Record<RecordKind, string> = {
  weight: 'Charge max',
  oneRepMax: '1RM estimé',
  volume: 'Volume max',
  reps: 'Reps max',
  duration: 'Durée max',
};

const KINDS_BY_TRACKING: Record<TrackingType, RecordKind[]> = {
  weight_reps: ['weight', 'oneRepMax', 'volume'],
  bodyweight_reps: ['reps'],
  duration: ['duration'],
  distance: ['duration'],
};

/** Records that make sense for an exercise, in display order. */
export function recordKindsFor(trackingType: TrackingType): RecordKind[] {
  return KINDS_BY_TRACKING[trackingType];
}

/** "92,5 kg", "720 kg", "14 reps", "45 s" */
export function formatRecord(kind: RecordKind, value: number): string {
  if (kind === 'reps') return `${value} reps`;
  // Same shape as rest times once past a minute: "45 s", then "4:00".
  if (kind === 'duration') {
    return value < 60
      ? `${value} s`
      : `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
  }
  if (kind === 'volume') return formatVolume(value);
  // A 1RM is estimated: a tenth of a kilo is already more precision than it deserves.
  return `${String(Math.round(value * 10) / 10).replace('.', ',')} kg`;
}

export type RecordSet = {
  type: SetType;
  weight: number | null;
  reps: number | null;
  durationSeconds: number | null;
};

export type RecordEntry = { value: number; at: Date };
export type ExerciseRecords = Partial<Record<RecordKind, RecordEntry>>;

/** What a single set scores on each record, warm-ups and incomplete sets scoring nothing. */
export function setRecordValues(
  set: RecordSet,
  trackingType: TrackingType,
): Partial<Record<RecordKind, number>> {
  if (!isWorkingSet(set)) return {};

  if (trackingType === 'duration' || trackingType === 'distance') {
    return set.durationSeconds ? { duration: set.durationSeconds } : {};
  }
  if (trackingType === 'bodyweight_reps') {
    return set.reps ? { reps: set.reps } : {};
  }
  if (!set.weight || !set.reps) return {};
  return {
    weight: set.weight,
    oneRepMax: estimateOneRepMax(set.weight, set.reps),
    volume: setVolume(set),
  };
}

/** Best value of each record over past sets. */
export function computeRecords(
  sets: (RecordSet & { at: Date })[],
  trackingType: TrackingType,
): ExerciseRecords {
  const records: ExerciseRecords = {};
  for (const set of sets) {
    for (const [kind, value] of Object.entries(setRecordValues(set, trackingType))) {
      const current = records[kind as RecordKind];
      // On a tie the oldest set keeps the record: it was reached first.
      if (!current || value > current.value) records[kind as RecordKind] = { value, at: set.at };
    }
  }
  return records;
}

/** Records a set beats, in display order; every record is new when there is no history. */
export function recordsBeaten(
  set: RecordSet,
  records: ExerciseRecords,
  trackingType: TrackingType,
): RecordKind[] {
  const values = setRecordValues(set, trackingType);
  return recordKindsFor(trackingType).filter((kind) => {
    const value = values[kind];
    if (value == null || value <= 0) return false;
    const current = records[kind];
    return current == null || value > current.value;
  });
}

export type NewRecord = {
  exerciseId: number;
  exerciseName: string;
  kind: RecordKind;
  value: number;
};

type RecordedExercise = {
  exercise: { id: number; name: string; trackingType: TrackingType };
  sets: RecordSet[];
  /** Records before this session. */
  records: ExerciseRecords;
};

/** Best new value of each kind beaten during the session, keyed by set. */
function bestNewValues<T extends RecordSet>(
  sets: T[],
  records: ExerciseRecords,
  trackingType: TrackingType,
): Map<RecordKind, { set: T; value: number }> {
  const best = new Map<RecordKind, { set: T; value: number }>();
  for (const set of sets) {
    const values = setRecordValues(set, trackingType);
    for (const kind of recordsBeaten(set, records, trackingType)) {
      const value = values[kind]!;
      const current = best.get(kind);
      if (!current || value > current.value) best.set(kind, { set, value });
    }
  }
  return best;
}

/**
 * Sets holding a record of the exercise: the best one of each kind beaten. Only one set per kind,
 * so a whole series of heavier and heavier sets doesn't claim the same record over and over.
 */
export function recordSetIds(
  sets: (RecordSet & { id: number })[],
  records: ExerciseRecords,
  trackingType: TrackingType,
): Set<number> {
  const best = bestNewValues(sets, records, trackingType);
  return new Set([...best.values()].map((entry) => entry.set.id));
}

/** Records set during a session: the best new value of each kind, per exercise. */
export function sessionNewRecords(exercises: RecordedExercise[]): NewRecord[] {
  // Keyed by exercise: the same one can be in a session twice, and holds a single record.
  const best = new Map<string, NewRecord>();

  for (const { exercise, sets, records } of exercises) {
    for (const [kind, entry] of bestNewValues(sets, records, exercise.trackingType)) {
      const key = `${exercise.id}-${kind}`;
      const current = best.get(key);
      if (!current || entry.value > current.value) {
        best.set(key, {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          kind,
          value: entry.value,
        });
      }
    }
  }
  return [...best.values()];
}
