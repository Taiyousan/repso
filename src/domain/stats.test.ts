import type { RecordSet } from './records';
import {
  currentWeek,
  monthWeeks,
  periodStart,
  progressSeries,
  setsPerMuscle,
  startOfWeek,
  trainingCalendar,
  weeklyTotals,
  weekStreak,
} from './stats';

// Tuesday 27 October 2026, evening.
const now = new Date(2026, 9, 27, 20, 0);
const day = (date: number, month = 9, hours = 18) => new Date(2026, month, date, hours);

describe('startOfWeek', () => {
  it('goes back to Monday midnight', () => {
    expect(startOfWeek(now)).toEqual(new Date(2026, 9, 26));
    expect(startOfWeek(new Date(2026, 9, 26, 0, 0))).toEqual(new Date(2026, 9, 26));
  });

  it('treats Sunday as the end of the week', () => {
    expect(startOfWeek(new Date(2026, 10, 1, 10))).toEqual(new Date(2026, 9, 26));
  });
});

describe('periodStart', () => {
  it('includes today in the period', () => {
    expect(periodStart(7, now)).toEqual(new Date(2026, 9, 21));
  });
});

describe('weeklyTotals', () => {
  it('buckets sessions by week, oldest first', () => {
    const weeks = weeklyTotals(
      [
        { startedAt: day(27), volume: 1000 },
        { startedAt: day(26), volume: 500 },
        { startedAt: day(20), volume: 2000 },
        // Too old for three weeks.
        { startedAt: day(1), volume: 9000 },
      ],
      3,
      now,
    );
    expect(weeks).toEqual([
      { start: new Date(2026, 9, 12), volume: 0, sessions: 0 },
      { start: new Date(2026, 9, 19), volume: 2000, sessions: 1 },
      { start: new Date(2026, 9, 26), volume: 1500, sessions: 2 },
    ]);
  });
});

describe('weekStreak', () => {
  it('counts consecutive trained weeks up to the current one', () => {
    expect(weekStreak([day(27), day(20), day(13), day(1)], now)).toBe(3);
  });

  it('keeps the streak while the current week is not trained yet', () => {
    expect(weekStreak([day(20), day(13)], now)).toBe(2);
  });

  it('is broken by a missed week', () => {
    expect(weekStreak([day(13)], now)).toBe(0);
    expect(weekStreak([], now)).toBe(0);
  });
});

describe('trainingCalendar', () => {
  it('lays out whole weeks with the sessions of each day', () => {
    const weeks = trainingCalendar(
      [
        { id: 2, startedAt: day(27, 9, 19) },
        { id: 1, startedAt: day(27, 9, 8) },
        { id: 3, startedAt: day(19) },
      ],
      2,
      now,
    );
    expect(weeks).toHaveLength(2);
    expect(weeks[0][0].date).toEqual(new Date(2026, 9, 19));
    expect(weeks[0][0].sessionIds).toEqual([3]);
    expect(weeks[1][1].sessionIds).toEqual([1, 2]);
    expect(weeks[1][1].future).toBe(false);
    expect(weeks[1][2].future).toBe(true);
  });
});

describe('setsPerMuscle', () => {
  it('counts primary muscles fully and secondary ones by half', () => {
    expect(
      setsPerMuscle([
        { primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulders'], sets: 4 },
        { primaryMuscles: ['triceps'], secondaryMuscles: [], sets: 3 },
      ]),
    ).toEqual([
      { muscle: 'triceps', sets: 5 },
      { muscle: 'chest', sets: 4 },
      { muscle: 'shoulders', sets: 2 },
    ]);
  });

  it('counts a muscle listed as both primary and secondary once', () => {
    expect(
      setsPerMuscle([{ primaryMuscles: ['glutes'], secondaryMuscles: ['glutes'], sets: 2 }]),
    ).toEqual([{ muscle: 'glutes', sets: 2 }]);
  });
});

describe('progressSeries', () => {
  const set = (sessionId: number, date: number, overrides: Partial<RecordSet>) => ({
    sessionId,
    at: day(date),
    type: 'normal' as const,
    weight: 80,
    reps: 5,
    durationSeconds: null,
    ...overrides,
  });

  it('keeps the best value of each session', () => {
    expect(
      progressSeries(
        [
          set(1, 10, { weight: 80 }),
          set(1, 10, { weight: 85 }),
          set(1, 10, { type: 'warmup', weight: 100 }),
          set(2, 17, { weight: 90 }),
        ],
        'weight_reps',
        'weight',
      ),
    ).toEqual([
      { sessionId: 1, at: day(10), value: 85 },
      { sessionId: 2, at: day(17), value: 90 },
    ]);
  });

  it('skips sessions without a value for the kind', () => {
    expect(
      progressSeries(
        [set(1, 10, { reps: null }), set(2, 17, { reps: 12 })],
        'bodyweight_reps',
        'reps',
      ),
    ).toEqual([{ sessionId: 2, at: day(17), value: 12 }]);
  });
});

describe('currentWeek', () => {
  it('lists Monday to Sunday with trained days and today', () => {
    const week = currentWeek([day(26), day(26, 9, 8), day(20)], now);
    expect(week.map((item) => item.date.getDate())).toEqual([26, 27, 28, 29, 30, 31, 1]);
    expect(week.map((item) => item.trained)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(week.findIndex((item) => item.today)).toBe(1);
  });
});

describe('monthWeeks', () => {
  it('lays a month out in Monday-first weeks', () => {
    // November 2026 starts on a Sunday and ends on a Monday.
    const weeks = monthWeeks(new Date(2026, 10, 18));
    expect(weeks).toHaveLength(6);
    expect(weeks[0].slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(weeks[0][6]).toEqual(new Date(2026, 10, 1));
    expect(weeks[5][0]).toEqual(new Date(2026, 10, 30));
    expect(weeks[5].slice(1)).toEqual([null, null, null, null, null, null]);
  });
});
