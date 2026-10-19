import { Link } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { ExerciseBrowser } from '@/features/exercises/components/exercise-browser';

export default function ExercisesScreen() {
  return (
    <Screen title="Exercices" scrollable={false}>
      <ExerciseBrowser />

      <Link href="/exercises/new" asChild>
        <Pressable
          accessibilityLabel="Créer un exercice"
          className="absolute right-4 bottom-4 size-14 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-80">
          <Text className="text-3xl leading-8 text-primary-foreground">+</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}
