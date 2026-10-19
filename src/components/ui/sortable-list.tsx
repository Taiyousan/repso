import type { ReactElement } from 'react';
import { View } from 'react-native';
import type { AnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';

import { useThemeColors } from '@/lib/theme';

import { Icon } from './icon';

type SortableListProps<T> = {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactElement;
  /** Called with every key in the new order, only when the order changed. */
  onReorder: (orderedKeys: string[]) => void;
  /** The enclosing Animated.ScrollView, scrolled automatically while dragging near its edges. */
  scrollableRef: AnimatedRef<any>;
  gap?: number;
};

/** Vertical list reordered by dragging each item's DragHandle. */
export function SortableList<T>({
  data,
  keyExtractor,
  renderItem,
  onReorder,
  scrollableRef,
  gap = 12,
}: SortableListProps<T>) {
  return (
    <Sortable.Grid
      columns={1}
      data={data}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => renderItem(item)}
      rowGap={gap}
      customHandle
      activeItemScale={1.02}
      scrollableRef={scrollableRef}
      onDragEnd={({ fromIndex, toIndex, indexToKey }) => {
        if (fromIndex !== toIndex) onReorder(indexToKey);
      }}
    />
  );
}

export function DragHandle({ label }: { label: string }) {
  const colors = useThemeColors();
  return (
    <Sortable.Handle>
      <View accessibilityLabel={label} accessibilityHint="Maintenir et glisser" className="p-1.5">
        <Icon name={{ ios: 'line.3.horizontal', android: 'drag_indicator' }} color={colors.muted} />
      </View>
    </Sortable.Handle>
  );
}
