import { PRIMARY_INTENSITY, SECONDARY_INTENSITY, toBodyHeat, toBodyParts } from './muscle-map';

describe('toBodyParts', () => {
  it('maps primary and secondary muscles to body parts', () => {
    expect(toBodyParts(['chest'], ['triceps'])).toEqual([
      { slug: 'chest', intensity: PRIMARY_INTENSITY },
      { slug: 'triceps', intensity: SECONDARY_INTENSITY },
    ]);
  });

  it('keeps the primary intensity when both map to the same part', () => {
    expect(toBodyParts(['lats'], ['middle back'])).toEqual([
      { slug: 'upper-back', intensity: PRIMARY_INTENSITY },
    ]);
  });

  it('ignores unknown muscles', () => {
    expect(toBodyParts(['unknown'], [])).toEqual([]);
  });
});

describe('toBodyHeat', () => {
  it('scales intensities on the highest value', () => {
    expect(
      toBodyHeat(
        [
          { muscle: 'chest', value: 12 },
          { muscle: 'triceps', value: 6 },
          { muscle: 'biceps', value: 1 },
        ],
        4,
      ),
    ).toEqual([
      { slug: 'chest', intensity: 4 },
      { slug: 'triceps', intensity: 2 },
      { slug: 'biceps', intensity: 1 },
    ]);
  });

  it('keeps the bigger value of muscles sharing a part, and skips zeros', () => {
    expect(
      toBodyHeat(
        [
          { muscle: 'lats', value: 3 },
          { muscle: 'middle back', value: 8 },
          { muscle: 'calves', value: 0 },
        ],
        4,
      ),
    ).toEqual([{ slug: 'upper-back', intensity: 4 }]);
  });
});
