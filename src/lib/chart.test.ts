import { formatCompact, formatNumber, mixColors, niceScale } from './chart';

describe('niceScale', () => {
  it('rounds the range to clean ticks', () => {
    expect(niceScale(0, 4250)).toEqual({ min: 0, max: 5000, ticks: [0, 2500, 5000] });
    expect(niceScale(82, 97)).toEqual({ min: 80, max: 100, ticks: [80, 90, 100] });
  });

  it('keeps counts on whole numbers', () => {
    expect(niceScale(0, 2, 3, 1)).toEqual({ min: 0, max: 2, ticks: [0, 1, 2] });
  });

  it('widens a flat range', () => {
    const scale = niceScale(100, 100);
    expect(scale.min).toBeLessThan(100);
    expect(scale.max).toBeGreaterThan(100);
  });

  it('avoids float drift', () => {
    expect(niceScale(0, 0.3).ticks).toEqual([0, 0.2, 0.4]);
  });
});

describe('formatNumber', () => {
  it('uses a decimal comma and groups thousands', () => {
    expect(formatNumber(12.5)).toBe('12,5');
    expect(formatNumber(12)).toBe('12');
    expect(formatNumber(4250.4)).toBe('4 250,4');
  });
});

describe('formatCompact', () => {
  it('shortens thousands', () => {
    expect(formatCompact(800)).toBe('800');
    expect(formatCompact(2500)).toBe('2,5 k');
    expect(formatCompact(12000)).toBe('12 k');
  });
});

describe('mixColors', () => {
  it('interpolates each channel', () => {
    expect(mixColors('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixColors('#e8472b', '#f6b4a6', 0)).toBe('#e8472b');
    expect(mixColors('#e8472b', '#f6b4a6', 1)).toBe('#f6b4a6');
  });

  it('falls back to the target color when a color is not hex', () => {
    expect(mixColors('red', '#ffffff', 0.5)).toBe('#ffffff');
  });
});
