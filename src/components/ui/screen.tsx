import type { PropsWithChildren } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = PropsWithChildren<{
  title: string;
}>;

/** Base layout of a top-level screen: safe area, large title, scrollable content. */
export function Screen({ title, children }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerClassName="gap-4 px-4 pb-8">
        <Text className="pt-4 text-3xl font-bold text-foreground">{title}</Text>
        {children}
      </ScrollView>
    </View>
  );
}
