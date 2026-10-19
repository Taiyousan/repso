import {
  defaultSets,
  formatDecimal,
  formatDuration,
  mainMuscles,
  nextSet,
  nextSetType,
  parseDecimal,
  parseInteger,
  setBadges,
} from './sets';

describe('defaultSets', () => {
  it('creates three sets of 10 reps for rep-based exercises', () => {
    const sets = defaultSets('weight_reps');
    expect(sets).toHaveLength(3);
    expect(sets.every((set) => set.targetReps === 10 && set.type === 'normal')).toBe(true);
  });

  it('creates timed sets for duration exercises', () => {
    expect(defaultSets('duration')[0]).toMatchObject({
      targetReps: null,
      targetDurationSeconds: 30,
    });
  });

  it('returns independent objects', () => {
    const sets = defaultSets('weight_reps');
    sets[0].targetReps = 5;
    expect(sets[1].targetReps).toBe(10);
  });
});

describe('nextSet', () => {
  it('copies the previous set', () => {
    const previous = {
      type: 'normal' as const,
      targetReps: 8,
      targetWeight: 80,
      targetDurationSeconds: null,
    };
    expect(nextSet(previous, 'weight_reps')).toEqual(previous);
  });

  it('turns a warm-up into a working set', () => {
    const warmup = {
      type: 'warmup' as const,
      targetReps: 12,
      targetWeight: 40,
      targetDurationSeconds: null,
    };
    expect(nextSet(warmup, 'weight_reps').type).toBe('normal');
  });

  it('falls back to defaults without a previous set', () => {
    expect(nextSet(undefined, 'duration').targetDurationSeconds).toBe(30);
  });
});

describe('nextSetType', () => {
  it('cycles through every set type', () => {
    expect(nextSetType('normal')).toBe('warmup');
    expect(nextSetType('warmup')).toBe('dropset');
    expect(nextSetType('dropset')).toBe('failure');
    expect(nextSetType('failure')).toBe('normal');
  });
});

describe('setBadges', () => {
  it('numbers working sets only', () => {
    expect(setBadges(['warmup', 'normal', 'normal', 'dropset', 'failure'])).toEqual([
      'É',
      '1',
      '2',
      'D',
      'E',
    ]);
  });
});

describe('formatDuration', () => {
  it('formats seconds as m:ss', () => {
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(45)).toBe('0:45');
    expect(formatDuration(300)).toBe('5:00');
  });
});

describe('number parsing', () => {
  it('accepts a comma as decimal separator', () => {
    expect(parseDecimal('72,5')).toBe(72.5);
    expect(parseDecimal(' 80 ')).toBe(80);
  });

  it('returns null for empty or invalid input', () => {
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('-5')).toBeNull();
  });

  it('rounds integers', () => {
    expect(parseInteger('8,6')).toBe(9);
  });

  it('formats decimals with a comma', () => {
    expect(formatDecimal(72.5)).toBe('72,5');
    expect(formatDecimal(null)).toBe('');
  });
});

describe('mainMuscles', () => {
  it('orders muscles by frequency', () => {
    expect(
      mainMuscles([
        { primaryMuscles: ['chest'] },
        { primaryMuscles: ['triceps'] },
        { primaryMuscles: ['chest'] },
      ]),
    ).toEqual(['chest', 'triceps']);
  });
});
