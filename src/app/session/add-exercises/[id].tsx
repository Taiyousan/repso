import { router, useLocalSearchParams } from 'expo-router';

import { ExercisePicker } from '@/features/exercises/components/exercise-picker';
import { addExercisesToSession } from '@/features/sessions/mutations';

export default function AddSessionExercisesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ExercisePicker
      onSubmit={(exerciseIds) => {
        addExercisesToSession(Number(id), exerciseIds);
        router.back();
      }}
    />
  );
}
