import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const listing = readFileSync(join(__dirname, 'play-store.md'), 'utf8');

/** Text between `<!-- name -->` and `<!-- /name -->`. */
function field(name: string): string {
  const start = listing.indexOf(`<!-- ${name} -->`);
  const end = listing.indexOf(`<!-- /${name} -->`);
  if (start === -1 || end === -1) throw new Error(`No ${name} in play-store.md`);
  return listing.slice(start + `<!-- ${name} -->`.length, end).trim();
}

describe('Play Store listing', () => {
  it('fits the console limits', () => {
    expect(field('title').length).toBeLessThanOrEqual(30);
    expect(field('short').length).toBeLessThanOrEqual(80);
    expect(field('full').length).toBeLessThanOrEqual(4000);
  });
});
