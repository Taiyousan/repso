import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import type { Exercise } from '@/db/schema';

import { ExerciseBrowser } from './exercise-browser';

type ExercisePickerProps = {
  /** Receives the exercises in the order they were ticked. */
  onSubmit: (exerciseIds: number[]) => void;
};

/** Full-screen multi-selection of library exercises with a validation bar. */
export function ExercisePicker({ onSubmit }: ExercisePickerProps) {
  const insets = useSafeAreaInsets();
  const [selection, setSelection] = useState<number[]>([]);
  const selectedIds = useMemo(() => new Set(selection), [selection]);

  const toggle = (exercise: Exercise) => {
    setSelection((current) =>
      current.includes(exercise.id)
        ? current.filter((exerciseId) => exerciseId !== exercise.id)
        : [...current, exercise.id],
    );
  };

  return (
    <View className="flex-1 bg-background pt-3">
      <ExerciseBrowser selectedIds={selectedIds} onSelect={toggle} bottomInset={16} />
      <View
        className="border-t border-border bg-surface px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}>
        <Button
          label={
            selection.length === 0
              ? 'Sélectionne des exercices'
              : `Ajouter ${selection.length} exercice${selection.length > 1 ? 's' : ''}`
          }
          onPress={() => onSubmit(selection)}
          disabled={selection.length === 0}
        />
      </View>
    </View>
  );
}
