import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { HeaderMenu } from '@/components/ui/header-menu';
import { ExerciseForm } from '@/features/exercises/components/exercise-form';
import {
  countExerciseUsages,
  deleteCustomExercise,
  setExerciseHidden,
  updateCustomExercise,
} from '@/features/exercises/mutations';
import { useExercise } from '@/features/exercises/queries';

export default function EditExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = Number(id);
  const { exercise } = useExercise(exerciseId);
  const [usageCount] = useState(() => countExerciseUsages(exerciseId));

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

  const hide = () => {
    setExerciseHidden(exerciseId, true);
    router.back();
  };

  const confirmDelete = () => {
    // Programs and workouts keep pointing to it: hiding is what removes it from sight.
    if (usageCount > 0) {
      Alert.alert(
        'Exercice déjà utilisé',
        'Il figure dans un programme ou un entraînement, il ne peut pas être supprimé. Tu peux le masquer : il disparaît de la bibliothèque mais reste dans ton historique.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Masquer', onPress: hide },
        ],
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
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderMenu
              items={[
                exercise.isHidden
                  ? {
                      label: 'Remettre dans la bibliothèque',
                      onPress: () => setExerciseHidden(exerciseId, false),
                    }
                  : { label: 'Masquer de la bibliothèque', onPress: hide },
                { label: 'Supprimer l’exercice', onPress: confirmDelete, destructive: true },
              ]}
            />
          ),
        }}
      />
      <ExerciseForm
        initialValue={exercise}
        submitLabel="Enregistrer"
        usageCount={usageCount}
        onSubmit={(value) => {
          updateCustomExercise(exerciseId, value);
          router.back();
        }}
      />
    </>
  );
}
