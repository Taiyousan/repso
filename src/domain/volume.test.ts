import { estimateOneRepMax, setVolume, totalVolume } from './volume';

describe('setVolume', () => {
  it('multiplies weight by reps', () => {
    expect(setVolume({ type: 'normal', weight: 80, reps: 8 })).toBe(640);
  });

  it('returns 0 for an incomplete set', () => {
    expect(setVolume({ type: 'normal', weight: null, reps: 8 })).toBe(0);
  });
});

describe('totalVolume', () => {
  it('ignores warm-up sets', () => {
    expect(
      totalVolume([
        { type: 'warmup', weight: 40, reps: 10 },
        { type: 'normal', weight: 80, reps: 8 },
        { type: 'failure', weight: 80, reps: 6 },
      ]),
    ).toBe(1120);
  });
});

describe('estimateOneRepMax', () => {
  it('returns the weight itself for a single rep', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
  });

  it('applies the Epley formula', () => {
    expect(estimateOneRepMax(90, 6)).toBeCloseTo(108);
  });

  it('returns 0 for invalid input', () => {
    expect(estimateOneRepMax(0, 5)).toBe(0);
  });
});
