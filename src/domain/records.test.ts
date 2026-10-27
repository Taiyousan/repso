import {
  computeRecords,
  type ExerciseRecords,
  formatRecord,
  type RecordSet,
  recordKindsFor,
  recordSetIds,
  recordsBeaten,
  sessionNewRecords,
  setRecordValues,
} from './records';

const set = (overrides: Partial<RecordSet> = {}): RecordSet => ({
  type: 'normal',
  weight: 80,
  reps: 8,
  durationSeconds: null,
  ...overrides,
});

const at = (day: number) => new Date(2026, 9, day);
const dated = (overrides: Partial<RecordSet>, day: number) => ({ ...set(overrides), at: at(day) });

describe('recordKindsFor', () => {
  it('tracks weight, 1RM and volume on weighted exercises', () => {
    expect(recordKindsFor('weight_reps')).toEqual(['weight', 'oneRepMax', 'volume']);
    expect(recordKindsFor('bodyweight_reps')).toEqual(['reps']);
    expect(recordKindsFor('duration')).toEqual(['duration']);
  });
});

describe('setRecordValues', () => {
  it('scores a weighted set', () => {
    expect(setRecordValues(set({ weight: 90, reps: 6 }), 'weight_reps')).toEqual({
      weight: 90,
      oneRepMax: 108,
      volume: 540,
    });
  });

  it('ignores warm-ups and incomplete sets', () => {
    expect(setRecordValues(set({ type: 'warmup', weight: 200 }), 'weight_reps')).toEqual({});
    expect(setRecordValues(set({ weight: null }), 'weight_reps')).toEqual({});
    expect(setRecordValues(set({ reps: null }), 'weight_reps')).toEqual({});
  });

  it('scores bodyweight and timed sets', () => {
    expect(setRecordValues(set({ weight: null, reps: 14 }), 'bodyweight_reps')).toEqual({
      reps: 14,
    });
    expect(setRecordValues(set({ durationSeconds: 45 }), 'duration')).toEqual({ duration: 45 });
  });
});

describe('computeRecords', () => {
  it('keeps the best value of each kind with its date', () => {
    const records = computeRecords(
      [
        dated({ weight: 100, reps: 1 }, 1),
        dated({ weight: 80, reps: 12 }, 5),
        dated({ type: 'warmup', weight: 200, reps: 5 }, 8),
      ],
      'weight_reps',
    );
    expect(records.weight).toEqual({ value: 100, at: at(1) });
    expect(records.volume).toEqual({ value: 960, at: at(5) });
    expect(records.oneRepMax?.value).toBeCloseTo(112);
  });

  it('lets the oldest set keep a tied record', () => {
    const records = computeRecords([dated({}, 1), dated({}, 9)], 'weight_reps');
    expect(records.weight).toEqual({ value: 80, at: at(1) });
  });

  it('returns nothing without history', () => {
    expect(computeRecords([], 'weight_reps')).toEqual({});
  });
});

describe('recordsBeaten', () => {
  const records: ExerciseRecords = {
    weight: { value: 90, at: at(1) },
    oneRepMax: { value: 108, at: at(1) },
    volume: { value: 640, at: at(1) },
  };

  it('lists the records a set beats', () => {
    expect(recordsBeaten(set({ weight: 95, reps: 5 }), records, 'weight_reps')).toEqual([
      'weight',
      'oneRepMax',
    ]);
  });

  it('ignores a set that only ties', () => {
    expect(recordsBeaten(set({ weight: 90, reps: 1 }), records, 'weight_reps')).toEqual([]);
  });

  it('counts every record as new without history', () => {
    expect(recordsBeaten(set(), {}, 'weight_reps')).toEqual(['weight', 'oneRepMax', 'volume']);
  });

  it('ignores warm-ups', () => {
    expect(recordsBeaten(set({ type: 'warmup', weight: 200 }), records, 'weight_reps')).toEqual([]);
  });
});

describe('sessionNewRecords', () => {
  const exercise = { id: 7, name: 'Développé couché', trackingType: 'weight_reps' as const };

  it('keeps the best new value of each kind', () => {
    expect(
      sessionNewRecords([
        {
          exercise,
          sets: [set({ weight: 95, reps: 5 }), set({ weight: 100, reps: 3 })],
          records: { weight: { value: 90, at: at(1) } },
        },
      ]),
    ).toMatchObject([
      // 100 kg is the heaviest, but 95 × 5 is the better 1RM and the bigger volume.
      { kind: 'weight', value: 100 },
      { kind: 'oneRepMax', value: expect.closeTo(110.83, 1) },
      { kind: 'volume', value: 475 },
    ]);
  });

  it('announces one record when the exercise is in the session twice', () => {
    const entry = (sets: RecordSet[]) => ({ exercise, sets, records: {} });
    expect(
      sessionNewRecords([
        entry([set({ weight: 80, reps: 8 })]),
        entry([set({ weight: 100, reps: 8 })]),
      ]).filter((record) => record.kind === 'weight'),
    ).toEqual([{ exerciseId: 7, exerciseName: 'Développé couché', kind: 'weight', value: 100 }]);
  });

  it('returns nothing when no record was beaten', () => {
    expect(
      sessionNewRecords([
        {
          exercise,
          sets: [set({ weight: 60, reps: 8 })],
          records: {
            weight: { value: 90, at: at(1) },
            oneRepMax: { value: 108, at: at(1) },
            volume: { value: 640, at: at(1) },
          },
        },
      ]),
    ).toEqual([]);
  });
});

describe('recordSetIds', () => {
  const records: ExerciseRecords = {
    weight: { value: 90, at: at(1) },
    oneRepMax: { value: 120, at: at(1) },
    volume: { value: 1000, at: at(1) },
  };
  const withId = (id: number, overrides: Partial<RecordSet>) => ({ id, ...set(overrides) });

  it('keeps only the best set of each kind', () => {
    const ids = recordSetIds(
      [withId(1, { weight: 95, reps: 5 }), withId(2, { weight: 100, reps: 5 })],
      records,
      'weight_reps',
    );
    expect([...ids]).toEqual([2]);
  });

  it('flags the set holding each kind', () => {
    // The heaviest set, then the one with the most volume: two different records.
    const ids = recordSetIds(
      [withId(1, { weight: 100, reps: 2 }), withId(2, { weight: 95, reps: 10 })],
      records,
      'weight_reps',
    );
    expect([...ids].sort()).toEqual([1, 2]);
  });

  it('flags nothing when no record is beaten', () => {
    expect(recordSetIds([withId(1, { weight: 80, reps: 5 })], records, 'weight_reps').size).toBe(0);
  });
});

describe('formatRecord', () => {
  it('formats each kind', () => {
    expect(formatRecord('weight', 92.5)).toBe('92,5 kg');
    expect(formatRecord('oneRepMax', 108.333)).toBe('108,3 kg');
    expect(formatRecord('volume', 1480)).toBe('1 480 kg');
    expect(formatRecord('reps', 14)).toBe('14 reps');
    expect(formatRecord('duration', 45)).toBe('45 s');
    expect(formatRecord('duration', 240)).toBe('4:00');
  });
});
