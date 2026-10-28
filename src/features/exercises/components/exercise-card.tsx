import { Link, router } from 'expo-router';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { PressableCard } from '@/components/ui/pressable-card';
import { Text } from '@/components/ui/text';
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
            hitSlop={10}
            style={{ borderWidth: 1.5 }}
            className="absolute top-2 left-2 size-7 items-center justify-center rounded-full border-ink bg-surface">
            <Icon name={{ ios: 'info', android: 'info' }} size={16} color={colors.foreground} />
          </Pressable>
          <View className="absolute top-2 right-2 rounded-full bg-surface">
            <Icon
              name={
                selected
                  ? { ios: 'checkmark.circle.fill', android: 'check_circle' }
                  : { ios: 'circle', android: 'radio_button_unchecked' }
              }
              size={24}
              color={selected ? colors.foreground : colors.muted}
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

  if (onSelect) {
    return (
      <PressableCard
        onPress={() => onSelect(exercise)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={exercise.name}
        selected={selected}
        className="overflow-hidden">
        {content}
      </PressableCard>
    );
  }

  return (
    <Link href={{ pathname: '/exercises/[id]', params: { id: exercise.id } }} asChild>
      <PressableCard className="overflow-hidden">{content}</PressableCard>
    </Link>
  );
});
