import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Writes the file in the cache and opens the share sheet with it (Drive, mail, an AI app,
 * "Save to Files"…). Resolves when the sheet closes, whether or not it was shared.
 */
export async function shareTextFile(
  name: string,
  mimeType: string,
  content: string,
  dialogTitle: string,
): Promise<void> {
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  await file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle });
}

/** Content of a file picked by the user, or null when cancelled. */
export async function pickTextFile(): Promise<string | null> {
  // Any type: downloaded .json files often come as application/octet-stream.
  const picked = await File.pickFileAsync();
  return picked.canceled ? null : picked.result.text();
}
