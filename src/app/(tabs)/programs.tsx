import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { HeaderMenu } from '@/components/ui/header-menu';
import { IconButton } from '@/components/ui/icon-button';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { ExportDialog } from '@/features/programs/components/export-dialog';
import { usePrograms } from '@/features/programs/queries';
import {
  type ExportFile,
  formatGuideFile,
  importProgramFile,
} from '@/features/programs/transfer/actions';
import { ActiveWorkoutBanner } from '@/features/sessions/components/active-workout-banner';

const createProgram = () => router.push('/programs/new');
const showSuggested = () => router.push('/programs/suggested');

export default function ProgramsScreen() {
  const programs = usePrograms();
  const [exportFile, setExportFile] = useState<ExportFile | null>(null);

  return (
    <Screen
      title="Programmes"
      banner={<ActiveWorkoutBanner />}
      action={
        <View className="flex-row items-center gap-3">
          <IconButton
            icon={{ ios: 'plus', android: 'add' }}
            label="Nouveau programme"
            onPress={createProgram}
          />
          <HeaderMenu
            items={[
              { label: 'Programmes suggérés', onPress: showSuggested },
              { label: 'Importer un programme', onPress: importProgramFile },
              ...(programs.length > 0
                ? [
                    {
                      label: 'Exporter un programme',
                      onPress: () => router.push('/programs/export'),
                    },
                  ]
                : []),
              { label: 'Exporter le format', onPress: () => setExportFile(formatGuideFile()) },
            ]}
          />
        </View>
      }>
      {programs.length === 0 ? (
        <View className="gap-3">
          <EmptyState
            title="Aucun programme"
            description="Pars d’un programme suggéré, crée le tien, par exemple « PPL » avec ses séances Push, Pull et Legs, ou importe-le."
          />
          <Button label="Voir les programmes suggérés" onPress={showSuggested} />
          <Button label="Créer un programme" variant="secondary" onPress={createProgram} />
          <Button label="Importer un programme" variant="secondary" onPress={importProgramFile} />
        </View>
      ) : (
        <>
          {programs.map((program) => (
            <ListRow
              key={program.id}
              title={program.name}
              details={[
                program.description,
                `${program.workoutCount} séance${program.workoutCount > 1 ? 's' : ''}`,
              ]}
              onPress={() =>
                router.push({ pathname: '/programs/[id]', params: { id: program.id } })
              }
            />
          ))}
          <Button
            label="Voir les programmes suggérés"
            variant="secondary"
            onPress={showSuggested}
          />
        </>
      )}
      <ExportDialog file={exportFile} onClose={() => setExportFile(null)} />
    </Screen>
  );
}
