import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { WorkoutEditor } from '@/features/programs/components/workout-editor';
import { useWorkoutTemplate } from '@/features/programs/queries';

/** Creation of a workout from its draft (see createDraftWorkoutTemplate). */
export default function NewWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useWorkoutTemplate(Number(id));

  if (!workout) {
    return (
      <View className="flex-1 bg-background p-4">
        <EmptyState title="Séance introuvable" />
      </View>
    );
  }

  return <WorkoutEditor key={workout.id} workout={workout} mode="create" />;
}
