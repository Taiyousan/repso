import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import { imageDirectory, LOCAL_IMAGE_PREFIX, localImageFile } from './local-images';

/** Longest side: sharp on a phone, ~100 KB in JPEG, so backups stay reasonable. */
const MAX_IMAGE_SIDE = 800;

/**
 * Lets the user take or pick a photo, shrinks it and keeps a copy. Null when cancelled; the
 * error is shown when it fails.
 */
export async function addExerciseImage(source: 'camera' | 'library'): Promise<string | null> {
  try {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Appareil photo refusé',
          'Autorise l’appareil photo dans les réglages d’Android pour prendre une photo.',
        );
        return null;
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 1 };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return null;

    const asset = result.assets[0];
    const context = ImageManipulator.manipulate(asset.uri);
    if (Math.max(asset.width, asset.height) > MAX_IMAGE_SIDE) {
      context.resize(
        asset.width >= asset.height
          ? { width: MAX_IMAGE_SIDE, height: null }
          : { width: null, height: MAX_IMAGE_SIDE },
      );
    }
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7 });

    imageDirectory().create({ idempotent: true, intermediates: true });
    const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    new File(saved.uri).moveSync(localImageFile(name));
    return LOCAL_IMAGE_PREFIX + name;
  } catch (error) {
    Alert.alert('Échec', error instanceof Error ? error.message : String(error));
    return null;
  }
}
