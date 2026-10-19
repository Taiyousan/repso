import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import type { Exercise } from '@/db/schema';
import { ExerciseBrowser } from '@/features/exercises/components/exercise-browser';
import { addExercisesToTemplate } from '@/features/programs/mutations';

const BOTTOM_BAR_HEIGHT = 88;

export default function AddExercisesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  // Kept in tap order: exercises are appended to the workout in that order.
  const [selection, setSelection] = useState<number[]>([]);
  const selectedIds = useMemo(() => new Set(selection), [selection]);

  const toggle = (exercise: Exercise) => {
    setSelection((current) =>
      current.includes(exercise.id)
        ? current.filter((exerciseId) => exerciseId !== exercise.id)
        : [...current, exercise.id],
    );
  };

  const submit = () => {
    addExercisesToTemplate(Number(id), selection);
    router.back();
  };

  return (
    <View className="flex-1 bg-background pt-3">
      <ExerciseBrowser
        selectedIds={selectedIds}
        onSelect={toggle}
        bottomInset={BOTTOM_BAR_HEIGHT + insets.bottom}
      />
      <View
        className="absolute inset-x-0 bottom-0 border-t border-border bg-surface px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}>
        <Button
          label={
            selection.length === 0
              ? 'Sélectionne des exercices'
              : `Ajouter ${selection.length} exercice${selection.length > 1 ? 's' : ''}`
          }
          onPress={submit}
          disabled={selection.length === 0}
        />
      </View>
    </View>
  );
}
