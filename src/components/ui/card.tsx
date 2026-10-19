import type { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

export function Card({ children }: PropsWithChildren) {
  return <View className="gap-3 rounded-2xl border border-border bg-surface p-4">{children}</View>;
}

/** Titled group of content on a page. */
export function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium tracking-wide text-muted uppercase">{title}</Text>
      {children}
    </View>
  );
}
