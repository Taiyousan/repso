import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TextField } from '@/components/ui/text-field';
import { TemplateExerciseCard } from '@/features/programs/components/template-exercise-card';
import { deleteWorkoutTemplate, renameWorkoutTemplate } from '@/features/programs/mutations';
import { useWorkoutTemplate, type WorkoutTemplateDetail } from '@/features/programs/queries';

export default function WorkoutTemplateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useWorkoutTemplate(Number(id));

  if (!workout) {
    return (
      <View className="flex-1 bg-background p-4">
        <Stack.Screen options={{ title: '' }} />
        <EmptyState title="Séance introuvable" />
      </View>
    );
  }

  // Keyed so the name field resets if another workout is shown in this screen.
  return <WorkoutTemplateEditor key={workout.id} workout={workout} />;
}

function WorkoutTemplateEditor({ workout }: { workout: WorkoutTemplateDetail }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(workout.name);

  const saveName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== workout.name) renameWorkoutTemplate(workout.id, trimmed);
    else setName(workout.name);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Supprimer cette séance ?',
      'Elle sera retirée du programme. Ton historique de séances est conservé.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteWorkoutTemplate(workout.id);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-background">
      <Stack.Screen options={{ title: workout.name }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <TextField
            label="Nom de la séance"
            value={name}
            onChangeText={setName}
            onEndEditing={saveName}
            returnKeyType="done"
          />
          <Text className="text-sm text-muted">Programme : {workout.programName}</Text>
        </View>

        {workout.exercises.length === 0 ? (
          <EmptyState
            title="Aucun exercice"
            description="Ajoute les exercices de cette séance depuis la bibliothèque."
          />
        ) : (
          workout.exercises.map((item, index) => (
            <TemplateExerciseCard
              key={item.id}
              item={item}
              isFirst={index === 0}
              isLast={index === workout.exercises.length - 1}
            />
          ))
        )}

        <Button
          label="Ajouter des exercices"
          onPress={() =>
            router.push({ pathname: '/workouts/add-exercises/[id]', params: { id: workout.id } })
          }
        />
        <Button label="Supprimer la séance" onPress={confirmDelete} variant="danger" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
