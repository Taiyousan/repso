import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, Section } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { PressableCard } from '@/components/ui/pressable-card';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
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
                  <PressableCard
                    key={workout.id}
                    onPress={() => startAndOpenSession(workout.id)}
                    accessibilityLabel={`Démarrer ${workout.name}`}
                    className="flex-row items-center justify-between p-4">
                    <Text className="text-base font-semibold text-foreground">{workout.name}</Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-sm font-bold text-foreground">Démarrer</Text>
                      <Icon
                        name={{ ios: 'play.fill', android: 'play_arrow' }}
                        size={20}
                        color={colors.foreground}
                      />
                    </View>
                  </PressableCard>
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
      <Text className="font-display text-sm font-bold text-foreground">Séance en cours</Text>
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
