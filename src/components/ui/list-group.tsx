import { Children, type PropsWithChildren } from 'react';
import { View } from 'react-native';

/** One card holding flat rows, separated by thin lines. */
export function ListGroup({ children }: PropsWithChildren) {
  return (
    <View className="overflow-hidden rounded-2xl border border-outline bg-surface">
      {Children.map(children, (child, index) => (
        <View className={index > 0 ? 'border-t border-border' : ''}>{child}</View>
      ))}
    </View>
  );
}
