import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';

type ScreenProps = PropsWithChildren<{
  title: string;
  /** Rendered next to the title (e.g. a settings button). */
  action?: ReactNode;
  /** Pinned above the title, outside the scroll (e.g. the running workout). */
  banner?: ReactNode;
  /**
   * Full-width blue header replacing the title, under a blue status bar (the home screen). It
   * brings its own title.
   */
  hero?: ReactNode;
  /** Set to false when the content brings its own list (e.g. FlashList). */
  scrollable?: boolean;
}>;

/** Base layout of a top-level screen: safe area, large title, content. */
export function Screen({ title, action, banner, hero, scrollable = true, children }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const heading = (
    <View className="flex-row items-center justify-between pt-4">
      <Text className="font-display text-3xl font-extrabold text-foreground">{title}</Text>
      {action}
    </View>
  );

  if (hero) {
    return (
      <View className="flex-1 bg-background">
        <View className="bg-primary" style={{ height: insets.top }} />
        {banner}
        <ScrollView contentContainerClassName="gap-6 pb-10">
          {hero}
          <View className="gap-6 px-4">{children}</View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {banner}
      {scrollable ? (
        <ScrollView contentContainerClassName="gap-6 px-4 pb-10">
          {heading}
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1 gap-4">
          <View className="px-4">{heading}</View>
          {children}
        </View>
      )}
    </View>
  );
}
