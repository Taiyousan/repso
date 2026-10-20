import {
  canComplete,
  formatElapsed,
  formatPerformance,
  initialSetTypes,
  previousFor,
  remainingSeconds,
  resolveSetValues,
  type SetPerformance,
} from './logic';

const set = (overrides: Partial<SetPerformance> = {}): SetPerformance => ({
  type: 'normal',
  weight: 80,
  reps: 8,
  durationSeconds: null,
  ...overrides,
});

const empty = { weight: '', reps: '', duration: '' };

describe('initialSetTypes', () => {
  it('starts with three working sets without history', () => {
    expect(initialSetTypes([])).toEqual(['normal', 'normal', 'normal']);
  });

  it('repeats the previous structure', () => {
    expect(initialSetTypes([set({ type: 'warmup' }), set(), set({ type: 'dropset' })])).toEqual([
      'warmup',
      'normal',
      'dropset',
    ]);
  });
});

describe('previousFor', () => {
  const previous = [set({ weight: 60 }), set({ weight: 80 })];

  it('returns the set at the same position', () => {
    expect(previousFor(previous, 1)?.weight).toBe(80);
  });

  it('falls back to the last previous set for extra sets', () => {
    expect(previousFor(previous, 4)?.weight).toBe(80);
  });

  it('returns null without history', () => {
    expect(previousFor([], 0)).toBeNull();
  });
});

describe('formatPerformance', () => {
  it('formats weighted, bodyweight and timed sets', () => {
    expect(formatPerformance(set({ weight: 72.5 }), 'weight_reps')).toBe('72,5 × 8');
    expect(formatPerformance(set({ weight: null, reps: 12 }), 'bodyweight_reps')).toBe('× 12');
    expect(formatPerformance(set({ durationSeconds: 45 }), 'duration')).toBe('45 s');
    expect(formatPerformance(null, 'weight_reps')).toBe('—');
  });
});

describe('resolveSetValues', () => {
  it('uses typed values first', () => {
    expect(resolveSetValues({ ...empty, weight: '85', reps: '6' }, set(), 'weight_reps')).toEqual({
      weight: 85,
      reps: 6,
      durationSeconds: null,
    });
  });

  it('falls back to last time for empty fields', () => {
    expect(resolveSetValues({ ...empty, reps: '10' }, set(), 'weight_reps')).toEqual({
      weight: 80,
      reps: 10,
      durationSeconds: null,
    });
  });

  it('ignores weight for bodyweight exercises', () => {
    expect(resolveSetValues(empty, set({ weight: 20, reps: 12 }), 'bodyweight_reps')).toEqual({
      weight: null,
      reps: 12,
      durationSeconds: null,
    });
  });

  it('resolves durations', () => {
    expect(resolveSetValues(empty, set({ durationSeconds: 60 }), 'duration').durationSeconds).toBe(
      60,
    );
  });
});

describe('canComplete', () => {
  it('requires reps, or a duration for timed exercises', () => {
    expect(canComplete({ weight: 80, reps: null, durationSeconds: null }, 'weight_reps')).toBe(
      false,
    );
    expect(canComplete({ weight: null, reps: 10, durationSeconds: null }, 'weight_reps')).toBe(
      true,
    );
    expect(canComplete({ weight: null, reps: null, durationSeconds: 30 }, 'duration')).toBe(true);
  });
});

describe('timers', () => {
  it('rounds remaining seconds up and never goes negative', () => {
    expect(remainingSeconds(10_500, 10_000)).toBe(1);
    expect(remainingSeconds(10_000, 12_000)).toBe(0);
  });

  it('formats elapsed time', () => {
    expect(formatElapsed(65)).toBe('1:05');
    expect(formatElapsed(754)).toBe('12:34');
    expect(formatElapsed(3754)).toBe('1:02:34');
  });
});
