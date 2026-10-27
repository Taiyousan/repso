import {
  formatDay,
  formatDurationLong,
  formatMonth,
  formatShortDay,
  formatTime,
  monthKey,
} from './dates';

describe('formatDay', () => {
  const now = new Date(2026, 9, 20);

  it('omits the current year', () => {
    expect(formatDay(new Date(2026, 9, 12), now)).toBe('lun. 12 oct.');
  });

  it('shows other years', () => {
    expect(formatDay(new Date(2025, 11, 31), now)).toBe('mer. 31 déc. 2025');
  });
});

describe('formatTime', () => {
  it('pads minutes', () => {
    expect(formatTime(new Date(2026, 9, 12, 8, 5))).toBe('8:05');
  });
});

describe('formatMonth', () => {
  it('capitalizes the month', () => {
    expect(formatMonth(new Date(2026, 7, 1))).toBe('Août 2026');
  });
});

describe('monthKey', () => {
  it('groups days of the same month', () => {
    expect(monthKey(new Date(2026, 9, 1))).toBe(monthKey(new Date(2026, 9, 31)));
    expect(monthKey(new Date(2026, 9, 1))).not.toBe(monthKey(new Date(2025, 9, 1)));
  });
});

describe('formatDurationLong', () => {
  it('formats minutes and hours', () => {
    expect(formatDurationLong(52 * 60_000)).toBe('52 min');
    expect(formatDurationLong(75 * 60_000)).toBe('1 h 15');
    expect(formatDurationLong(122 * 60_000)).toBe('2 h 02');
  });
});

describe('formatShortDay', () => {
  const now = new Date(2026, 9, 20);

  it('drops the weekday, and the year when current', () => {
    expect(formatShortDay(new Date(2026, 9, 12), now)).toBe('12 oct.');
    expect(formatShortDay(new Date(2025, 11, 31), now)).toBe('31 déc. 2025');
  });
});
