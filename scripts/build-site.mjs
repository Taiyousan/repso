/**
 * Builds the public web pages of the app into site-dist/: a home page to download the app and the
 * privacy policy, converted from PRIVACY.md so the published policy never drifts from the repository.
 * Both follow the app's look (tokens of src/global.css, Baloo 2 + Nunito served from site/fonts/).
 * Run by Vercel on deploy (vercel.json), or locally with `npm run site:build`.
 */
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'site-dist');

const SITE_URL = 'https://repso-app-android.vercel.app';
/** The latest release APK. */
const APK_URL = 'https://github.com/Taiyousan/repso/releases/latest/download/repso.apk';
const PORTFOLIO_URL = 'https://shamsbenhamou.fr';
const { version } = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;

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

/** The dumbbell of the app icon (src/components/ui/logo.tsx), for the blue band. */
const logo = `<svg class="logo" viewBox="14 14 80 80" aria-hidden="true">
<g transform="rotate(-35 54 54)">
<rect x="38" y="50" width="32" height="8" fill="#fff"/>
<rect x="28" y="36" width="10" height="36" rx="3" fill="#fff"/>
<rect x="70" y="36" width="10" height="36" rx="3" fill="#fff"/>
<rect x="21" y="43" width="7" height="22" rx="3" fill="var(--primary-edge)"/>
<rect x="80" y="43" width="7" height="22" rx="3" fill="var(--primary-edge)"/>
</g>
</svg>`;

const downloadIcon = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>
</svg>`;

const styles = `
  @font-face { font-family: Nunito; font-weight: 400; font-display: swap; src: url(/fonts/Nunito_400Regular.ttf); }
  @font-face { font-family: Nunito; font-weight: 800; font-display: swap; src: url(/fonts/Nunito_800ExtraBold.ttf); }
  @font-face { font-family: Baloo2; font-weight: 800; font-display: swap; src: url(/fonts/Baloo2_800ExtraBold.ttf); }
  :root {
    color-scheme: light;
    --background: #f4f7fb; --surface: #ffffff; --border: #edf0f5; --outline: #e1e6ef;
    --foreground: #1c2434; --muted: #5b6678;
    --primary: #2563eb; --primary-edge: #1a47ad; --primary-soft: #dbe7ff;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--background); color: var(--foreground);
    font: 400 16px/1.6 Nunito, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  a { color: var(--primary); font-weight: 800; }
  a:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; border-radius: 4px; }
  strong { font-weight: 800; }
  .wrap { max-width: 640px; margin: 0 auto; padding: 0 16px; }
  .band { background: var(--primary); color: #fff; border-radius: 0 0 28px 28px; padding: 18px 0 40px; }
  .band a { color: inherit; }
  .brand { display: inline-flex; align-items: center; gap: 6px; text-decoration: none;
    font: 800 26px/1 Baloo2, sans-serif; }
  .logo { width: 34px; height: 34px; }
  h1, h2 { font-family: Baloo2, sans-serif; font-weight: 800; letter-spacing: -0.01em; }
  .band h1 { font-size: clamp(36px, 9vw, 54px); line-height: 1.02; margin: 44px 0 14px; }
  .lead { color: var(--primary-soft); font-size: 18px; margin: 0 0 28px; max-width: 32em; }
  .band .download { display: inline-flex; align-items: center; gap: 10px; padding: 14px 24px;
    background: #fff; color: var(--primary); border-radius: 14px; text-decoration: none;
    font-size: 17px; box-shadow: 0 4px 0 var(--primary-edge); }
  .band .download:active { transform: translateY(4px); box-shadow: none; }
  .download svg { width: 22px; height: 22px; }
  .band .meta { color: var(--primary-soft); font-size: 14px; margin: 16px 0 0; }
  h2 { font-size: 22px; line-height: 1.2; margin: 40px 0 12px; }
  .card { background: var(--surface); border: 1px solid var(--outline); border-radius: 14px;
    margin: 0; padding: 0; list-style: none; }
  .card > li { padding: 14px 16px; }
  .card > li + li { border-top: 1px solid var(--border); }
  .card p { margin: 2px 0 0; color: var(--muted); }
  .steps { counter-reset: step; }
  .steps > li { display: flex; gap: 12px; counter-increment: step; }
  .steps > li::before { content: counter(step); flex: none; width: 28px; height: 28px;
    border-radius: 50%; background: var(--primary-soft); color: var(--primary);
    font-weight: 800; font-size: 14px; display: grid; place-items: center; }
  .steps p { margin: 0; color: var(--foreground); }
  .note { color: var(--muted); font-size: 14px; margin: 12px 4px 0; }
  footer.wrap { color: var(--muted); font-size: 14px; padding-top: 40px; padding-bottom: 48px; }
  footer a { color: inherit; margin-right: 16px; }
  .band.small { padding-bottom: 18px; }
  .prose h1 { font-size: 32px; line-height: 1.1; margin: 36px 0 8px; }
  .prose h2 { font-size: 20px; margin: 32px 0 8px; }
`;

const page = ({ title, description, band, main }) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<meta name="theme-color" content="#2563eb">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:image" content="${SITE_URL}/feature-graphic.png">
<link rel="icon" href="/favicon.png">
<link rel="apple-touch-icon" href="/icon-512.png">
<link rel="preload" href="/fonts/Baloo2_800ExtraBold.ttf" as="font" type="font/ttf" crossorigin>
<style>${styles}</style>
</head>
<body>
${band}
<main class="wrap">
${main}
</main>
<footer class="wrap">
<a href="/privacy/">Confidentialité</a><a href="${PORTFOLIO_URL}">Portfolio</a>
</footer>
</body>
</html>
`;

const brand = `<a class="brand" href="/">${logo}Repso</a>`;

const features = [
  [
    'Programmes et séances',
    'Créez les vôtres ou partez d’un programme suggéré. Pour chaque exercice : ordre, repos et objectif.',
  ],
  [
    'En salle',
    'Vos séries de la dernière fois sont déjà là. Minuteur de repos avec notification, même écran éteint.',
  ],
  [
    'Progrès',
    'Records personnels, récapitulatif après chaque entraînement, calendrier, volume et séries par muscle.',
  ],
  [
    'Plus de 870 exercices',
    'En français, avec illustrations et consignes d’exécution. Vous pouvez aussi créer les vôtres.',
  ],
  [
    'Vos données restent chez vous',
    'Aucun compte, aucun serveur, aucune publicité, aucun traqueur. Sauvegarde dans un fichier quand vous voulez.',
  ],
];

const steps = [
  'Depuis votre téléphone Android, téléchargez le fichier <strong>repso.apk</strong>.',
  'Ouvrez-le. Android vous demande d’autoriser votre navigateur à installer des applications : acceptez.',
  'Installez, c’est prêt. Pour mettre à jour, installez la nouvelle version par-dessus : vos données sont conservées.',
];

const description =
  'Carnet d’entraînement de musculation pour Android : programmes, séances, records et statistiques. Sans compte et sans publicité.';

const write = (path, html) => {
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), html);
};

cpSync(join(root, 'site'), out, { recursive: true });
cpSync(join(root, 'assets/images/favicon.png'), join(out, 'favicon.png'));
cpSync(join(root, 'store/graphics/icon-512.png'), join(out, 'icon-512.png'));
cpSync(join(root, 'store/graphics/feature-graphic.png'), join(out, 'feature-graphic.png'));

write(
  'index.html',
  page({
    title: 'Repso — carnet de musculation',
    description,
    band: `<header class="band">
<div class="wrap">
${brand}
<h1>Votre carnet de musculation</h1>
<p class="lead">Programmes, séances, records et statistiques. Sans compte, sans publicité : tout reste
sur votre téléphone.</p>
<a class="download" href="${APK_URL}">${downloadIcon}Télécharger pour Android</a>
<p class="meta">Gratuit · version ${escape(version)} · bientôt sur le Play Store</p>
</div>
</header>`,
    main: `<h2>Ce que fait Repso</h2>
<ul class="card">
${features.map(([name, text]) => `<li><strong>${name}</strong><p>${text}</p></li>`).join('\n')}
</ul>
<h2>Installer</h2>
<ol class="card steps">
${steps.map((step) => `<li><p>${step}</p></li>`).join('\n')}
</ol>
<p class="note">L’application n’est pas encore sur le Play Store, d’où ce fichier à installer
vous-même.</p>`,
  }),
);
write(
  'privacy/index.html',
  page({
    title: 'Politique de confidentialité — Repso',
    description: 'Repso ne collecte aucune donnée personnelle : tout reste sur votre téléphone.',
    band: `<header class="band small"><div class="wrap">${brand}</div></header>`,
    main: `<article class="prose">
${markdownToHtml(readFileSync(join(root, 'PRIVACY.md'), 'utf8'))}
</article>`,
  }),
);
console.log(`Site written to ${out}`);
