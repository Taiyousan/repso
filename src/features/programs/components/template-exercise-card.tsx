import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { DragHandle } from '@/components/ui/sortable-list';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { ExerciseThumbnail } from '@/features/exercises/components/exercise-thumbnail';

import {
  removeTemplateExercise,
  setTemplateExerciseRest,
  setTemplateExerciseTarget,
} from '../mutations';
import type { TemplateExerciseDetail } from '../queries';
import { DEFAULT_REST_SECONDS, formatDuration } from '../sets';
import { RestPresets } from './rest-presets';

type Panel = 'rest' | 'target' | null;

/** Rendered inside a SortableList: the handle on the left reorders the card. */
export function TemplateExerciseCard({ item }: { item: TemplateExerciseDetail }) {
  const { exercise } = item;
  const [panel, setPanel] = useState<Panel>(null);
  const [target, setTarget] = useState(item.target ?? '');

  const toggle = (next: Exclude<Panel, null>) =>
    setPanel((current) => (current === next ? null : next));

  const saveTarget = () => {
    setTemplateExerciseTarget(item.id, target);
    setPanel(null);
  };

  return (
    <Card>
      <View className="flex-row items-center gap-2">
        <DragHandle label={`Déplacer ${exercise.name}`} />
        <ExerciseThumbnail images={exercise.images} name={exercise.name} />
        <Link href={{ pathname: '/exercises/[id]', params: { id: exercise.id } }} asChild>
          <Pressable className="flex-1 pl-1">
            <Text className="text-base font-semibold text-foreground" numberOfLines={2}>
              {exercise.name}
            </Text>
          </Pressable>
        </Link>
        <IconButton
          icon={{ ios: 'trash', android: 'delete' }}
          label="Retirer l'exercice"
          tone="danger"
          onPress={() => removeTemplateExercise(item.id)}
        />
      </View>

      {/* Settings stay folded into one line; tapping a part opens it below. */}
      <View className="flex-row items-center justify-between gap-3">
        <Pressable
          onPress={() => toggle('rest')}
          accessibilityRole="button"
          accessibilityState={{ expanded: panel === 'rest' }}
          hitSlop={6}>
          <Text className="text-sm text-muted">
            Repos{' '}
            <Text className="font-semibold text-foreground">
              {formatDuration(item.restSeconds ?? DEFAULT_REST_SECONDS)}
            </Text>
            {item.restSeconds == null ? ' (défaut)' : ''}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => toggle('target')}
          accessibilityRole="button"
          accessibilityState={{ expanded: panel === 'target' }}
          hitSlop={6}
          className="shrink">
          {item.target ? (
            <Text className="text-sm text-muted" numberOfLines={1}>
              Objectif <Text className="font-semibold text-foreground">{item.target}</Text>
            </Text>
          ) : (
            <Text className="text-sm font-bold text-foreground underline">+ Objectif</Text>
          )}
        </Pressable>
      </View>

      {panel === 'rest' ? (
        <RestPresets
          restSeconds={item.restSeconds}
          onChange={(restSeconds) => {
            setTemplateExerciseRest(item.id, restSeconds);
            setPanel(null);
          }}
        />
      ) : null}

      {panel === 'target' ? (
        <TextField
          value={target}
          onChangeText={setTarget}
          placeholder="Ex. 4 × 8-10, RPE 8, 3 × max"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={saveTarget}
          onEndEditing={saveTarget}
        />
      ) : null}
    </Card>
  );
}
