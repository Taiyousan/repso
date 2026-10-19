import type { PropsWithChildren } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = PropsWithChildren<{
  title: string;
  /** Set to false when the content brings its own list (e.g. FlashList). */
  scrollable?: boolean;
}>;

/** Base layout of a top-level screen: safe area, large title, content. */
export function Screen({ title, scrollable = true, children }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const heading = <Text className="pt-4 text-3xl font-bold text-foreground">{title}</Text>;

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
