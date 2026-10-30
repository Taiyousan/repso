import { Pressable } from 'react-native';

import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/lib/theme';

import { raised } from './raised';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
};

/** A label, or a toggle when it has `onPress` (then outlined with a bottom edge, like a button). */
export function Chip({ label, selected = false, onPress, onLongPress }: ChipProps) {
  const colors = useThemeColors();
  const tappable = Boolean(onPress);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!tappable}
      accessibilityRole={tappable ? 'button' : 'text'}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        { borderWidth: tappable ? 1.5 : 0 },
        tappable ? raised(pressed, colors.edge, 2) : null,
      ]}
      className={`rounded-full border-edge px-2.5 py-1 ${
        selected ? 'bg-primary-soft' : tappable ? 'bg-surface' : 'bg-surface-muted'
      }`}>
      <Text className="text-sm font-bold text-foreground">{label}</Text>
    </Pressable>
  );
}
