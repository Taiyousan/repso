import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ExerciseAnimation } from '@/features/exercises/components/exercise-animation';
import { MuscleMap } from '@/features/exercises/components/muscle-map';
import { TranslationRequestButton } from '@/features/exercises/components/translation-request-button';
import {
  categoryLabel,
  equipmentLabel,
  levelLabel,
  mechanicLabel,
  muscleLabel,
  TRACKING_TYPE_LABELS,
} from '@/features/exercises/labels';
import { useExercise } from '@/features/exercises/queries';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { exercise } = useExercise(Number(id));
  const insets = useSafeAreaInsets();

  if (!exercise) {
    return (
      <View className="flex-1 bg-background p-4">
        <Stack.Screen options={{ title: '' }} />
        <EmptyState title="Exercice introuvable" />
      </View>
    );
  }

  const tags = [
    exercise.category && categoryLabel(exercise.category),
    exercise.equipment && equipmentLabel(exercise.equipment),
    exercise.level && levelLabel(exercise.level),
    exercise.mechanic && mechanicLabel(exercise.mechanic),
    TRACKING_TYPE_LABELS[exercise.trackingType],
  ].filter((tag): tag is string => Boolean(tag));

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-5 p-4"
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      <Stack.Screen
        options={{
          title: exercise.name,
          headerRight: exercise.isCustom
            ? () => (
                <Link
                  href={{ pathname: '/exercises/edit/[id]', params: { id: exercise.id } }}
                  asChild>
                  <Pressable hitSlop={8}>
                    <Text className="text-base font-semibold text-primary">Modifier</Text>
                  </Pressable>
                </Link>
              )
            : undefined,
        }}
      />

      <ExerciseAnimation images={exercise.images} />

      <View className="gap-2">
        <View className="flex-row flex-wrap gap-2">
          {tags.map((tag) => (
            <Chip key={tag} label={tag} />
          ))}
        </View>
        {exercise.nameEn && exercise.nameEn !== exercise.name ? (
          <Text className="text-sm text-muted">Nom d&apos;origine : {exercise.nameEn}</Text>
        ) : null}
      </View>

      <View className="gap-3">
        <Text className="text-lg font-semibold text-foreground">Muscles travaillés</Text>
        <MuscleMap
          primaryMuscles={exercise.primaryMuscles}
          secondaryMuscles={exercise.secondaryMuscles}
        />
        <MuscleList label="Principaux" muscles={exercise.primaryMuscles} />
        <MuscleList label="Secondaires" muscles={exercise.secondaryMuscles} />
      </View>

      {exercise.instructions.length > 0 ? (
        <View className="gap-3">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-lg font-semibold text-foreground">Instructions</Text>
            {exercise.instructionsLanguage === 'en' ? (
              <Text className="text-sm text-muted">En anglais</Text>
            ) : null}
          </View>
          {exercise.instructions.map((step, index) => (
            <View key={index} className="flex-row gap-3">
              <Text className="w-5 text-base font-semibold text-primary">{index + 1}</Text>
              <Text className="flex-1 text-base leading-6 text-foreground">{step}</Text>
            </View>
          ))}
          {exercise.instructionsLanguage === 'en' && !exercise.isCustom ? (
            <TranslationRequestButton exerciseId={exercise.id} />
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

function MuscleList({ label, muscles }: { label: string; muscles: string[] }) {
  if (muscles.length === 0) return null;
  return (
    <Text className="text-base text-foreground">
      <Text className="font-semibold">{label} : </Text>
      {muscles.map(muscleLabel).join(', ')}
    </Text>
  );
}
