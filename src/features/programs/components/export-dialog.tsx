import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { canSaveFiles } from '@/modules/file-saver';

import { deliverFile, type ExportFile } from '../transfer/actions';

type ExportDialogProps = {
  /** Shown while not null. */
  file: ExportFile | null;
  onClose: () => void;
  /** Called once the file was saved or shared. */
  onDone?: () => void;
};

/** Explains the exported file and offers to download it or share it to an app. */
export function ExportDialog({ file, onClose, onDone }: ExportDialogProps) {
  const deliver = async (mode: 'save' | 'share') => {
    if (!file) return;
    onClose();
    if (await deliverFile(file, mode)) onDone?.();
  };

  return (
    <Modal visible={file !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        accessibilityLabel="Fermer"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        className="flex-1 justify-center p-6">
        {/* Swallows taps so only the backdrop closes the dialog. */}
        <Pressable className="gap-4 rounded-2xl bg-surface p-5">
          <Text className="text-lg font-semibold text-foreground">{file?.title}</Text>
          <Text className="text-muted">{file?.description}</Text>
          <Text className="text-sm text-muted">{file?.name}</Text>
          <View className="gap-3">
            {canSaveFiles ? <Button label="Télécharger" onPress={() => deliver('save')} /> : null}
            <Button label="Partager" variant="secondary" onPress={() => deliver('share')} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
