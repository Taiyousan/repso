import { parseProgramFile } from './format';
import { buildFormatGuide } from './guide';

describe('buildFormatGuide', () => {
  const guide = buildFormatGuide(
    ['Barbell Curl'],
    [{ slug: 'custom-y-raise-abc', name: 'Y raise' }],
  );

  it('lists the common exercises', () => {
    expect(guide).toContain('- Barbell Curl\n');
  });

  it('lists the custom exercises with their slugs', () => {
    expect(guide).toContain('- `custom-y-raise-abc` : Y raise');
  });

  it('omits the custom exercises section when there are none', () => {
    expect(buildFormatGuide([], [])).not.toContain('## Exercices perso');
  });

  it('embeds the schema and an example the app accepts', () => {
    expect(guide).toContain('"$id": "https://raw.githubusercontent.com/');
    const example = guide.split('## Exemple')[1].split('## JSON Schema')[0];
    expect(parseProgramFile(example).ok).toBe(true);
  });
});
