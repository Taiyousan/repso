import {
  bestSet,
  canComplete,
  formatElapsed,
  formatPerformance,
  initialSetTypes,
  isExerciseComplete,
  nextWorkout,
  parseTimeOfDay,
  previousFor,
  remainingSeconds,
  resolveSetValues,
  sessionTiming,
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

describe('isExerciseComplete', () => {
  it('needs every set validated', () => {
    const done = { completedAt: new Date() };
    const pending = { completedAt: null };
    expect(isExerciseComplete([done, done])).toBe(true);
    expect(isExerciseComplete([done, pending])).toBe(false);
    expect(isExerciseComplete([])).toBe(false);
  });
});

describe('bestSet', () => {
  it('prefers the heaviest set, then the most reps', () => {
    const sets = [
      set({ weight: 80, reps: 8 }),
      set({ weight: 85, reps: 5 }),
      set({ weight: 85, reps: 6 }),
    ];
    expect(bestSet(sets, 'weight_reps')).toMatchObject({ weight: 85, reps: 6 });
  });

  it('uses reps for bodyweight and duration for timed exercises', () => {
    expect(bestSet([set({ reps: 10 }), set({ reps: 14 })], 'bodyweight_reps')?.reps).toBe(14);
    expect(
      bestSet([set({ durationSeconds: 40 }), set({ durationSeconds: 60 })], 'duration')
        ?.durationSeconds,
    ).toBe(60);
  });

  it('returns null without sets', () => {
    expect(bestSet([], 'weight_reps')).toBeNull();
  });
});

describe('nextWorkout', () => {
  const ppl = { id: 1, workouts: [{ id: 10 }, { id: 11 }, { id: 12 }] };
  const fullBody = { id: 2, workouts: [{ id: 20 }, { id: 21 }] };

  it('follows the last workout done in its program', () => {
    expect(nextWorkout([ppl, fullBody], 11)).toEqual({ program: ppl, workout: { id: 12 } });
    expect(nextWorkout([ppl, fullBody], 20)).toEqual({ program: fullBody, workout: { id: 21 } });
  });

  it('starts the program over after its last workout', () => {
    expect(nextWorkout([ppl], 12)).toEqual({ program: ppl, workout: { id: 10 } });
  });

  it('falls back to the first workout when the last one is unknown or gone', () => {
    const empty = { id: 3, workouts: [] };
    expect(nextWorkout([empty, ppl], null)).toEqual({ program: ppl, workout: { id: 10 } });
    expect(nextWorkout([ppl], 99)).toEqual({ program: ppl, workout: { id: 10 } });
  });

  it('has nothing to suggest without workouts', () => {
    expect(nextWorkout([{ id: 3, workouts: [] }], null)).toBeNull();
  });
});

describe('parseTimeOfDay', () => {
  it('reads the usual ways of writing a time', () => {
    expect(parseTimeOfDay('18:05')).toBe(18 * 60 + 5);
    expect(parseTimeOfDay('18h05')).toBe(18 * 60 + 5);
    expect(parseTimeOfDay('18h')).toBe(18 * 60);
    expect(parseTimeOfDay(' 7 ')).toBe(7 * 60);
    expect(parseTimeOfDay('0930')).toBe(9 * 60 + 30);
  });

  it('refuses what is not a time', () => {
    expect(parseTimeOfDay('')).toBeNull();
    expect(parseTimeOfDay('24:00')).toBeNull();
    expect(parseTimeOfDay('18:75')).toBeNull();
    expect(parseTimeOfDay('soir')).toBeNull();
  });
});

describe('sessionTiming', () => {
  it('starts on the given day at the given time', () => {
    const timing = sessionTiming(new Date(2026, 10, 4, 23, 59), 18 * 60 + 30, 75);
    expect(timing.startedAt).toEqual(new Date(2026, 10, 4, 18, 30));
    expect(timing.endedAt).toEqual(new Date(2026, 10, 4, 19, 45));
  });
});
