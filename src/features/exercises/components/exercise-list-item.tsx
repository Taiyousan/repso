import { Link } from 'expo-router';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import type { Exercise } from '@/db/schema';
import { useThemeColors } from '@/lib/theme';

import { equipmentLabel, muscleLabel } from '../labels';
import { ExerciseThumbnail } from './exercise-thumbnail';

type ExerciseListItemProps = {
  exercise: Exercise;
  /** Selection mode: the item toggles instead of opening the exercise sheet. */
  onSelect?: (exercise: Exercise) => void;
  selected?: boolean;
};

export const ExerciseListItem = memo(function ExerciseListItem({
  exercise,
  onSelect,
  selected = false,
}: ExerciseListItemProps) {
  const colors = useThemeColors();
  const details = [
    exercise.primaryMuscles.map(muscleLabel).join(', '),
    exercise.equipment ? equipmentLabel(exercise.equipment) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const content = (
    <>
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
      {onSelect ? (
        <Icon
          name={
            selected
              ? { ios: 'checkmark.circle.fill', android: 'check_circle' }
              : { ios: 'circle', android: 'radio_button_unchecked' }
          }
          color={selected ? colors.primary : colors.border}
        />
      ) : null}
    </>
  );

  const className = 'flex-row items-center gap-3 px-4 py-2.5 active:bg-surface-muted';

  if (onSelect) {
    return (
      <Pressable
        onPress={() => onSelect(exercise)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        className={className}>
        {content}
      </Pressable>
    );
  }

  return (
    <Link href={{ pathname: '/exercises/[id]', params: { id: exercise.id } }} asChild>
      <Pressable className={className}>{content}</Pressable>
    </Link>
  );
});
