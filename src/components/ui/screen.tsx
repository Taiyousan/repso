import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';

type ScreenProps = PropsWithChildren<{
  title: string;
  /** Rendered next to the title (e.g. a settings button). */
  action?: ReactNode;
  /** Set to false when the content brings its own list (e.g. FlashList). */
  scrollable?: boolean;
}>;

/** Base layout of a top-level screen: safe area, large title, content. */
export function Screen({ title, action, scrollable = true, children }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const heading = (
    <View className="flex-row items-center justify-between pt-4">
      <Text className="font-display text-3xl font-extrabold text-foreground">{title}</Text>
      {action}
    </View>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {scrollable ? (
        <ScrollView contentContainerClassName="gap-4 px-4 pb-8">
          {heading}
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1 gap-3">
          <View className="px-4">{heading}</View>
          {children}
        </View>
      )}
    </View>
  );
}
