import { useLocalSearchParams } from 'expo-router';

import { TagSelector } from '@/features/sessions/components/tag-picker';

export default function SessionTagsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TagSelector sessionId={Number(id)} />;
}
