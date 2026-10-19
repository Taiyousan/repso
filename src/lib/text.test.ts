import { normalizeText, slugify } from './text';

describe('normalizeText', () => {
  it('lowercases and strips accents', () => {
    expect(normalizeText('  Développé Couché ')).toBe('developpe couche');
  });
});

describe('slugify', () => {
  it('produces a kebab-case ascii slug', () => {
    expect(slugify('Développé couché (prise serrée)')).toBe('developpe-couche-prise-serree');
  });

  it('returns an empty string when nothing is left', () => {
    expect(slugify(' !? ')).toBe('');
  });
});
