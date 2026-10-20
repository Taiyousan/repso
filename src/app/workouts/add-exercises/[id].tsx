import { router, useLocalSearchParams } from 'expo-router';

import { ExercisePicker } from '@/features/exercises/components/exercise-picker';
import { addExercisesToTemplate } from '@/features/programs/mutations';

export default function AddWorkoutExercisesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ExercisePicker
      onSubmit={(exerciseIds) => {
        addExercisesToTemplate(Number(id), exerciseIds);
        router.back();
      }}
    />
  );
}
