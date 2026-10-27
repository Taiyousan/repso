import { Link, router } from 'expo-router';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import type { Exercise } from '@/db/schema';
import { useThemeColors } from '@/lib/theme';

import { muscleLabel } from '../labels';
import { ExerciseThumbnail } from './exercise-thumbnail';

const IMAGE_HEIGHT = 112;

type ExerciseCardProps = {
  exercise: Exercise;
  /** Selection mode: the card toggles instead of opening the exercise sheet. */
  onSelect?: (exercise: Exercise) => void;
  selected?: boolean;
};

/** Grid tile: illustration, name on two lines, primary muscles. */
export const ExerciseCard = memo(function ExerciseCard({
  exercise,
  onSelect,
  selected = false,
}: ExerciseCardProps) {
  const colors = useThemeColors();
  const muscles = exercise.primaryMuscles.map(muscleLabel).join(', ');

  const content = (
    <>
      <ExerciseThumbnail images={exercise.images} name={exercise.name} size={IMAGE_HEIGHT} fill />

      {onSelect ? (
        <>
          {/* The card itself toggles the selection, so the sheet needs its own button. */}
          <Pressable
            onPress={() =>
              router.push({ pathname: '/exercises/[id]', params: { id: exercise.id } })
            }
            accessibilityRole="button"
            accessibilityLabel={`Voir la fiche : ${exercise.name}`}
            hitSlop={8}
            className="absolute top-2 left-2 size-7 items-center justify-center rounded-full border border-border bg-surface">
            <Icon name={{ ios: 'info', android: 'info' }} size={16} color={colors.muted} />
          </Pressable>
          <View className="absolute top-2 right-2 rounded-full bg-surface">
            <Icon
              name={
                selected
                  ? { ios: 'checkmark.circle.fill', android: 'check_circle' }
                  : { ios: 'circle', android: 'radio_button_unchecked' }
              }
              size={24}
              color={selected ? colors.primary : colors.border}
            />
          </View>
        </>
      ) : null}

      <View className="gap-0.5 p-2.5">
        {/* Fixed height so cards of a row line up whether the name takes one line or two. */}
        <Text className="h-10 text-sm font-semibold text-foreground" numberOfLines={2}>
          {exercise.name}
        </Text>
        <Text className="text-xs text-muted" numberOfLines={1}>
          {exercise.isCustom ? `Perso · ${muscles}` : muscles}
        </Text>
      </View>
    </>
  );

  const className = `overflow-hidden rounded-2xl border bg-surface active:opacity-80 ${
    selected ? 'border-primary' : 'border-border'
  }`;

  if (onSelect) {
    return (
      <Pressable
        onPress={() => onSelect(exercise)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={exercise.name}
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
