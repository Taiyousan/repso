import { Link } from 'expo-router';
import { Pressable } from 'react-native';

import { raised } from '@/components/ui/raised';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { ExerciseBrowser } from '@/features/exercises/components/exercise-browser';
import { ActiveWorkoutBanner } from '@/features/sessions/components/active-workout-banner';
import { useThemeColors } from '@/lib/theme';

export default function ExercisesScreen() {
  const colors = useThemeColors();

  return (
    <Screen title="Exercices" banner={<ActiveWorkoutBanner />} scrollable={false}>
      <ExerciseBrowser />

      <Link href="/exercises/new" asChild>
        <Pressable
          accessibilityLabel="Créer un exercice"
          style={({ pressed }) => [{ borderWidth: 2.5 }, raised(pressed, colors.ink)]}
          className="absolute right-4 bottom-4 size-14 items-center justify-center rounded-full border-ink bg-primary">
          <Text className="text-3xl leading-8 font-bold text-primary-foreground">+</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}
