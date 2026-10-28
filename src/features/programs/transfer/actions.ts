import { eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { Alert } from 'react-native';

import { db } from '@/db/client';
import { exercises } from '@/db/schema';
import { normalizeText, slugify } from '@/lib/text';
import { saveTextFile } from '@/modules/file-saver';

import { exportProgram } from './export';
import { pickTextFile, shareTextFile } from './files';
import { parseProgramFile } from './format';
import { buildFormatGuide, GUIDE_FILE_NAME } from './guide';
import { createExerciseMatcher } from './matching';
import { listImportRefs } from './plan';
import { useImportStore } from './store';

/** A file ready to be saved or shared from the export dialog. */
export type ExportFile = {
  /** Dialog title. */
  title: string;
  description: string;
  name: string;
  mimeType: string;
  /** Defaults to mimeType. */
  shareMimeType?: string;
  content: string;
};

const showError = (error: unknown) =>
  Alert.alert('Échec', error instanceof Error ? error.message : String(error));

export function programExportFile(programId: number): ExportFile | null {
  const file = exportProgram(programId);
  if (!file) return null;
  return {
    title: `Exporter « ${file.name} »`,
    description:
      'Fichier .json du programme, à réimporter sur un autre téléphone ou à donner à une IA pour le modifier.',
    name: `${slugify(file.name) || 'programme'}.json`,
    mimeType: 'application/json',
    content: file.json,
  };
}

/** Format description, with the common and custom exercises. */
export function formatGuideFile(): ExportFile {
  const commonNames = db
    .select({ nameEn: exercises.nameEn })
    .from(exercises)
    .where(eq(exercises.isEssential, true))
    .all()
    .flatMap(({ nameEn }) => (nameEn ? [nameEn] : []))
    .sort((a, b) => a.localeCompare(b));
  const custom = db
    .select({ slug: exercises.slug, name: exercises.name })
    .from(exercises)
    .where(eq(exercises.isCustom, true))
    .all()
    .map((exercise) => ({ exercise, key: normalizeText(exercise.name) }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    .map(({ exercise }) => exercise);
  return {
    title: 'Exporter le format',
    description:
      'Documentation du format des fichiers de programme, à donner par exemple à une IA pour qu’elle t’écrive un programme importable.',
    name: GUIDE_FILE_NAME,
    // Saving as text/plain makes Android append ".txt" to the name.
    mimeType: 'text/markdown',
    // Wider than text/markdown, which some apps don't list themselves for.
    shareMimeType: 'text/plain',
    content: buildFormatGuide(commonNames, custom),
  };
}

/**
 * Saves the file where the user chooses ("Save as") or opens the share sheet with it.
 * Resolves to true once done, false when cancelled or failed.
 */
export async function deliverFile(file: ExportFile, mode: 'save' | 'share'): Promise<boolean> {
  try {
    if (mode === 'share') {
      await shareTextFile(file.name, file.shareMimeType ?? file.mimeType, file.content, file.title);
      return true;
    }
    const saved = await saveTextFile(file.name, file.mimeType, file.content);
    if (saved) Alert.alert('Fichier enregistré', file.name);
    return saved;
  } catch (error) {
    showError(error);
    return false;
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
