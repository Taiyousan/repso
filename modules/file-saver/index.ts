import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

type FileSaverModule = {
  saveAsync(name: string, mimeType: string, content: string): Promise<boolean>;
};

// Optional: absent on iOS, and in builds made before this module existed.
const native =
  Platform.OS === 'android' ? requireOptionalNativeModule<FileSaverModule>('FileSaver') : null;

export const canSaveFiles = native !== null;

/**
 * Opens Android's "Save as" dialog and writes the text file where the user chose.
 * Resolves to false when cancelled.
 */
export async function saveTextFile(name: string, mimeType: string, content: string) {
  if (!native) throw new Error('Enregistrement indisponible dans cette version de l’app.');
  return native.saveAsync(name, mimeType, content);
}
