import { View } from 'react-native';

import { Text } from '@/components/ui/text';

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View
      style={{ borderWidth: 2, borderStyle: 'dashed' }}
      className="items-center gap-1 rounded-2xl border-ink px-6 py-10">
      <Text className="font-display text-base font-bold text-foreground">{title}</Text>
      {description ? <Text className="text-center text-muted">{description}</Text> : null}
    </View>
  );
}
