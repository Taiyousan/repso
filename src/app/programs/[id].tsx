import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Section } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { HeaderButton } from '@/components/ui/header-button';
import { HeaderMenu } from '@/components/ui/header-menu';
import { ListRow } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { muscleLabel } from '@/features/exercises/labels';
import { ExportDialog } from '@/features/programs/components/export-dialog';
import { useProgram } from '@/features/programs/queries';
import { type ExportFile, programExportFile } from '@/features/programs/transfer/actions';

/** A program as read: its workouts open their page; "Modifier" opens the editor. */
export default function ProgramScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const programId = Number(id);
  const program = useProgram(programId);
  const insets = useSafeAreaInsets();
  const [exportFile, setExportFile] = useState<ExportFile | null>(null);

  if (!program) {
    return (
      <View className="flex-1 bg-background p-4">
        <Stack.Screen options={{ title: '' }} />
        <EmptyState title="Programme introuvable" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-5 p-4"
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <View className="flex-row items-center gap-3">
              <HeaderButton
                label="Modifier"
                onPress={() =>
                  router.push({ pathname: '/programs/edit/[id]', params: { id: programId } })
                }
              />
              {/* An empty program would make an invalid file. */}
              {program.workouts.length > 0 ? (
                <HeaderMenu
                  items={[
                    {
                      label: 'Exporter le programme',
                      onPress: () => setExportFile(programExportFile(programId)),
                    },
                  ]}
                />
              ) : null}
            </View>
          ),
        }}
      />

      <View className="gap-1.5">
        <Text className="font-display text-4xl font-extrabold text-foreground">{program.name}</Text>
        {program.description ? (
          <Text className="text-base text-muted">{program.description}</Text>
        ) : null}
      </View>

      <Section title="Séances">
        {program.workouts.length === 0 ? (
          <EmptyState
            title="Aucune séance"
            description="Passe en mode Modifier pour ajouter les séances de ce programme, par exemple Push, Pull et Legs."
          />
        ) : (
          program.workouts.map((workout) => (
            <ListRow
              key={workout.id}
              title={workout.name}
              details={[
                `${workout.exerciseCount} exercice${workout.exerciseCount > 1 ? 's' : ''}${
                  workout.muscles.length > 0
                    ? ` · ${workout.muscles.map(muscleLabel).join(', ')}`
                    : ''
                }`,
              ]}
              onPress={() =>
                router.push({ pathname: '/workouts/[id]', params: { id: workout.id } })
              }
            />
          ))
        )}
      </Section>

      <ExportDialog file={exportFile} onClose={() => setExportFile(null)} />
    </ScrollView>
  );
}
