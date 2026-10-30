import { router, Stack } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { HeaderButton } from '@/components/ui/header-button';
import { ListGroup } from '@/components/ui/list-group';
import { ListRow } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { isWorkingSet } from '@/domain/volume';
import { ExerciseThumbnail } from '@/features/exercises/components/exercise-thumbnail';
import { muscleLabel } from '@/features/exercises/labels';
import { bestSet, formatPerformance, type SetPerformance } from '@/features/sessions/logic';
import { useWorkoutHistory } from '@/features/sessions/queries';
import { startAndOpenSession } from '@/features/sessions/start';
import { formatDay } from '@/lib/dates';

import type { TemplateExerciseDetail, WorkoutTemplateDetail } from '../queries';
import { DEFAULT_REST_SECONDS, formatDuration, mainMuscles } from '../sets';

/** A workout as read before training: nothing here changes it, "Modifier" opens the editor. */
export function WorkoutPreview({ workout }: { workout: WorkoutTemplateDetail }) {
  const { lastDoneAt, previous } = useWorkoutHistory(
    workout.id,
    workout.exercises.map((item) => item.exercise.id),
  );
  const count = workout.exercises.length;
  const muscles = mainMuscles(workout.exercises.map((item) => item.exercise));

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <HeaderButton
              label="Modifier"
              onPress={() =>
                router.push({ pathname: '/workouts/edit/[id]', params: { id: workout.id } })
              }
            />
          ),
        }}
      />
      <ScrollView contentContainerClassName="gap-3 p-4">
        <View className="gap-0.5">
          <Text className="font-display text-[26px] font-extrabold text-foreground">
            {workout.name}
          </Text>
          <Text className="text-[13px] text-muted">
            {[
              `Programme ${workout.programName}`,
              `${count} exercice${count > 1 ? 's' : ''}`,
              lastDoneAt ? `fait le ${formatDay(lastDoneAt)}` : 'jamais faite',
            ].join(' · ')}
          </Text>
        </View>

        {muscles.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {muscles.map((muscle) => (
              <Chip key={muscle} label={muscleLabel(muscle)} />
            ))}
          </View>
        ) : null}

        {count === 0 ? (
          <EmptyState
            title="Aucun exercice"
            description="Passe en mode Modifier pour ajouter les exercices de cette séance."
          />
        ) : (
          <ListGroup>
            {workout.exercises.map((item) => (
              <ExerciseRow key={item.id} item={item} previous={previous.get(item.exercise.id)} />
            ))}
          </ListGroup>
        )}
      </ScrollView>

      <ActionBar>
        <Button
          label="Démarrer l’entraînement"
          onPress={() => startAndOpenSession(workout.id)}
          disabled={count === 0}
        />
      </ActionBar>
    </View>
  );
}

function ExerciseRow({
  item,
  previous = [],
}: {
  item: TemplateExerciseDetail;
  previous?: SetPerformance[];
}) {
  const { exercise } = item;
  const best = bestSet(previous.filter(isWorkingSet), exercise.trackingType);
  const plan = [item.target, `repos ${formatDuration(item.restSeconds ?? DEFAULT_REST_SECONDS)}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <ListRow
      flat
      title={exercise.name}
      details={[plan]}
      trailing={best ? formatPerformance(best, exercise.trackingType) : undefined}
      leading={<ExerciseThumbnail images={exercise.images} name={exercise.name} size={36} />}
      onPress={() => router.push({ pathname: '/exercises/[id]', params: { id: exercise.id } })}
    />
  );
}
