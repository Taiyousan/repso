import { router } from 'expo-router';

import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { ExerciseBrowser } from '@/features/exercises/components/exercise-browser';
import { ActiveWorkoutBanner } from '@/features/sessions/components/active-workout-banner';

export default function ExercisesScreen() {
  return (
    <Screen
      title="Exercices"
      banner={<ActiveWorkoutBanner />}
      action={
        <IconButton
          icon={{ ios: 'plus', android: 'add' }}
          label="Créer un exercice"
          onPress={() => router.push('/exercises/new')}
        />
      }
      scrollable={false}>
      <ExerciseBrowser />
    </Screen>
  );
}
