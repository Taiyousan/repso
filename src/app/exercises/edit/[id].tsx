import { router, useLocalSearchParams } from 'expo-router';
import { Alert, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { ExerciseForm } from '@/features/exercises/components/exercise-form';
import {
  countExerciseUsages,
  deleteCustomExercise,
  updateCustomExercise,
} from '@/features/exercises/mutations';
import { useExercise } from '@/features/exercises/queries';

export default function EditExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = Number(id);
  const { exercise } = useExercise(exerciseId);

  if (!exercise?.isCustom) {
    return (
      <View className="flex-1 bg-background p-4">
        <EmptyState
          title="Modification impossible"
          description="Seuls tes exercices perso sont modifiables."
        />
      </View>
    );
  }

  const confirmDelete = () => {
    const usages = countExerciseUsages(exerciseId);
    if (usages > 0) {
      Alert.alert(
        'Exercice utilisé',
        'Cet exercice apparaît dans un programme ou une séance. Retire-le avant de le supprimer.',
      );
      return;
    }
    Alert.alert('Supprimer cet exercice ?', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          deleteCustomExercise(exerciseId);
          router.dismissTo('/exercises');
        },
      },
    ]);
  };

  return (
    <ExerciseForm
      initialValue={exercise}
      submitLabel="Enregistrer"
      onSubmit={(value) => {
        updateCustomExercise(exerciseId, value);
        router.back();
      }}
      onDelete={confirmDelete}
    />
  );
}
