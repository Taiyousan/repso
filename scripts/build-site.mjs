/**
 * Builds the public web pages of the app into site-dist/: a home page and the privacy policy,
 * converted from PRIVACY.md so the published policy never drifts from the repository.
 * Run by Vercel on deploy (vercel.json), or locally with `npm run site:build`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'site-dist');

const escape = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** Bold and links, the only inline markup PRIVACY.md uses. */
const inline = (text) =>
  escape(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

/** Headings, paragraphs and bullet lists; a line indented under a bullet continues it. */
function markdownToHtml(markdown) {
  const html = [];
  let paragraph = [];
  let list = null;
  const flush = () => {
    if (paragraph.length > 0) html.push(`<p>${inline(paragraph.join(' '))}</p>`);
    if (list) html.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`);
    paragraph = [];
    list = null;
  };

  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^(#{1,3}) (.*)$/.exec(line);
    if (heading) {
      flush();
      html.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
    } else if (line.startsWith('- ')) {
      if (paragraph.length > 0) flush();
      list ??= [];
      list.push(line.slice(2));
    } else if (list && line.startsWith('  ') && line.trim()) {
      list[list.length - 1] += ` ${line.trim()}`;
    } else if (line.trim() === '') {
      flush();
    } else {
      if (list) flush();
      paragraph.push(line.trim());
    }
  }
  flush();
  return html.join('\n');
}

const page = (title, body) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<style>
  :root { color-scheme: light; --ink: #1a2233; --muted: #5b6577; --accent: #2563eb; }
  body { margin: 0; background: #f7f8fb; color: var(--ink); font: 16px/1.6 system-ui, sans-serif; }
  main { max-width: 680px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font-size: 1.8rem; line-height: 1.2; margin: 0 0 8px; }
  h2 { font-size: 1.15rem; margin: 32px 0 8px; }
  p, li { color: var(--ink); }
  a { color: var(--accent); }
  .muted { color: var(--muted); }
</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;

const write = (path, html) => {
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), html);
};

write(
  'privacy/index.html',
  page(
    'Politique de confidentialité — Repso',
    markdownToHtml(readFileSync(join(root, 'PRIVACY.md'), 'utf8')),
  ),
);
write(
  'index.html',
  page(
    'Repso',
    `<h1>Repso</h1>
<p>Carnet d’entraînement de musculation pour Android : programmes, séances, records et
statistiques, sans compte et sans publicité. Tout reste sur ton téléphone.</p>
<p><a href="/privacy/">Politique de confidentialité</a></p>
<p class="muted">Contact : <a href="mailto:taiyoudev@gmail.com">taiyoudev@gmail.com</a></p>`,
  ),
);
console.log(`Site written to ${out}`);
