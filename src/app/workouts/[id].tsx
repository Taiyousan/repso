import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { WorkoutEditor } from '@/features/programs/components/workout-editor';
import { useWorkoutTemplate } from '@/features/programs/queries';

export default function EditWorkoutScreen() {
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

  return (
    <>
      <Stack.Screen options={{ title: workout.name }} />
      <WorkoutEditor key={workout.id} workout={workout} mode="edit" />
    </>
  );
}
