import { router, useIsFocused } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, Section } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { ListRow } from '@/components/ui/list-row';
import { PressableCard } from '@/components/ui/pressable-card';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { muscleLabel } from '@/features/exercises/labels';
import { formatElapsed, nextWorkout } from '@/features/sessions/logic';
import { useActiveSession, useHomeWorkouts } from '@/features/sessions/queries';
import { openSession, startAndOpenSession } from '@/features/sessions/start';
import { formatDay } from '@/lib/dates';
import { useThemeColors } from '@/lib/theme';
import { useNow } from '@/lib/use-now';

type Workout = ReturnType<typeof useHomeWorkouts>['programs'][number]['workouts'][number];

const openWorkout = (id: number) => router.push({ pathname: '/workouts/[id]', params: { id } });

const workoutDetails = (workout: Workout) =>
  `${workout.exerciseCount} exercice${workout.exerciseCount > 1 ? 's' : ''}${
    workout.muscles.length > 0 ? ` · ${workout.muscles.map(muscleLabel).join(', ')}` : ''
  }`;

export default function HomeScreen() {
  const active = useActiveSession();
  const { programs, last } = useHomeWorkouts();
  const next = nextWorkout(programs, last?.templateId ?? null);

  return (
    <Screen
      title="Accueil"
      action={
        <IconButton
          icon={{ ios: 'gearshape', android: 'settings' }}
          label="Réglages"
          onPress={() => router.push('/settings')}
        />
      }>
      {active ? (
        <ActiveSessionCard id={active.id} name={active.name} startedAt={active.startedAt} />
      ) : next ? (
        <NextWorkoutCard
          workout={next.workout}
          programName={next.program.name}
          after={last ? `après ${last.name}, ${formatDay(last.startedAt)}` : null}
        />
      ) : null}

      {programs.length === 0 ? (
        <View className="gap-3">
          <EmptyState
            title="Aucun programme"
            description="Crée un programme pour retrouver tes séances ici, prêtes à démarrer."
          />
          <Button
            label="Créer un programme"
            variant="secondary"
            onPress={() => router.push('/programs/new')}
          />
        </View>
      ) : (
        programs.map((program) => (
          <Section key={program.id} title={program.name}>
            {program.workouts.map((workout) => (
              <ListRow
                key={workout.id}
                title={workout.name}
                details={[workoutDetails(workout)]}
                onPress={() => openWorkout(workout.id)}
              />
            ))}
          </Section>
        ))
      )}

      {active ? null : (
        <View className="gap-1.5 pt-2">
          <Button
            label="Entraînement libre"
            variant="secondary"
            onPress={() => startAndOpenSession(null)}
          />
          <Text className="text-center text-sm text-muted">
            Sans séance prévue : tu ajoutes les exercices au fur et à mesure.
          </Text>
        </View>
      )}
    </Screen>
  );
}

/** The workout after the last one done, in yellow: the obvious thing to open. */
function NextWorkoutCard({
  workout,
  programName,
  after,
}: {
  workout: Workout;
  programName: string;
  after: string | null;
}) {
  const colors = useThemeColors();

  return (
    <PressableCard
      onPress={() => openWorkout(workout.id)}
      accessibilityLabel={`${after ? 'À suivre' : 'Pour commencer'} : ${workout.name}`}
      selected
      className="gap-1.5 p-4">
      <View className="self-start rounded-full bg-foreground px-2.5 py-1">
        <Text className="text-xs font-bold text-primary">
          {after ? 'À SUIVRE' : 'POUR COMMENCER'}
        </Text>
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <Text className="shrink font-display text-4xl font-extrabold text-foreground">
          {workout.name}
        </Text>
        <Icon name={{ ios: 'arrow.right', android: 'arrow_forward' }} color={colors.foreground} />
      </View>
      <Text className="text-sm font-semibold text-foreground">
        {programName} · {workoutDetails(workout)}
      </Text>
      {after ? <Text className="text-sm text-foreground">{after}</Text> : null}
    </PressableCard>
  );
}

function ActiveSessionCard({ id, name, startedAt }: { id: number; name: string; startedAt: Date }) {
  // Tabs stay mounted: the clock only ticks on the one shown.
  const now = useNow(1000, useIsFocused());
  const elapsed = Math.max(0, Math.floor((now - startedAt.getTime()) / 1000));

  return (
    <Card>
      <Text className="font-display text-sm font-bold text-foreground">Entraînement en cours</Text>
      <View className="flex-row items-baseline justify-between">
        <Text className="text-xl font-bold text-foreground">{name}</Text>
        <Text className="text-base text-muted" style={{ fontVariant: ['tabular-nums'] }}>
          {formatElapsed(elapsed)}
        </Text>
      </View>
      <Button label="Reprendre l’entraînement" onPress={() => openSession(id)} />
    </Card>
  );
}
