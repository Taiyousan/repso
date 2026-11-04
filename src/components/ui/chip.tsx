import { Pressable } from 'react-native';

import { Text } from '@/components/ui/text';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
};

/** A label, or a toggle when it has `onPress`. */
export function Chip({ label, selected = false, onPress, onLongPress }: ChipProps) {
  const tappable = Boolean(onPress);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!tappable}
      accessibilityRole={tappable ? 'button' : 'text'}
      accessibilityState={{ selected }}
      className={`rounded-full px-2.5 py-1 active:opacity-70 ${
        selected ? 'bg-primary-soft' : 'bg-surface-muted'
      }`}>
      <Text className="text-sm font-bold text-foreground">{label}</Text>
    </Pressable>
  );
}
