import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { WorkoutPreview } from '@/features/programs/components/workout-preview';
import { useWorkoutTemplate } from '@/features/programs/queries';

export default function WorkoutScreen() {
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

  return <WorkoutPreview workout={workout} />;
}
