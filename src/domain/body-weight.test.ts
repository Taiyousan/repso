import { bodyWeightAt, effectiveLoad } from './body-weight';
import { computeRecords, setRecordValues } from './records';

const day = (date: number) => new Date(2026, 10, date);
const weighIns = [
  { measuredAt: day(5), weight: 80 },
  { measuredAt: day(15), weight: 78 },
];

describe('bodyWeightAt', () => {
  it('uses the last weigh-in up to the date', () => {
    expect(bodyWeightAt(weighIns, day(10))).toBe(80);
    expect(bodyWeightAt(weighIns, day(15))).toBe(78);
    expect(bodyWeightAt(weighIns, day(30))).toBe(78);
  });

  it('falls back to the first weigh-in for an older date', () => {
    expect(bodyWeightAt(weighIns, day(1))).toBe(80);
  });

  it('is unknown without any weigh-in', () => {
    expect(bodyWeightAt([], day(1))).toBeNull();
  });
});

describe('effectiveLoad', () => {
  it('adds the load or takes the assistance off', () => {
    expect(effectiveLoad('weighted_bodyweight', 10, 75)).toBe(85);
    expect(effectiveLoad('weighted_bodyweight', null, 75)).toBe(75);
    expect(effectiveLoad('assisted_reps', 30, 75)).toBe(45);
    expect(effectiveLoad('assisted_reps', 90, 75)).toBe(0);
    expect(effectiveLoad('weight_reps', 100, 75)).toBeNull();
  });
});

describe('effective load records', () => {
  const set = { type: 'normal' as const, reps: 6, durationSeconds: null };

  it('scores the effective load once the body weight is known', () => {
    expect(setRecordValues({ ...set, weight: 20, bodyWeight: 75 }, 'assisted_reps')).toEqual({
      reps: 6,
      assistance: 20,
      load: 55,
    });
    expect(setRecordValues({ ...set, weight: 20 }, 'assisted_reps')).not.toHaveProperty('load');
  });

  it('follows the body weight of each workout', () => {
    // Same assistance, but a lighter body: less is lifted.
    const records = computeRecords(
      [
        { ...set, weight: 20, bodyWeight: 80, at: day(5) },
        { ...set, weight: 20, bodyWeight: 78, at: day(15) },
      ],
      'assisted_reps',
    );
    expect(records.load).toEqual({ value: 60, at: day(5) });
  });
});
