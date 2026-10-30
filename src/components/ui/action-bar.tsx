import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Bar docked at the bottom of a screen: the only place for its main action. */
export function ActionBar({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ borderTopWidth: 1.5, paddingBottom: insets.bottom + 12 }}
      className="gap-3 border-edge bg-surface px-4 pt-3">
      {children}
    </View>
  );
}
