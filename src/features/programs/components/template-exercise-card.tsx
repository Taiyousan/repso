import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { ExerciseThumbnail } from '@/features/exercises/components/exercise-thumbnail';

import {
  addTemplateSet,
  moveTemplateExercise,
  removeTemplateExercise,
  setTemplateExerciseRest,
} from '../mutations';
import type { TemplateExerciseDetail } from '../queries';
import { setBadges } from '../sets';
import { RestSelector } from './rest-selector';
import { TemplateSetRow } from './template-set-row';

const COLUMN_LABELS = {
  weight_reps: ['Reps', 'Kg'],
  bodyweight_reps: ['Reps', ''],
  duration: ['Secondes', ''],
  distance: ['Secondes', ''],
} as const;

type TemplateExerciseCardProps = {
  item: TemplateExerciseDetail;
  isFirst: boolean;
  isLast: boolean;
};

export function TemplateExerciseCard({ item, isFirst, isLast }: TemplateExerciseCardProps) {
  const { exercise, sets } = item;
  const badges = setBadges(sets.map((set) => set.type));
  const [firstColumn, secondColumn] = COLUMN_LABELS[exercise.trackingType];

  return (
    <Card>
      <View className="flex-row items-center gap-3">
        <ExerciseThumbnail images={exercise.images} name={exercise.name} />
        <Link href={{ pathname: '/exercises/[id]', params: { id: exercise.id } }} asChild>
          <Pressable className="flex-1">
            <Text className="text-base font-semibold text-foreground" numberOfLines={2}>
              {exercise.name}
            </Text>
          </Pressable>
        </Link>
        <View className="flex-row">
          <IconButton
            icon={{ ios: 'chevron.up', android: 'keyboard_arrow_up' }}
            label="Monter l'exercice"
            onPress={() => moveTemplateExercise(item.id, 'up')}
            disabled={isFirst}
          />
          <IconButton
            icon={{ ios: 'chevron.down', android: 'keyboard_arrow_down' }}
            label="Descendre l'exercice"
            onPress={() => moveTemplateExercise(item.id, 'down')}
            disabled={isLast}
          />
          <IconButton
            icon={{ ios: 'trash', android: 'delete' }}
            label="Retirer l'exercice"
            tone="danger"
            onPress={() => removeTemplateExercise(item.id)}
          />
        </View>
      </View>

      <RestSelector
        restSeconds={item.restSeconds}
        onChange={(restSeconds) => setTemplateExerciseRest(item.id, restSeconds)}
      />

      <View className="gap-2">
        <View className="flex-row items-center gap-3">
          <Text className="w-9 text-center text-xs text-muted">Série</Text>
          <Text className="flex-1 text-center text-xs text-muted">{firstColumn}</Text>
          <Text className="flex-1 text-center text-xs text-muted">{secondColumn}</Text>
          <View className="w-8" />
        </View>
        {sets.map((set, index) => (
          <TemplateSetRow
            key={set.id}
            set={set}
            badge={badges[index]}
            trackingType={exercise.trackingType}
            canRemove={sets.length > 1}
          />
        ))}
      </View>

      <Pressable
        onPress={() => addTemplateSet(item.id)}
        accessibilityRole="button"
        className="items-center rounded-lg bg-surface-muted py-2 active:opacity-80">
        <Text className="text-sm font-semibold text-foreground">+ Ajouter une série</Text>
      </Pressable>
    </Card>
  );
}
