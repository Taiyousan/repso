import type { APIRoute } from 'astro';

import programSchema from '../../../schemas/program.v1.json';
import { TRACKING_TYPE_DETAILS } from '../../../src/features/exercises/labels';
import { IMAGE_BASE_URL } from '../../../src/features/exercises/library-images';
import { APK_URL } from '../config';
import { library } from '../library';

/** For AI agents (https://llmstxt.org): what the site publishes and how to read it. */
export const GET: APIRoute = ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const trackingTypes = Object.entries(TRACKING_TYPE_DETAILS)
    .map(([type, { label, set }]) => `    - \`${type}\` : ${label} (série affichée « ${set} »)`)
    .join('\n');

  return new Response(`# Repso

> Carnet de musculation pour Android, sans compte ni serveur. Ce site publie le catalogue de ses
> ${library.length} exercices, en français, sous une forme lisible par une machine.

## Catalogue d'exercices

- [Catalogue complet (JSON)](${url('/library/latest.json')}) : un tableau d'exercices. Champs :
  - \`slug\` : identifiant stable de l'exercice, en kebab-case
  - \`name\` : nom français ; \`nameEn\` : nom anglais d'origine (free-exercise-db), ou null
  - \`primaryMuscles\`, \`secondaryMuscles\` : muscles, en anglais (\`chest\`, \`lats\`, \`middle back\`…)
  - \`equipment\`, \`category\`, \`force\`, \`level\`, \`mechanic\` : valeurs anglaises de free-exercise-db, ou null
  - \`instructions\` : étapes d'exécution, dans la langue \`instructionsLanguage\` (\`fr\` ou \`en\`)
  - \`images\` : positions de départ et d'arrivée ; un chemin relatif se lit depuis ${IMAGE_BASE_URL}, une URL complète telle quelle
  - \`isEssential\` : exercice courant, mis en avant dans l'app
  - \`trackingType\` : façon de noter une série
${trackingTypes}
- [Pages des exercices](${url('/exercices/')}) : une page par exercice, à l'adresse \`/exercices/<slug>/\`.

## Programmes

- [Format des programmes (JSON Schema)](${programSchema.$id}) : un fichier qui respecte ce schéma
  s'importe dans l'app (onglet Programmes → Importer). Chaque exercice y est désigné par son \`slug\`
  du catalogue ; un nom inconnu crée un exercice personnalisé.

## Optional

- [Télécharger l'app (APK Android)](${APK_URL})
- [Politique de confidentialité](${url('/privacy/')})
`);
};
