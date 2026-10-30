import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

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
  /** Short value before the chevron. */
  trailing?: string;
  /** No card of its own: the row sits in a ListGroup. */
  flat?: boolean;
  accessibilityLabel?: string;
};

/** A row that opens something (chevron); tapping it never starts an action. */
export function ListRow({
  title,
  details = [],
  onPress,
  leading,
  trailing,
  flat = false,
  accessibilityLabel,
}: ListRowProps) {
  const colors = useThemeColors();
  const lines = details.filter((line): line is string => Boolean(line));
  const content = (
    <>
      {leading}
      <View className="flex-1">
        <Text className="text-base font-extrabold text-foreground" numberOfLines={2}>
          {title}
        </Text>
        {lines.map((line) => (
          <Text key={line} className="text-sm text-muted" numberOfLines={1}>
            {line}
          </Text>
        ))}
      </View>
      {trailing ? <Text className="text-sm font-bold text-muted">{trailing}</Text> : null}
      <Icon
        name={{ ios: 'chevron.right', android: 'chevron_right' }}
        size={18}
        color={colors.muted}
      />
    </>
  );

  return flat ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={{ minHeight: 48 }}
      className="flex-row items-center gap-2.5 px-3 py-2 active:bg-surface-muted">
      {content}
    </Pressable>
  ) : (
    <PressableCard
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? title}
      className="flex-row items-center gap-2.5 px-3 py-2.5">
      {content}
    </PressableCard>
  );
}
