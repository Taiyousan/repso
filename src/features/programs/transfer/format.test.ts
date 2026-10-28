import { TRACKING_TYPES } from '@/db/schema';
import { EQUIPMENT, MUSCLES } from '@/features/exercises/labels';

import schema from '../../../../schemas/program.v1.json';
import {
  PROGRAM_FILE_VERSION,
  PROGRAM_SCHEMA_URL,
  parseProgramFile,
  serializeProgramFile,
  type ProgramFileProgram,
} from './format';

const program: ProgramFileProgram = {
  name: 'PPL',
  description: 'Trois séances',
  workouts: [
    {
      name: 'Push',
      exercises: [
        { slug: 'barbell-bench-press-medium-grip', name: 'Développé couché', restSeconds: 120 },
        { name: 'Cable Y Raise', target: '3 × 12', primaryMuscles: ['shoulders'] },
      ],
    },
  ],
};

describe('parseProgramFile', () => {
  it('reads back an exported file', () => {
    const json = serializeProgramFile(program, new Date('2026-10-27T10:00:00Z'));
    expect(parseProgramFile(json)).toEqual({ ok: true, program });
  });

  it('finds the JSON inside an AI answer', () => {
    const answer = `Voici ton programme :\n\`\`\`json\n${JSON.stringify({ program })}\n\`\`\`\nBon entraînement !`;
    expect(parseProgramFile(answer)).toEqual({ ok: true, program });
  });

  it('accepts a bare program object', () => {
    expect(parseProgramFile(JSON.stringify(program))).toEqual({ ok: true, program });
  });

  it('drops invalid optional values instead of rejecting the file', () => {
    const result = parseProgramFile(
      JSON.stringify({
        name: ' PPL ',
        workouts: [
          {
            name: 'Push',
            exercises: [
              {
                name: 'Dips',
                restSeconds: 90.4,
                target: '  ',
                primaryMuscles: ['Chest', 'pecs', 'chest'],
                equipment: 'parallel bars',
                trackingType: 'reps',
                extra: true,
              },
              { slug: 'x', restSeconds: 99999 },
            ],
          },
        ],
      }),
    );
    expect(result).toEqual({
      ok: true,
      program: {
        name: 'PPL',
        workouts: [
          {
            name: 'Push',
            exercises: [
              { name: 'Dips', restSeconds: 90, primaryMuscles: ['chest'] },
              { slug: 'x', restSeconds: 3600 },
            ],
          },
        ],
      },
    });
  });

  it.each([
    ['not json', 'Le texte ne contient pas de JSON valide.'],
    ['{"program": {"workouts": []}}', 'Le programme doit avoir un « name ».'],
    [
      '{"name": "A", "workouts": []}',
      'Le programme doit contenir une liste « workouts » non vide.',
    ],
    ['{"name": "A", "workouts": [{"exercises": []}]}', 'Séance 1 : il manque le « name ».'],
    [
      '{"name": "A", "workouts": [{"name": "Push", "exercises": [{"restSeconds": 60}]}]}',
      'Push, exercice 1 : il faut un « slug » ou un « name ».',
    ],
    ['{"format": "other", "program": {}}', '« format » doit valoir "workout-planner.program".'],
    [
      `{"version": ${PROGRAM_FILE_VERSION + 1}, "program": {}}`,
      `Ce fichier utilise la version ${PROGRAM_FILE_VERSION + 1} du format : mets l’application à jour.`,
    ],
  ])('rejects %s', (text, error) => {
    expect(parseProgramFile(text)).toEqual({ ok: false, error });
  });
});

describe('program JSON Schema', () => {
  it('is the one exported files point to', () => {
    expect(schema.$id).toBe(PROGRAM_SCHEMA_URL);
    expect(schema.properties.version.const).toBe(PROGRAM_FILE_VERSION);
  });

  it('lists the values the app knows', () => {
    const { exercise, muscle } = schema.$defs;
    expect(muscle.enum).toEqual([...MUSCLES]);
    expect(exercise.properties.equipment.enum).toEqual([...EQUIPMENT]);
    expect(exercise.properties.trackingType.enum).toEqual([...TRACKING_TYPES]);
  });
});
