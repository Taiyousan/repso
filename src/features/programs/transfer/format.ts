import { TRACKING_TYPES, type TrackingType } from '@/db/schema';
import { EQUIPMENT, MUSCLES } from '@/features/exercises/labels';

/**
 * Program file shared between apps and written by AIs. Described by schemas/program.v1.json:
 * bump PROGRAM_FILE_VERSION and add a new schema file for any breaking change.
 */
export const PROGRAM_FILE_FORMAT = 'repso.program';
export const PROGRAM_FILE_VERSION = 1;
export const PROGRAM_SCHEMA_URL =
  'https://raw.githubusercontent.com/Taiyousan/repso/main/schemas/program.v1.json';

export const MAX_REST_SECONDS = 3600;

export type ProgramFileExercise = {
  /** Library slug; matching falls back to `name` (French or English) when unknown. */
  slug?: string;
  name?: string;
  restSeconds?: number;
  target?: string;
  /** Used only to create the exercise when it is missing from the library. */
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  equipment?: string;
  trackingType?: TrackingType;
};

export type ProgramFileWorkout = { name: string; exercises: ProgramFileExercise[] };

export type ProgramFileProgram = {
  name: string;
  description?: string;
  workouts: ProgramFileWorkout[];
};

export type ProgramFile = {
  $schema: string;
  format: typeof PROGRAM_FILE_FORMAT;
  version: typeof PROGRAM_FILE_VERSION;
  exportedAt?: string;
  program: ProgramFileProgram;
};

export type ParseResult = { ok: true; program: ProgramFileProgram } | { ok: false; error: string };

/**
 * Pasted text is often an AI answer: the JSON may be wrapped in a code fence or sentences,
 * so everything from the first "{" to the last "}" is parsed.
 */
function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end < start) throw new Error('no object');
  return JSON.parse(text.slice(start, end + 1));
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const cleanString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

/** Unknown muscle ids are dropped rather than rejected: they only feed custom exercises. */
function cleanMuscles(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const known = new Set<string>(MUSCLES);
  const muscles = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => known.has(item));
  return muscles.length > 0 ? [...new Set(muscles)] : undefined;
}

function parseExercise(value: unknown, where: string): ProgramFileExercise | string {
  if (!isRecord(value)) return `${where} : un exercice doit être un objet.`;

  const slug = cleanString(value.slug);
  const name = cleanString(value.name);
  if (!slug && !name) return `${where} : il faut un « slug » ou un « name ».`;

  const exercise: ProgramFileExercise = {};
  if (slug) exercise.slug = slug;
  if (name) exercise.name = name;

  if (typeof value.restSeconds === 'number' && Number.isFinite(value.restSeconds)) {
    exercise.restSeconds = Math.min(MAX_REST_SECONDS, Math.max(0, Math.round(value.restSeconds)));
  }
  const target = cleanString(value.target);
  if (target) exercise.target = target;

  const primaryMuscles = cleanMuscles(value.primaryMuscles);
  if (primaryMuscles) exercise.primaryMuscles = primaryMuscles;
  const secondaryMuscles = cleanMuscles(value.secondaryMuscles);
  if (secondaryMuscles) exercise.secondaryMuscles = secondaryMuscles;
  const equipment = cleanString(value.equipment)?.toLowerCase();
  if (equipment && (EQUIPMENT as readonly string[]).includes(equipment)) {
    exercise.equipment = equipment;
  }
  if ((TRACKING_TYPES as readonly unknown[]).includes(value.trackingType)) {
    exercise.trackingType = value.trackingType as TrackingType;
  }
  return exercise;
}

/**
 * Validates a pasted program file. Strict on structure (with French messages the user can
 * relay to the AI), lenient on details: unknown fields and invalid optional values are dropped,
 * and a bare program object (without the envelope) is accepted.
 */
export function parseProgramFile(text: string): ParseResult {
  let root: unknown;
  try {
    root = extractJson(text);
  } catch {
    return { ok: false, error: 'Le texte ne contient pas de JSON valide.' };
  }
  if (!isRecord(root)) return { ok: false, error: 'Le JSON doit être un objet.' };

  if (root.format !== undefined && root.format !== PROGRAM_FILE_FORMAT) {
    return { ok: false, error: `« format » doit valoir "${PROGRAM_FILE_FORMAT}".` };
  }
  if (typeof root.version === 'number' && root.version > PROGRAM_FILE_VERSION) {
    return {
      ok: false,
      error: `Ce fichier utilise la version ${root.version} du format : mets l’application à jour.`,
    };
  }

  const program = isRecord(root.program) ? root.program : root;
  const name = cleanString(program.name);
  if (!name) return { ok: false, error: 'Le programme doit avoir un « name ».' };
  if (!Array.isArray(program.workouts) || program.workouts.length === 0) {
    return { ok: false, error: 'Le programme doit contenir une liste « workouts » non vide.' };
  }

  const workouts: ProgramFileWorkout[] = [];
  for (const [workoutIndex, workout] of program.workouts.entries()) {
    const where = `Séance ${workoutIndex + 1}`;
    if (!isRecord(workout)) return { ok: false, error: `${where} : doit être un objet.` };
    const workoutName = cleanString(workout.name);
    if (!workoutName) return { ok: false, error: `${where} : il manque le « name ».` };
    if (!Array.isArray(workout.exercises)) {
      return { ok: false, error: `${where} (${workoutName}) : il manque la liste « exercises ».` };
    }

    const exercises: ProgramFileExercise[] = [];
    for (const [exerciseIndex, item] of workout.exercises.entries()) {
      const parsed = parseExercise(item, `${workoutName}, exercice ${exerciseIndex + 1}`);
      if (typeof parsed === 'string') return { ok: false, error: parsed };
      exercises.push(parsed);
    }
    workouts.push({ name: workoutName, exercises });
  }

  const description = cleanString(program.description);
  return { ok: true, program: { name, ...(description ? { description } : {}), workouts } };
}

export function serializeProgramFile(program: ProgramFileProgram, exportedAt: Date): string {
  const file: ProgramFile = {
    $schema: PROGRAM_SCHEMA_URL,
    format: PROGRAM_FILE_FORMAT,
    version: PROGRAM_FILE_VERSION,
    exportedAt: exportedAt.toISOString(),
    program,
  };
  return JSON.stringify(file, null, 2);
}
