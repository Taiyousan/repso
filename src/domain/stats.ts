import type { TrackingType } from '@/db/schema';

import { type RecordKind, type RecordSet, setRecordValues } from './records';

// ---------------------------------------------------------------------------
// Calendar weeks (Monday to Sunday, local time)
// ---------------------------------------------------------------------------

/** Same day `days` later, at midnight; the Date constructor absorbs DST changes. */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Monday of the date's week, at midnight. */
export function startOfWeek(date: Date): Date {
  const mondayOffset = (date.getDay() + 6) % 7;
  return addDays(date, -mondayOffset);
}

/** Midnight starting a period of `days` days ending today, e.g. the last 7 days. */
export function periodStart(days: number, now = new Date()): Date {
  return addDays(now, 1 - days);
}

// ---------------------------------------------------------------------------
// Weekly totals
// ---------------------------------------------------------------------------

export type WeekTotal = { start: Date; volume: number; sessions: number };

/** Volume and session count of the last `weekCount` weeks, oldest first, current week last. */
export function weeklyTotals(
  sessions: { startedAt: Date; volume: number }[],
  weekCount: number,
  now = new Date(),
): WeekTotal[] {
  const current = startOfWeek(now);
  const weeks = Array.from({ length: weekCount }, (_, index) => ({
    start: addDays(current, (index - weekCount + 1) * 7),
    volume: 0,
    sessions: 0,
  }));
  const byStart = new Map(weeks.map((week) => [week.start.getTime(), week]));

  for (const session of sessions) {
    const week = byStart.get(startOfWeek(session.startedAt).getTime());
    if (!week) continue;
    week.volume += session.volume;
    week.sessions += 1;
  }
  return weeks;
}

/**
 * Consecutive weeks with at least one session, up to now. The current week only counts once
 * trained: until then, the streak of the previous weeks still holds.
 */
export function weekStreak(dates: Date[], now = new Date()): number {
  const trained = new Set(dates.map((date) => startOfWeek(date).getTime()));
  let week = startOfWeek(now);
  if (!trained.has(week.getTime())) week = addDays(week, -7);

  let streak = 0;
  while (trained.has(week.getTime())) {
    streak += 1;
    week = addDays(week, -7);
  }
  return streak;
}

export type WeekDay = { date: Date; trained: boolean; today: boolean };

/** The current week, Monday to Sunday, with the days that had a session. */
export function currentWeek(dates: Date[], now = new Date()): WeekDay[] {
  // addDays(date, 0) drops the time, so dates compare by calendar day.
  const trained = new Set(dates.map((date) => addDays(date, 0).getTime()));
  const today = addDays(now, 0).getTime();
  const monday = startOfWeek(now);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday, index);
    return { date, trained: trained.has(date.getTime()), today: date.getTime() === today };
  });
}

// ---------------------------------------------------------------------------
// Training calendar
// ---------------------------------------------------------------------------

export type CalendarDay = {
  date: Date;
  /** Sessions started that day, oldest first. */
  sessionIds: number[];
  /** After today: drawn empty. */
  future: boolean;
};

/** The last `weekCount` weeks, oldest first, each from Monday to Sunday. */
export function trainingCalendar(
  sessions: { id: number; startedAt: Date }[],
  weekCount: number,
  now = new Date(),
): CalendarDay[][] {
  const today = addDays(now, 0).getTime();
  const first = addDays(startOfWeek(now), (1 - weekCount) * 7);
  const weeks = Array.from({ length: weekCount }, (_, week) =>
    Array.from({ length: 7 }, (_, day): CalendarDay => {
      const date = addDays(first, week * 7 + day);
      return { date, sessionIds: [], future: date.getTime() > today };
    }),
  );
  const byDay = new Map(weeks.flat().map((day) => [day.date.getTime(), day]));

  const ordered = [...sessions].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  for (const session of ordered) {
    byDay.get(addDays(session.startedAt, 0).getTime())?.sessionIds.push(session.id);
  }
  return weeks;
}

// ---------------------------------------------------------------------------
// Sets per muscle
// ---------------------------------------------------------------------------

/** Share of a set credited to a secondary muscle (fractional set counting). */
export const SECONDARY_MUSCLE_SHARE = 0.5;

export type MuscleSets = { muscle: string; sets: number };

/**
 * Working sets per muscle: a set counts fully for the exercise's primary muscles and half for its
 * secondary ones, the usual way to estimate training volume per muscle. Most trained first.
 */
export function setsPerMuscle(
  rows: { primaryMuscles: string[]; secondaryMuscles: string[]; sets: number }[],
): MuscleSets[] {
  const totals = new Map<string, number>();
  const add = (muscle: string, sets: number) =>
    totals.set(muscle, (totals.get(muscle) ?? 0) + sets);

  for (const { primaryMuscles, secondaryMuscles, sets } of rows) {
    for (const muscle of primaryMuscles) add(muscle, sets);
    for (const muscle of secondaryMuscles) {
      if (!primaryMuscles.includes(muscle)) add(muscle, sets * SECONDARY_MUSCLE_SHARE);
    }
  }
  return [...totals]
    .map(([muscle, sets]) => ({ muscle, sets }))
    .filter((entry) => entry.sets > 0)
    .sort((a, b) => b.sets - a.sets);
}

// ---------------------------------------------------------------------------
// Progress of an exercise
// ---------------------------------------------------------------------------

export type ProgressPoint = { sessionId: number; at: Date; value: number };

/** Best value of a record kind in each session, in the order given (oldest first). */
export function progressSeries(
  sets: (RecordSet & { sessionId: number; at: Date })[],
  trackingType: TrackingType,
  kind: RecordKind,
): ProgressPoint[] {
  const points: ProgressPoint[] = [];
  const bySession = new Map<number, ProgressPoint>();

  for (const set of sets) {
    const value = setRecordValues(set, trackingType)[kind];
    if (value == null || value <= 0) continue;
    const point = bySession.get(set.sessionId);
    if (point) {
      point.value = Math.max(point.value, value);
    } else {
      const created = { sessionId: set.sessionId, at: set.at, value };
      bySession.set(set.sessionId, created);
      points.push(created);
    }
  }
  return points;
}
