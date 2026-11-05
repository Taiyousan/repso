import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Section } from '@/components/ui/card';
import { ListGroup } from '@/components/ui/list-group';
import { ListRow } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { logPastSession } from '@/features/sessions/mutations';
import { useHomeWorkouts } from '@/features/sessions/queries';

const DEFAULT_MINUTES = 60;

/** Creates the workout, ended an hour ago, and opens its editor above its recap. */
function logWorkout(templateId: number | null) {
  const step = 5 * 60_000;
  const startedAt = new Date(Math.floor((Date.now() - 2 * DEFAULT_MINUTES * 60_000) / step) * step);
  const endedAt = new Date(startedAt.getTime() + DEFAULT_MINUTES * 60_000);
  const id = logPastSession(templateId, startedAt, endedAt);
  router.replace({ pathname: '/session/[id]', params: { id } });
  router.push({ pathname: '/session/edit/[id]', params: { id } });
}

/** Adds a workout done without the app: pick what was done, then fill it in. */
export default function LogSessionScreen() {
  const insets = useSafeAreaInsets();
  const { programs } = useHomeWorkouts();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ gap: 24, padding: 16, paddingBottom: insets.bottom + 16 }}>
      <Text className="text-sm text-muted">
        Choisis ce que tu as fait. Tu régleras ensuite la date, l’heure et les séries.
      </Text>
      <ListGroup>
        <ListRow
          title="Entraînement libre"
          details={['Sans séance, tu ajoutes les exercices']}
          onPress={() => logWorkout(null)}
          flat
        />
      </ListGroup>
      {programs.map((program) =>
        program.workouts.length === 0 ? null : (
          <Section key={program.id} title={program.name}>
            <ListGroup>
              {program.workouts.map((workout) => (
                <ListRow
                  key={workout.id}
                  title={workout.name}
                  details={[
                    `${workout.exerciseCount} exercice${workout.exerciseCount > 1 ? 's' : ''}`,
                  ]}
                  onPress={() => logWorkout(workout.id)}
                  flat
                />
              ))}
            </ListGroup>
          </Section>
        ),
      )}
    </ScrollView>
  );
}
