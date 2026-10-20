import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { DragHandle } from '@/components/ui/sortable-list';
import { ExerciseThumbnail } from '@/features/exercises/components/exercise-thumbnail';
import { RestPresets } from '@/features/programs/components/rest-presets';
import { DEFAULT_REST_SECONDS, formatDuration, setBadges } from '@/features/programs/sets';

import { previousFor } from '../logic';
import {
  addSessionSet,
  removeLastPendingSet,
  removeSessionExercise,
  setSessionExerciseRest,
} from '../mutations';
import type { SessionExerciseDetail } from '../queries';
import { SessionSetRow } from './session-set-row';

const VALUE_COLUMNS = {
  weight_reps: ['Kg', 'Reps'],
  bodyweight_reps: ['Reps'],
  duration: ['Secondes'],
  distance: ['Secondes'],
} as const;

type SessionExerciseCardProps = {
  item: SessionExerciseDetail;
  onSetCompleted: (item: SessionExerciseDetail) => void;
};

/** Rendered inside a SortableList: the handle on the left reorders the card. */
export function SessionExerciseCard({ item, onSetCompleted }: SessionExerciseCardProps) {
  const { exercise, sets, previous } = item;
  const [restOpen, setRestOpen] = useState(false);
  const badges = setBadges(sets.map((set) => set.type));
  const doneCount = sets.filter((set) => set.completedAt != null).length;
  const hasPendingSet = doneCount < sets.length;

  const confirmRemove = () => {
    if (doneCount === 0) {
      removeSessionExercise(item.id);
      return;
    }
    Alert.alert('Retirer cet exercice ?', 'Ses séries validées seront supprimées.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: () => removeSessionExercise(item.id) },
    ]);
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
          onPress={confirmRemove}
        />
      </View>

      <View className="flex-row items-center justify-between gap-3">
        <Pressable
          onPress={() => setRestOpen((open) => !open)}
          accessibilityRole="button"
          accessibilityState={{ expanded: restOpen }}
          hitSlop={6}>
          <Text className="text-sm text-muted">
            Repos{' '}
            <Text className="font-semibold text-foreground">
              {formatDuration(item.restSeconds ?? DEFAULT_REST_SECONDS)}
            </Text>
          </Text>
        </Pressable>
        {item.target ? (
          <Text className="shrink text-sm text-muted" numberOfLines={1}>
            Objectif <Text className="font-semibold text-foreground">{item.target}</Text>
          </Text>
        ) : null}
      </View>

      {restOpen ? (
        <RestPresets
          restSeconds={item.restSeconds}
          onChange={(restSeconds) => {
            setSessionExerciseRest(item.id, restSeconds);
            setRestOpen(false);
          }}
        />
      ) : null}

      <View className="gap-1.5">
        <View className="flex-row items-center gap-2 px-1">
          <Text className="w-9 text-center text-xs text-muted">Série</Text>
          <Text className="w-16 text-center text-xs text-muted">Précédent</Text>
          {VALUE_COLUMNS[exercise.trackingType].map((column) => (
            <Text key={column} className="flex-1 text-center text-xs text-muted">
              {column}
            </Text>
          ))}
          <View className="w-10" />
        </View>
        {sets.map((set, index) => (
          <SessionSetRow
            key={set.id}
            set={set}
            badge={badges[index]}
            trackingType={exercise.trackingType}
            previous={previousFor(previous, index)}
            onCompleted={() => onSetCompleted(item)}
          />
        ))}
      </View>

      <View className="flex-row gap-2">
        <Pressable
          onPress={() => addSessionSet(item.id)}
          accessibilityRole="button"
          className="flex-1 items-center rounded-lg bg-surface-muted py-2 active:opacity-80">
          <Text className="text-sm font-semibold text-foreground">+ Série</Text>
        </Pressable>
        <Pressable
          onPress={() => removeLastPendingSet(item.id)}
          disabled={!hasPendingSet}
          accessibilityRole="button"
          className={`flex-1 items-center rounded-lg bg-surface-muted py-2 active:opacity-80 ${
            hasPendingSet ? '' : 'opacity-40'
          }`}>
          <Text className="text-sm font-semibold text-foreground">− Série</Text>
        </Pressable>
      </View>
    </Card>
  );
}
