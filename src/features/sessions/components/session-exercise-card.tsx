import { Link } from 'expo-router';
import { memo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { recordSetIds } from '@/domain/records';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { raised } from '@/components/ui/raised';
import { SmallButton } from '@/components/ui/small-button';
import { DragHandle } from '@/components/ui/sortable-list';
import { Text } from '@/components/ui/text';
import { ExerciseThumbnail } from '@/features/exercises/components/exercise-thumbnail';
import { RestPresets } from '@/features/programs/components/rest-presets';
import { DEFAULT_REST_SECONDS, formatDuration, setBadges } from '@/features/programs/sets';
import { useThemeColors } from '@/lib/theme';

import { isExerciseComplete, previousFor } from '../logic';
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

/**
 * Rendered inside a SortableList: the handle on the left reorders the card. Memoized: a validated
 * set only renders its own card again, the live read keeping the other items as they were.
 */
export const SessionExerciseCard = memo(function SessionExerciseCard({
  item,
  onSetCompleted,
}: SessionExerciseCardProps) {
  const { exercise, sets, previous } = item;
  const colors = useThemeColors();
  const [restOpen, setRestOpen] = useState(false);
  const badges = setBadges(sets.map((set) => set.type));
  // Validated sets only: an unvalidated one can already carry values typed then left alone.
  const records = recordSetIds(
    sets.filter((set) => set.completedAt != null),
    item.records,
    exercise.trackingType,
  );
  const doneCount = sets.filter((set) => set.completedAt != null).length;
  const hasPendingSet = doneCount < sets.length;
  const isComplete = isExerciseComplete(sets);
  // A finished exercise folds into one line; it can be reopened.
  const [expanded, setExpanded] = useState(!isComplete);

  const handleSetCompleted = () => {
    if (doneCount === sets.length - 1) setExpanded(false); // that was the last set
    onSetCompleted(item);
  };

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

  if (isComplete && !expanded) {
    return (
      <Pressable
        onPress={() => setExpanded(true)}
        accessibilityRole="button"
        accessibilityLabel={`${exercise.name}, terminé. Toucher pour afficher les séries`}
        style={({ pressed }) => [{ borderWidth: 2 }, raised(pressed, colors.ink)]}
        className="flex-row items-center gap-2 rounded-2xl border-ink bg-success-soft p-3">
        <DragHandle label={`Déplacer ${exercise.name}`} />
        <Icon
          name={{ ios: 'checkmark.circle.fill', android: 'check_circle' }}
          color={colors.foreground}
        />
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground" numberOfLines={1}>
            {exercise.name}
          </Text>
          <Text className="text-sm text-foreground" numberOfLines={1}>
            {sets.length} série{sets.length > 1 ? 's' : ''}
          </Text>
        </View>
        <Icon name={{ ios: 'chevron.down', android: 'expand_more' }} color={colors.foreground} />
      </Pressable>
    );
  }

  return (
    <Card tone={isComplete ? 'success' : 'default'}>
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
        {isComplete ? (
          <IconButton
            icon={{ ios: 'chevron.up', android: 'expand_less' }}
            label="Réduire"
            onPress={() => setExpanded(false)}
          />
        ) : null}
        <IconButton
          icon={{ ios: 'trash', android: 'delete' }}
          label="Retirer l'exercice"
          tone="danger"
          onPress={confirmRemove}
        />
      </View>

      <View className="flex-row items-center justify-between gap-3">
        <SmallButton
          label={`Repos ${formatDuration(item.restSeconds ?? DEFAULT_REST_SECONDS)}`}
          onPress={() => setRestOpen((open) => !open)}
          accessibilityState={{ expanded: restOpen }}
        />
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
          {/* Room for the play button of timed sets, then the check button. */}
          {exercise.trackingType === 'duration' || exercise.trackingType === 'distance' ? (
            <View style={{ width: 40 }} />
          ) : null}
          <View style={{ width: 40 }} />
        </View>
        {sets.map((set, index) => (
          <SessionSetRow
            key={set.id}
            set={set}
            exerciseName={exercise.name}
            badge={badges[index]}
            trackingType={exercise.trackingType}
            previous={previousFor(previous, index)}
            isRecord={records.has(set.id)}
            onCompleted={handleSetCompleted}
          />
        ))}
      </View>

      <View className="flex-row gap-3">
        <SmallButton label="+ Série" onPress={() => addSessionSet(item.id)} grow />
        <SmallButton
          label="− Série"
          onPress={() => removeLastPendingSet(item.id)}
          disabled={!hasPendingSet}
          grow
        />
      </View>
    </Card>
  );
});
