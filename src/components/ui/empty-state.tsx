import { Text, View } from 'react-native';

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View className="items-center gap-1 rounded-2xl border border-border bg-surface px-6 py-10">
      <Text className="text-base font-semibold text-foreground">{title}</Text>
      {description ? <Text className="text-center text-muted">{description}</Text> : null}
    </View>
  );
}
