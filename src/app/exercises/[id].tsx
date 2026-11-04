import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Section } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { HeaderButton } from '@/components/ui/header-button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import type { TrackingType } from '@/db/schema';
import {
  type ExerciseRecords,
  formatRecord,
  RECORD_LABELS,
  recordKindsFor,
} from '@/domain/records';
import { ExerciseAnimation } from '@/features/exercises/components/exercise-animation';
import { MuscleSummary } from '@/features/exercises/components/muscle-map';
import { TranslationRequestButton } from '@/features/exercises/components/translation-request-button';
import {
  categoryLabel,
  equipmentLabel,
  levelLabel,
  mechanicLabel,
} from '@/features/exercises/labels';
import { useExercise } from '@/features/exercises/queries';
import { useExerciseRecords } from '@/features/sessions/queries';
import { ExerciseProgress } from '@/features/stats/components/exercise-progress';
import { formatDay } from '@/lib/dates';

type Tab = 'overview' | 'history' | 'technique';

const TABS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Aperçu' },
  { value: 'history', label: 'Historique' },
  { value: 'technique', label: 'Technique' },
];

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { exercise } = useExercise(Number(id));
  const records = useExerciseRecords(Number(id));
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('overview');

  if (!exercise) {
    return (
      <View className="flex-1 bg-background p-4">
        <Stack.Screen options={{ title: '' }} />
        <EmptyState title="Exercice introuvable" />
      </View>
    );
  }

  // Most exercises are strength ones: the category only shows when it says something.
  const details = [
    exercise.category && exercise.category !== 'strength' && categoryLabel(exercise.category),
    exercise.equipment && equipmentLabel(exercise.equipment),
    exercise.mechanic && mechanicLabel(exercise.mechanic),
    exercise.level && levelLabel(exercise.level),
  ].filter((detail): detail is string => Boolean(detail));

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 px-4 pt-2"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
      <Stack.Screen
        options={{
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

      <View className="gap-0.5">
        <Text className="font-display text-3xl font-extrabold text-foreground">
          {exercise.name}
        </Text>
        {details.length > 0 ? (
          <Text className="text-sm font-semibold text-muted">{details.join(' · ')}</Text>
        ) : null}
      </View>

      <SegmentedControl options={TABS} value={tab} onChange={setTab} />

      {tab === 'overview' ? (
        <View className="gap-6">
          <Records trackingType={exercise.trackingType} records={records} />
          {exercise.primaryMuscles.length + exercise.secondaryMuscles.length > 0 ? (
            <Section title="Muscles">
              <MuscleSummary
                primaryMuscles={exercise.primaryMuscles}
                secondaryMuscles={exercise.secondaryMuscles}
              />
            </Section>
          ) : null}
        </View>
      ) : null}

      {tab === 'history' ? (
        <ExerciseProgress exerciseId={exercise.id} trackingType={exercise.trackingType} />
      ) : null}

      {tab === 'technique' ? (
        <View className="gap-3">
          {exercise.instructions.length > 0 ? (
            <View className="overflow-hidden rounded-2xl border border-outline bg-surface">
              {exercise.instructions.map((step, index) => (
                <View
                  key={index}
                  className={`flex-row gap-3 px-4 py-3 ${index > 0 ? 'border-t border-border' : ''}`}>
                  <View className="size-6 items-center justify-center rounded-full bg-primary-soft">
                    <Text className="font-display text-sm font-extrabold text-foreground">
                      {index + 1}
                    </Text>
                  </View>
                  <Text className="flex-1 text-base leading-5 font-semibold text-foreground">
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState title="Pas d'instructions pour cet exercice" />
          )}
          {exercise.instructionsLanguage === 'en' && !exercise.isCustom ? (
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-sm text-muted">En anglais</Text>
              <TranslationRequestButton exerciseId={exercise.id} />
            </View>
          ) : null}
          {exercise.nameEn && exercise.nameEn !== exercise.name ? (
            <Text className="text-sm text-muted">Nom d&apos;origine : {exercise.nameEn}</Text>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

/** Best values reached on this exercise, with the day they were set. */
function Records({
  trackingType,
  records,
}: {
  trackingType: TrackingType;
  records: ExerciseRecords;
}) {
  const kinds = recordKindsFor(trackingType).filter((kind) => records[kind]);
  if (kinds.length === 0) return null;

  return (
    <Section title="Tes records">
      <View className="flex-row gap-2">
        {kinds.map((kind) => {
          const record = records[kind]!;
          return (
            <View
              key={kind}
              className="flex-1 gap-0.5 rounded-2xl border border-outline bg-surface p-3">
              <Text
                className="font-display text-xl font-extrabold text-foreground"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ fontVariant: ['tabular-nums'] }}>
                {formatRecord(kind, record.value)}
              </Text>
              <Text className="text-sm font-bold text-muted" numberOfLines={2}>
                {RECORD_LABELS[kind]}
              </Text>
              <Text className="text-xs text-muted" numberOfLines={1}>
                {formatDay(record.at)}
              </Text>
            </View>
          );
        })}
      </View>
    </Section>
  );
}
