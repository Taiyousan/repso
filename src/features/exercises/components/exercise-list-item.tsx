import { Link } from 'expo-router';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { Exercise } from '@/db/schema';

import { equipmentLabel, muscleLabel } from '../labels';
import { ExerciseThumbnail } from './exercise-thumbnail';

type ExerciseListItemProps = {
  exercise: Exercise;
};

export const ExerciseListItem = memo(function ExerciseListItem({
  exercise,
}: ExerciseListItemProps) {
  const details = [
    exercise.primaryMuscles.map(muscleLabel).join(', '),
    exercise.equipment ? equipmentLabel(exercise.equipment) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link href={{ pathname: '/exercises/[id]', params: { id: exercise.id } }} asChild>
      <Pressable className="flex-row items-center gap-3 px-4 py-2.5 active:bg-surface-muted">
        <ExerciseThumbnail images={exercise.images} name={exercise.name} />
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center gap-2">
            <Text className="shrink text-base font-medium text-foreground" numberOfLines={1}>
              {exercise.name}
            </Text>
            {exercise.isCustom ? (
              <Text className="rounded-md bg-surface-muted px-1.5 py-0.5 text-xs text-muted">
                Perso
              </Text>
            ) : null}
          </View>
          <Text className="text-sm text-muted" numberOfLines={1}>
            {details}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
});
