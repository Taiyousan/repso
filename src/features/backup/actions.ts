import { File, Paths } from 'expo-file-system';
import { Alert } from 'react-native';

import type { ExportFile } from '@/features/programs/transfer/actions';
import { pickTextFile } from '@/features/programs/transfer/files';
import { readActiveSession } from '@/features/sessions/queries';
import { formatDay } from '@/lib/dates';

import { readBackupData, restoreBackupData } from './data';
import { type Backup, describeBackup, parseBackup, serializeBackup } from './format';

const showError = (error: unknown) =>
  Alert.alert('Échec', error instanceof Error ? error.message : String(error));

/** The data as it was before the last restore, to undo it. Lives with the app's documents. */
const safetyCopy = () => new File(Paths.document, 'avant-restauration.json');

export function hasSafetyCopy(): boolean {
  return safetyCopy().exists;
}

function serializeCurrentData(): string {
  const text = serializeBackup(readBackupData(), new Date());
  // A backup that can't be restored must be noticed now, not on the day it's needed.
  const check = parseBackup(text);
  if (!check.ok) throw new Error(check.error);
  return text;
}

/** Null after showing the error when the data can't be read. */
export function backupExportFile(): ExportFile | null {
  try {
    const content = serializeCurrentData();
    return {
      title: 'Sauvegarder mes données',
      description: `Programmes, historique, tags et exercices personnalisés. Garde ce fichier ailleurs que sur ce téléphone (Drive, mail…).${
        readActiveSession() ? ' L’entraînement en cours n’est pas inclus.' : ''
      }`,
      name: `workout-planner-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`,
      mimeType: 'application/json',
      content,
    };
  } catch (error) {
    showError(error);
    return null;
  }
}

async function restore(backup: Backup, onRestored: () => void) {
  try {
    const copy = safetyCopy();
    const previous = serializeCurrentData();
    copy.create({ overwrite: true });
    await copy.write(previous);
    restoreBackupData(backup.data);
    onRestored();
    Alert.alert('Sauvegarde restaurée', describeBackup(backup.data));
  } catch (error) {
    showError(error);
  }
}

function confirmRestore(text: string, title: string, message: string, onRestored: () => void) {
  if (readActiveSession()) {
    Alert.alert(
      'Entraînement en cours',
      'Termine ou abandonne l’entraînement en cours avant de restaurer.',
    );
    return;
  }
  const result = parseBackup(text);
  if (!result.ok) {
    Alert.alert('Fichier invalide', result.error);
    return;
  }
  const { backup } = result;
  const details = `Sauvegarde du ${formatDay(backup.exportedAt)} : ${describeBackup(backup.data)}.`;
  Alert.alert(title, `${details}\n\n${message}`, [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Restaurer', style: 'destructive', onPress: () => restore(backup, onRestored) },
  ]);
}

/** Opens a backup file and, once confirmed, replaces all the data with it. */
export async function restoreFromFile(onRestored: () => void): Promise<void> {
  let text: string | null;
  try {
    text = await pickTextFile();
  } catch (error) {
    showError(error);
    return;
  }
  if (text === null) return;
  confirmRestore(
    text,
    'Restaurer cette sauvegarde ?',
    'Toutes tes données actuelles seront remplacées. Tu pourras annuler depuis les réglages.',
    onRestored,
  );
}

/** Goes back to the data as it was before the last restore. */
export async function undoRestore(onRestored: () => void): Promise<void> {
  let text: string;
  try {
    text = await safetyCopy().text();
  } catch (error) {
    showError(error);
    return;
  }
  confirmRestore(
    text,
    'Annuler la dernière restauration ?',
    'Tes données reviendront à cet état.',
    onRestored,
  );
}
