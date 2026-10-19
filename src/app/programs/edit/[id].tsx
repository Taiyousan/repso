import { router, useLocalSearchParams } from 'expo-router';
import { Alert, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { ProgramForm } from '@/features/programs/components/program-form';
import { deleteProgram, updateProgram } from '@/features/programs/mutations';
import { useProgram } from '@/features/programs/queries';

export default function EditProgramScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const programId = Number(id);
  const program = useProgram(programId);

  if (!program) {
    return (
      <View className="flex-1 bg-background p-4">
        <EmptyState title="Programme introuvable" />
      </View>
    );
  }

  const confirmDelete = () => {
    Alert.alert(
      'Supprimer ce programme ?',
      'Ses séances types seront supprimées. Ton historique de séances est conservé.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteProgram(programId);
            router.dismissTo('/programs');
          },
        },
      ],
    );
  };

  return (
    <ProgramForm
      initialValue={{ name: program.name, description: program.description }}
      submitLabel="Enregistrer"
      onSubmit={(value) => {
        updateProgram(programId, value);
        router.back();
      }}
      onDelete={confirmDelete}
    />
  );
}
