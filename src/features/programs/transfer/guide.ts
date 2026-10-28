import schema from '../../../../schemas/program.v1.json';
import { PROGRAM_FILE_FORMAT, PROGRAM_FILE_VERSION, type ProgramFile } from './format';

export const GUIDE_FILE_NAME = `workout-planner-format-v${PROGRAM_FILE_VERSION}.md`;

const EXAMPLE: Omit<ProgramFile, '$schema'> = {
  format: PROGRAM_FILE_FORMAT,
  version: PROGRAM_FILE_VERSION,
  program: {
    name: 'Push Pull Legs',
    description: '3 séances par semaine, hypertrophie.',
    workouts: [
      {
        name: 'Push',
        exercises: [
          {
            slug: 'barbell-bench-press-medium-grip',
            name: 'Développé couché à la barre',
            restSeconds: 150,
            target: '4 × 6-8',
          },
          {
            name: 'Cable Y Raise',
            primaryMuscles: ['shoulders'],
            secondaryMuscles: ['traps'],
            equipment: 'cable',
            restSeconds: 60,
            target: '3 × 12-15',
          },
        ],
      },
    ],
  },
};

const json = (value: unknown) => '```json\n' + JSON.stringify(value, null, 2) + '\n```';

/**
 * Markdown description of the program file, meant to be handed to an AI (or anyone) to convert
 * or write a program. Lists the exercises the user is likely to know (essentials and their own)
 * with their slugs, so most of them match exactly on import.
 */
export function buildFormatGuide(
  exercises: { slug: string; name: string; nameEn: string | null }[],
): string {
  const list = exercises
    .map(({ slug, name, nameEn }) => `- ${slug} — ${name}${nameEn ? ` (${nameEn})` : ''}`)
    .join('\n');

  return `# Format de programme Workout Planner (v${PROGRAM_FILE_VERSION})

Ce document décrit le fichier JSON qu'importe l'application Workout Planner : un programme d'entraînement, ses séances et leurs exercices dans l'ordre. Donne-le à une IA avec un programme existant (texte, tableau, capture…) ou une demande, et demande-lui un fichier à ce format.

## Consignes

- Produis un seul objet JSON valide selon le schéma ci-dessous, sans commentaire, à enregistrer dans un fichier \`.json\`.
- Un programme contient des séances ("workouts") ; chaque séance liste ses exercices dans l'ordre où ils sont faits.
- Pour chaque exercice, utilise de préférence un exercice de la liste en fin de document : recopie son "slug" et son nom dans "name".
- Sinon, n'invente pas de slug : donne le nom anglais usuel de l'exercice dans "name" et ses "primaryMuscles" (plus éventuellement "secondaryMuscles", "equipment" et "trackingType"). L'application le créera.
- "restSeconds" : repos entre les séries, en secondes. "target" : consigne courte comme "4 × 8-10", "3 × 45 s" ou "5 × 5 @ RPE 8". Pas de charges en kg.
- Pour convertir un programme existant, garde ses noms de séances et son ordre d'exercices. Pour en créer un, nomme-le en français et, s'il manque des informations importantes (objectif, fréquence, durée, matériel), pose d'abord tes questions.

## Exemple

${json(EXAMPLE)}

## JSON Schema

${json(schema)}

## Exercices de la bibliothèque (slug — nom)

${list}
`;
}
