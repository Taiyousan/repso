import { router } from 'expo-router';

import { ExerciseForm } from '@/features/exercises/components/exercise-form';
import { createCustomExercise } from '@/features/exercises/mutations';

export default function NewExerciseScreen() {
  return (
    <ExerciseForm
      submitLabel="Créer l'exercice"
      onSubmit={(value) => {
        const id = createCustomExercise(value);
        router.replace({ pathname: '/exercises/[id]', params: { id } });
      }}
    />
  );
}
