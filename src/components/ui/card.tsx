import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

const TONES = {
  default: 'bg-surface',
  success: 'bg-success-soft',
};

/** A container: ink outline, no shadow (shadows are for what can be tapped). */
export function Card({
  children,
  tone = 'default',
}: PropsWithChildren<{ tone?: keyof typeof TONES }>) {
  return (
    <View style={{ borderWidth: 2 }} className={`gap-3 rounded-2xl border-ink p-4 ${TONES[tone]}`}>
      {children}
    </View>
  );
}

/** Titled group of content on a page. */
export function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View className="gap-2">
      <Text className="font-display text-sm font-bold text-foreground">{title}</Text>
      {children}
    </View>
  );
}
