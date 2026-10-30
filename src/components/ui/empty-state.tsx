import { View } from 'react-native';

import { Text } from '@/components/ui/text';

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View
      style={{ borderWidth: 1.5, borderStyle: 'dashed' }}
      className="items-center gap-1 rounded-2xl border-edge px-6 py-8">
      <Text className="font-display text-base font-bold text-foreground">{title}</Text>
      {description ? <Text className="text-center text-muted">{description}</Text> : null}
    </View>
  );
}
