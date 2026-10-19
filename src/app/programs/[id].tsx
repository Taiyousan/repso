import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { TextField } from '@/components/ui/text-field';
import { muscleLabel } from '@/features/exercises/labels';
import { createWorkoutTemplate, moveWorkoutTemplate } from '@/features/programs/mutations';
import { useProgram } from '@/features/programs/queries';

export default function ProgramScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const programId = Number(id);
  const program = useProgram(programId);
  const insets = useSafeAreaInsets();
  const [newWorkoutName, setNewWorkoutName] = useState('');

  if (!program) {
    return (
      <View className="flex-1 bg-background p-4">
        <Stack.Screen options={{ title: '' }} />
        <EmptyState title="Programme introuvable" />
      </View>
    );
  }

  const addWorkout = () => {
    const name = newWorkoutName.trim();
    if (!name) return;
    const workoutId = createWorkoutTemplate(programId, name);
    setNewWorkoutName('');
    router.push({ pathname: '/workouts/[id]', params: { id: workoutId } });
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-5 p-4"
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      keyboardShouldPersistTaps="handled">
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
          program.workouts.map((workout, index) => (
            <View
              key={workout.id}
              className="flex-row items-center rounded-2xl border border-border bg-surface">
              <Link href={{ pathname: '/workouts/[id]', params: { id: workout.id } }} asChild>
                <Pressable className="flex-1 gap-1 p-4 active:opacity-80">
                  <Text className="text-base font-semibold text-foreground">{workout.name}</Text>
                  <Text className="text-sm text-muted">
                    {workout.exerciseCount} exercice{workout.exerciseCount > 1 ? 's' : ''} ·{' '}
                    {workout.setCount} série{workout.setCount > 1 ? 's' : ''}
                  </Text>
                  {workout.muscles.length > 0 ? (
                    <Text className="text-sm text-muted" numberOfLines={1}>
                      {workout.muscles.map(muscleLabel).join(', ')}
                    </Text>
                  ) : null}
                </Pressable>
              </Link>
              <View className="pr-2">
                <IconButton
                  icon={{ ios: 'chevron.up', android: 'keyboard_arrow_up' }}
                  label="Monter la séance"
                  onPress={() => moveWorkoutTemplate(workout.id, 'up')}
                  disabled={index === 0}
                />
                <IconButton
                  icon={{ ios: 'chevron.down', android: 'keyboard_arrow_down' }}
                  label="Descendre la séance"
                  onPress={() => moveWorkoutTemplate(workout.id, 'down')}
                  disabled={index === program.workouts.length - 1}
                />
              </View>
            </View>
          ))
        )}
      </Section>

      <Section title="Nouvelle séance">
        <TextField
          value={newWorkoutName}
          onChangeText={setNewWorkoutName}
          placeholder="Ex. Push, Haut du corps, Séance A"
          returnKeyType="done"
          onSubmitEditing={addWorkout}
        />
        <Button
          label="Ajouter la séance"
          onPress={addWorkout}
          disabled={newWorkoutName.trim().length === 0}
          variant="secondary"
        />
      </Section>
    </ScrollView>
  );
}
