import { router } from 'expo-router';
import { Pressable, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { usePrograms } from '@/features/programs/queries';
import { exportProgramToFile } from '@/features/programs/transfer/actions';

/** Picks the program to export from the Programs tab. */
export default function ExportProgramScreen() {
  const insets = useSafeAreaInsets();
  const programs = usePrograms();

  const exportProgram = async (id: number) => {
    if (await exportProgramToFile(id)) router.back();
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-3 p-4"
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      {programs.length === 0 ? (
        <EmptyState title="Aucun programme" />
      ) : (
        programs.map((program) => (
          <Pressable
            key={program.id}
            onPress={() => exportProgram(program.id)}
            // An empty program would make an invalid file.
            disabled={program.workoutCount === 0}
            accessibilityRole="button"
            className={`gap-1 rounded-2xl border border-border bg-surface p-4 active:opacity-80 ${
              program.workoutCount === 0 ? 'opacity-50' : ''
            }`}>
            <Text className="text-lg font-semibold text-foreground">{program.name}</Text>
            <Text className="text-sm text-muted">
              {program.workoutCount} séance{program.workoutCount > 1 ? 's' : ''}
            </Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
