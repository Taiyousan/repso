import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { HeaderButton } from '@/components/ui/header-button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { TrackingType } from '@/db/schema';
import {
  type ExerciseRecords,
  formatRecord,
  RECORD_LABELS,
  recordKindsFor,
} from '@/domain/records';
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
import { useExerciseRecords } from '@/features/sessions/queries';
import { ExerciseProgress } from '@/features/stats/components/exercise-progress';
import { formatDay } from '@/lib/dates';
import { useThemeColors } from '@/lib/theme';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { exercise } = useExercise(Number(id));
  const records = useExerciseRecords(Number(id));
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
                <HeaderButton
                  label="Modifier"
                  onPress={() =>
                    router.push({ pathname: '/exercises/edit/[id]', params: { id: exercise.id } })
                  }
                />
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

      <Records trackingType={exercise.trackingType} records={records} />

      <ExerciseProgress exerciseId={exercise.id} trackingType={exercise.trackingType} />

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
              <Text className="w-5 font-display text-base font-bold text-foreground">
                {index + 1}
              </Text>
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

/**
 * Best values reached on this exercise, with the day they were set. Drawn in the accent color:
 * these are the user's own data, not documentation about the exercise.
 */
function Records({
  trackingType,
  records,
}: {
  trackingType: TrackingType;
  records: ExerciseRecords;
}) {
  const colors = useThemeColors();
  const kinds = recordKindsFor(trackingType).filter((kind) => records[kind]);
  if (kinds.length === 0) return null;

  return (
    <View
      style={{ borderWidth: 1.5 }}
      className="gap-3 rounded-2xl border-reward-edge bg-reward p-3">
      <View className="flex-row items-center gap-2">
        <Icon
          name={{ ios: 'trophy.fill', android: 'trophy' }}
          size={18}
          color={colors.foreground}
        />
        <Text className="text-sm font-semibold tracking-wide text-foreground uppercase">
          Tes records
        </Text>
      </View>
      <View className="flex-row gap-2">
        {kinds.map((kind) => {
          const record = records[kind]!;
          return (
            <View key={kind} className="flex-1 items-center gap-0.5 rounded-xl bg-surface p-3">
              <Text
                className="text-lg font-bold text-foreground"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ fontVariant: ['tabular-nums'] }}>
                {formatRecord(kind, record.value)}
              </Text>
              <Text className="text-center text-xs text-muted" numberOfLines={2}>
                {RECORD_LABELS[kind]}
              </Text>
              <Text className="text-xs text-muted" numberOfLines={1}>
                {formatDay(record.at)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
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
