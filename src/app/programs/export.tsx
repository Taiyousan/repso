import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { PressableCard } from '@/components/ui/pressable-card';
import { Text } from '@/components/ui/text';
import { ExportDialog } from '@/features/programs/components/export-dialog';
import { usePrograms } from '@/features/programs/queries';
import { type ExportFile, programExportFile } from '@/features/programs/transfer/actions';

/** Picks the program to export from the Programs tab. */
export default function ExportProgramScreen() {
  const insets = useSafeAreaInsets();
  const programs = usePrograms();
  const [exportFile, setExportFile] = useState<ExportFile | null>(null);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-3 p-4"
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      {programs.length === 0 ? (
        <EmptyState title="Aucun programme" />
      ) : (
        programs.map((program) => (
          <PressableCard
            key={program.id}
            onPress={() => setExportFile(programExportFile(program.id))}
            // An empty program would make an invalid file.
            disabled={program.workoutCount === 0}
            className={`gap-1 p-4 ${program.workoutCount === 0 ? 'opacity-50' : ''}`}>
            <Text className="text-lg font-semibold text-foreground">{program.name}</Text>
            <Text className="text-sm text-muted">
              {program.workoutCount} séance{program.workoutCount > 1 ? 's' : ''}
            </Text>
          </PressableCard>
        ))
      )}
      <ExportDialog
        file={exportFile}
        onClose={() => setExportFile(null)}
        onDone={() => router.back()}
      />
    </ScrollView>
  );
}
