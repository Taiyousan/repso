import type { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

const TONES = {
  default: 'border-border bg-surface',
  success: 'border-success bg-surface',
};

export function Card({
  children,
  tone = 'default',
}: PropsWithChildren<{ tone?: keyof typeof TONES }>) {
  return <View className={`gap-3 rounded-2xl border p-4 ${TONES[tone]}`}>{children}</View>;
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
