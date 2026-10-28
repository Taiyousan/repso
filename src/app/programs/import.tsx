import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { ImportPreview } from '@/features/programs/components/import-preview';
import { importProgram } from '@/features/programs/transfer/import';
import { useImportStore } from '@/features/programs/transfer/store';

/** Preview of the program file opened from the Programs tab, before it is created. */
export default function ImportProgramScreen() {
  const insets = useSafeAreaInsets();
  const draft = useImportStore((state) => state.draft);
  const reset = useImportStore((state) => state.reset);

  // The analysis lives as long as this screen.
  useEffect(() => reset, [reset]);

  const confirmImport = () => {
    if (!draft) return;
    const programId = importProgram(draft.program, draft.refs, draft.resolutions);
    router.replace({ pathname: '/programs/[id]', params: { id: programId } });
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 p-4"
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      {draft ? (
        <ImportPreview onImport={confirmImport} onCancel={() => router.back()} />
      ) : (
        <EmptyState title="Aucun programme à importer" />
      )}
    </ScrollView>
  );
}
