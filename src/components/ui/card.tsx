import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

const TONES = {
  default: 'bg-surface',
  success: 'bg-success-faint',
};

/** A container: thin light outline, no bottom edge. */
export function Card({
  children,
  tone = 'default',
}: PropsWithChildren<{ tone?: keyof typeof TONES }>) {
  return (
    <View className={`gap-3 rounded-2xl border border-outline p-4 ${TONES[tone]}`}>{children}</View>
  );
}

/** Titled group of content on a page. */
export function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View className="gap-2.5">
      <Text className="font-display text-base font-bold text-foreground">{title}</Text>
      {children}
    </View>
  );
}
