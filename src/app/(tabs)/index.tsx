import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, Section } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { formatElapsed } from '@/features/sessions/logic';
import { useActiveSession, useStartableWorkouts } from '@/features/sessions/queries';
import { openSession, startAndOpenSession } from '@/features/sessions/start';
import { useThemeColors } from '@/lib/theme';
import { useNow } from '@/lib/use-now';

export default function WorkoutScreen() {
  const colors = useThemeColors();
  const active = useActiveSession();
  const programs = useStartableWorkouts();

  return (
    <Screen
      title="Séance"
      action={
        <Link href="/settings" asChild>
          <Pressable accessibilityLabel="Réglages" hitSlop={8} className="p-1">
            <Icon name={{ ios: 'gearshape', android: 'settings' }} color={colors.muted} />
          </Pressable>
        </Link>
      }>
      {active ? (
        <ActiveSessionCard id={active.id} name={active.name} startedAt={active.startedAt} />
      ) : (
        <>
          <Button label="Démarrer une séance libre" onPress={() => startAndOpenSession(null)} />

          {programs.length === 0 ? (
            <EmptyState
              title="Aucun programme"
              description="Crée un programme pour démarrer tes séances en un geste."
            />
          ) : (
            programs.map((program) => (
              <Section key={program.id} title={program.name}>
                {program.workouts.map((workout) => (
                  <Pressable
                    key={workout.id}
                    onPress={() => startAndOpenSession(workout.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Démarrer ${workout.name}`}
                    className="flex-row items-center justify-between rounded-2xl border border-border bg-surface p-4 active:opacity-80">
                    <Text className="text-base font-semibold text-foreground">{workout.name}</Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-sm font-semibold text-primary">Démarrer</Text>
                      <Icon
                        name={{ ios: 'play.fill', android: 'play_arrow' }}
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                  </Pressable>
                ))}
              </Section>
            ))
          )}
        </>
      )}
    </Screen>
  );
}

function ActiveSessionCard({ id, name, startedAt }: { id: number; name: string; startedAt: Date }) {
  const now = useNow(1000);
  const elapsed = Math.max(0, Math.floor((now - startedAt.getTime()) / 1000));

  return (
    <Card>
      <Text className="text-sm font-medium tracking-wide text-primary uppercase">
        Séance en cours
      </Text>
      <View className="flex-row items-baseline justify-between">
        <Text className="text-xl font-bold text-foreground">{name}</Text>
        <Text className="text-base text-muted" style={{ fontVariant: ['tabular-nums'] }}>
          {formatElapsed(elapsed)}
        </Text>
      </View>
      <Button label="Reprendre la séance" onPress={() => openSession(id)} />
    </Card>
  );
}
