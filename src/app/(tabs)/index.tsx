import { router, useIsFocused } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, Section } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { ListGroup } from '@/components/ui/list-group';
import { ListRow } from '@/components/ui/list-row';
import { PressableCard } from '@/components/ui/pressable-card';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useLastBackup } from '@/features/backup/data';
import { isBackupDue } from '@/features/backup/format';
import { HomeHeader } from '@/features/sessions/components/home-header';
import { formatElapsed, nextWorkout } from '@/features/sessions/logic';
import { useActiveSession, useHomeWorkouts } from '@/features/sessions/queries';
import { openSession, startAndOpenSession } from '@/features/sessions/start';
import { formatDay, formatDurationLong, formatShortDay } from '@/lib/dates';
import { useThemeColors } from '@/lib/theme';
import { useNow } from '@/lib/use-now';

type Workout = ReturnType<typeof useHomeWorkouts>['programs'][number]['workouts'][number];

const openWorkout = (id: number) => router.push({ pathname: '/workouts/[id]', params: { id } });

const exerciseCount = (workout: Workout) =>
  `${workout.exerciseCount} exercice${workout.exerciseCount > 1 ? 's' : ''}`;

export default function HomeScreen() {
  const active = useActiveSession();
  const { programs, last, latest, trainedDates } = useHomeWorkouts();
  const next = nextWorkout(programs, last?.templateId ?? null);
  const lastBackup = useLastBackup();

  return (
    <Screen
      title="Accueil"
      hero={
        <HomeHeader trainedDates={trainedDates}>
          {active ? (
            <ActiveSessionCard id={active.id} name={active.name} startedAt={active.startedAt} />
          ) : next ? (
            <NextWorkoutCard
              workout={next.workout}
              programName={next.program.name}
              after={last ? `après ${last.name}, ${formatDay(last.startedAt)}` : null}
            />
          ) : null}
        </HomeHeader>
      }>
      {programs.length === 0 ? (
        <View className="gap-3">
          <EmptyState
            title="Aucun programme"
            description="Choisis un programme suggéré ou crée le tien pour retrouver tes séances ici, prêtes à démarrer."
          />
          <Button
            label="Voir les programmes suggérés"
            onPress={() => router.push('/programs/suggested')}
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
            <ListGroup>
              {program.workouts.map((workout) => (
                <ListRow
                  key={workout.id}
                  flat
                  title={workout.name}
                  trailing={`${workout.exerciseCount} exos`}
                  onPress={() => openWorkout(workout.id)}
                />
              ))}
            </ListGroup>
          </Section>
        ))
      )}

      {latest ? (
        <Section title="Dernier entraînement">
          <ListGroup>
            <ListRow
              flat
              title={latest.name}
              details={[
                `${formatDay(latest.startedAt)} · ${formatDurationLong(
                  latest.endedAt!.getTime() - latest.startedAt.getTime(),
                )}`,
              ]}
              onPress={() => openSession(latest.id)}
            />
          </ListGroup>
        </Section>
      ) : null}

      {isBackupDue(lastBackup, latest?.startedAt ?? null) ? (
        <ListGroup>
          <ListRow
            flat
            title="Pense à sauvegarder"
            details={[
              lastBackup
                ? `Dernière sauvegarde : ${formatShortDay(lastBackup)}`
                : 'Aucune sauvegarde pour l’instant',
            ]}
            onPress={() => router.push('/settings')}
          />
        </ListGroup>
      ) : null}

      {active ? null : (
        <Button
          label="+ Entraînement libre"
          variant="secondary"
          onPress={() => startAndOpenSession(null)}
        />
      )}
    </Screen>
  );
}

/** The workout after the last one done, white on the blue header: the obvious thing to open. */
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
      inverse
      className="flex-row items-center gap-3 px-4 py-3.5">
      <View className="flex-1">
        <Text className="text-sm font-bold text-primary">
          {after ? 'À suivre' : 'Pour commencer'}
        </Text>
        <Text className="font-display text-4xl font-extrabold text-foreground">{workout.name}</Text>
        <Text className="text-[13px] font-semibold text-muted">
          {programName} · {exerciseCount(workout)}
        </Text>
      </View>
      <View
        style={{ width: 36, height: 36 }}
        className="items-center justify-center rounded-full bg-primary">
        <Icon
          name={{ ios: 'arrow.right', android: 'arrow_forward' }}
          size={18}
          color={colors.surface}
        />
      </View>
    </PressableCard>
  );
}

function ActiveSessionCard({ id, name, startedAt }: { id: number; name: string; startedAt: Date }) {
  // Tabs stay mounted: the clock only ticks on the one shown.
  const now = useNow(1000, useIsFocused());
  const elapsed = Math.max(0, Math.floor((now - startedAt.getTime()) / 1000));

  return (
    <Card>
      <Text className="font-display text-base font-bold text-foreground">
        Entraînement en cours
      </Text>
      <View className="flex-row items-baseline justify-between">
        <Text className="text-lg font-bold text-foreground">{name}</Text>
        <Text className="text-sm text-muted" style={{ fontVariant: ['tabular-nums'] }}>
          {formatElapsed(elapsed)}
        </Text>
      </View>
      <Button label="Reprendre l’entraînement" onPress={() => openSession(id)} />
    </Card>
  );
}
