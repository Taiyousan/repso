import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useThemeColors } from '@/lib/theme';

import { Icon } from './icon';
import { PressableCard } from './pressable-card';
import { Text } from './text';

type ListRowProps = {
  title: string;
  /** Lines under the title, in the muted color. */
  details?: (string | null | undefined)[];
  onPress: () => void;
  /** Before the title, e.g. a thumbnail. */
  leading?: ReactNode;
  accessibilityLabel?: string;
};

/** A row that opens something (chevron); tapping it never starts an action. */
export function ListRow({
  title,
  details = [],
  onPress,
  leading,
  accessibilityLabel,
}: ListRowProps) {
  const colors = useThemeColors();
  const lines = details.filter((line): line is string => Boolean(line));

  return (
    <PressableCard
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? title}
      className="flex-row items-center gap-3 px-4 py-3.5">
      {leading}
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-bold text-foreground" numberOfLines={2}>
          {title}
        </Text>
        {lines.map((line) => (
          <Text key={line} className="text-sm text-muted" numberOfLines={1}>
            {line}
          </Text>
        ))}
      </View>
      <Icon name={{ ios: 'chevron.right', android: 'chevron_right' }} color={colors.foreground} />
    </PressableCard>
  );
}
