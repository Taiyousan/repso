import { PRIMARY_INTENSITY, SECONDARY_INTENSITY, toBodyParts } from './muscle-map';

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
