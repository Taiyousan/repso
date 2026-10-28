import { or } from 'drizzle-orm';
import { router } from 'expo-router';
import { Alert } from 'react-native';

import { db } from '@/db/client';
import { exercises } from '@/db/schema';
import { normalizeText, slugify } from '@/lib/text';

import { exportProgram } from './export';
import { pickTextFile, shareTextFile } from './files';
import { parseProgramFile } from './format';
import { buildFormatGuide, GUIDE_FILE_NAME } from './guide';
import { createExerciseMatcher } from './matching';
import { listImportRefs } from './plan';
import { useImportStore } from './store';

const showError = (error: unknown) =>
  Alert.alert('Échec', error instanceof Error ? error.message : String(error));

/** Shares the program file. Resolves to true once the share sheet was shown. */
export async function exportProgramToFile(programId: number): Promise<boolean> {
  const file = exportProgram(programId);
  if (!file) return false;
  try {
    await shareTextFile(
      `${slugify(file.name) || 'programme'}.json`,
      'application/json',
      file.json,
      `Exporter « ${file.name} »`,
    );
    return true;
  } catch (error) {
    showError(error);
    return false;
  }
}

/** Shares the format description, with the essentials and custom exercises to choose from. */
export async function exportFormatGuide(): Promise<void> {
  const known = db
    .select({ slug: exercises.slug, name: exercises.name, nameEn: exercises.nameEn })
    .from(exercises)
    .where(or(exercises.isEssential, exercises.isCustom))
    .all()
    .map((exercise) => ({ exercise, key: normalizeText(exercise.name) }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    .map(({ exercise }) => exercise);
  try {
    await shareTextFile(
      GUIDE_FILE_NAME,
      // Wider than text/markdown, which some apps don't list themselves for.
      'text/plain',
      buildFormatGuide(known),
      'Exporter le format',
    );
  } catch (error) {
    showError(error);
  }
}

/** Opens a program file, matches its exercises and shows the import preview. */
export async function importProgramFile(): Promise<void> {
  let text: string | null;
  try {
    text = await pickTextFile();
  } catch (error) {
    showError(error);
    return;
  }
  if (text === null) return;

  const result = parseProgramFile(text);
  if (!result.ok) {
    Alert.alert('Fichier invalide', result.error);
    return;
  }
  const catalog = db
    .select({
      id: exercises.id,
      slug: exercises.slug,
      name: exercises.name,
      nameEn: exercises.nameEn,
      isEssential: exercises.isEssential,
    })
    .from(exercises)
    .all();
  useImportStore
    .getState()
    .start(result.program, listImportRefs(result.program, createExerciseMatcher(catalog)));
  router.push('/programs/import');
}
