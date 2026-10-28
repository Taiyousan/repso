import { parseProgramFile } from './format';
import { buildFormatGuide } from './guide';

describe('buildFormatGuide', () => {
  const guide = buildFormatGuide([
    { slug: 'barbell-curl', name: 'Curl à la barre', nameEn: 'Barbell Curl' },
    { slug: 'custom-y-raise-abc', name: 'Y raise', nameEn: null },
  ]);

  it('lists the exercises with their slugs', () => {
    expect(guide).toContain('- barbell-curl — Curl à la barre (Barbell Curl)\n');
    expect(guide).toContain('- custom-y-raise-abc — Y raise\n');
  });

  it('embeds the schema and an example the app accepts', () => {
    expect(guide).toContain('"$id": "https://raw.githubusercontent.com/');
    const example = guide.split('## Exemple')[1].split('## JSON Schema')[0];
    expect(parseProgramFile(example).ok).toBe(true);
  });
});
