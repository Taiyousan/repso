import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

const TONES = {
  default: 'bg-surface',
  success: 'bg-success-faint',
};

/** A container: thin outline, no bottom edge (the edge is for what can be tapped). */
export function Card({
  children,
  tone = 'default',
}: PropsWithChildren<{ tone?: keyof typeof TONES }>) {
  return (
    <View
      style={{ borderWidth: 1.5 }}
      className={`gap-2 rounded-2xl border-edge p-3 ${TONES[tone]}`}>
      {children}
    </View>
  );
}

/** Titled group of content on a page. */
export function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View className="gap-2">
      <Text className="font-display text-base font-bold text-foreground">{title}</Text>
      {children}
    </View>
  );
}
