import { PROGRAM_FILE_FORMAT, PROGRAM_FILE_VERSION, type ProgramFile } from './format';
import schema from '../../../../schemas/program.v1.json';

export const GUIDE_FILE_NAME = `workout-planner-format-v${PROGRAM_FILE_VERSION}.md`;

const LIBRARY_URL = 'https://github.com/yuhonas/free-exercise-db';

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
            slug: 'Barbell_Bench_Press_-_Medium_Grip',
            name: 'Barbell Bench Press - Medium Grip',
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
 * Markdown documentation of the program file, for whoever writes one: a person or an AI.
 * Lists the English names of the common exercises, which the import matches exactly (writers
 * don't know free-exercise-db names by heart), and the user's custom exercises.
 */
export function buildFormatGuide(
  commonNames: string[],
  customExercises: { slug: string; name: string }[],
): string {
  const customList =
    customExercises.length > 0
      ? `

## Exercices perso

Exercices créés dans l'app, utilisables par leur \`slug\` :

${customExercises.map(({ slug, name }) => `- \`${slug}\` : ${name}`).join('\n')}`
      : '';

  return `# Format de programme Workout Planner (v${PROGRAM_FILE_VERSION})

Fichier JSON décrivant un programme d'entraînement, à importer dans Workout Planner (onglet Programmes, « Importer un programme »).

## Structure

- \`format\` : \`"${PROGRAM_FILE_FORMAT}"\`, et \`version\` : \`${PROGRAM_FILE_VERSION}\`.
- \`program\` : \`name\`, \`description\` (facultative) et \`workouts\`, les séances dans l'ordre.
- Chaque séance : \`name\` et \`exercises\`, dans l'ordre d'exécution.

## Exercices

Les exercices viennent de [free-exercise-db](${LIBRARY_URL}). Un exercice est désigné par :

- \`name\` : son nom anglais dans cette bibliothèque, de préférence l'un des exercices courants listés plus bas ;
- ou \`slug\` : son \`id\` dans cette bibliothèque, par exemple \`Barbell_Squat\`.

Un autre nom est rapproché de l'exercice le plus proche, à vérifier à l'import. Un exercice absent de la bibliothèque est créé à l'import : indiquer alors ses \`primaryMuscles\`, et éventuellement \`secondaryMuscles\`, \`equipment\` et \`trackingType\`.

Facultatifs : \`restSeconds\`, le repos entre les séries en secondes, et \`target\`, une consigne libre comme \`"4 × 8-10"\`.

## Exemple

${json(EXAMPLE)}

## JSON Schema

${json(schema)}

## Exercices courants

${commonNames.map((name) => `- ${name}`).join('\n')}${customList}
`;
}
