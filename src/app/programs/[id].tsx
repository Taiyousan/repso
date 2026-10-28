import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { DragHandle, SortableList } from '@/components/ui/sortable-list';
import { muscleLabel } from '@/features/exercises/labels';
import { createDraftWorkoutTemplate, reorderWorkoutTemplates } from '@/features/programs/mutations';
import { useProgram } from '@/features/programs/queries';
import { exportProgramToFile } from '@/features/programs/transfer/actions';
import { useThemeColors } from '@/lib/theme';

export default function ProgramScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const programId = Number(id);
  const program = useProgram(programId);
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  if (!program) {
    return (
      <View className="flex-1 bg-background p-4">
        <Stack.Screen options={{ title: '' }} />
        <EmptyState title="Programme introuvable" />
      </View>
    );
  }

  const addWorkout = () => {
    const workoutId = createDraftWorkoutTemplate(programId);
    router.push({ pathname: '/workouts/new/[id]', params: { id: workoutId } });
  };

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ gap: 20, padding: 16, paddingBottom: insets.bottom + 16 }}>
      <Stack.Screen
        options={{
          title: program.name,
          headerRight: () => (
            <Link href={{ pathname: '/programs/edit/[id]', params: { id: programId } }} asChild>
              <Pressable hitSlop={8}>
                <Text className="text-base font-semibold text-primary">Modifier</Text>
              </Pressable>
            </Link>
          ),
        }}
      />

      {program.description ? (
        <Text className="text-base text-muted">{program.description}</Text>
      ) : null}

      <Section title="Séances">
        {program.workouts.length === 0 ? (
          <EmptyState
            title="Aucune séance"
            description="Ajoute les séances de ce programme, par exemple Push, Pull et Legs."
          />
        ) : (
          <SortableList
            data={program.workouts}
            keyExtractor={(workout) => String(workout.id)}
            onReorder={(keys) => reorderWorkoutTemplates(keys.map(Number))}
            scrollableRef={scrollRef}
            renderItem={(workout) => (
              <View className="flex-row items-center rounded-2xl border border-border bg-surface pl-2">
                <DragHandle label={`Déplacer ${workout.name}`} />
                <Link href={{ pathname: '/workouts/[id]', params: { id: workout.id } }} asChild>
                  <Pressable className="flex-1 gap-1 p-4 pl-2 active:opacity-80">
                    <Text className="text-base font-semibold text-foreground">{workout.name}</Text>
                    <Text className="text-sm text-muted">
                      {workout.exerciseCount} exercice{workout.exerciseCount > 1 ? 's' : ''}
                    </Text>
                    {workout.muscles.length > 0 ? (
                      <Text className="text-sm text-muted" numberOfLines={1}>
                        {workout.muscles.map(muscleLabel).join(', ')}
                      </Text>
                    ) : null}
                  </Pressable>
                </Link>
              </View>
            )}
          />
        )}
      </Section>

      <View className="gap-3">
        <Button label="Ajouter une séance" onPress={addWorkout} />
        {program.workouts.length > 0 ? (
          <Button
            label="Exporter le programme"
            variant="secondary"
            onPress={() => exportProgramToFile(programId)}
          />
        ) : null}
      </View>
    </Animated.ScrollView>
  );
}
