// The project has no Node types: fs comes untyped from Jest, the path from the project root.
const { readFileSync } = jest.requireActual('fs');
const listing: string = readFileSync(`${process.cwd()}/store/play-store.md`, 'utf8');

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
