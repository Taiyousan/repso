import {
  formatDecimal,
  formatDuration,
  mainMuscles,
  nextSetType,
  parseDecimal,
  parseInteger,
  setBadges,
} from './sets';

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
