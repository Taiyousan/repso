import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { SessionEditor } from '@/features/sessions/components/session-editor';
import { useSession } from '@/features/sessions/queries';

export default function EditSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession(Number(id));

  // The workout in progress is changed on its own screen.
  if (!session?.endedAt) {
    return (
      <View className="flex-1 bg-background p-4">
        <EmptyState title="Entraînement introuvable" />
      </View>
    );
  }

  return <SessionEditor session={session} />;
}
