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

/** A label, or a toggle when it has `onPress` (then raised like any button). */
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
        { borderWidth: 2 },
        tappable ? raised(pressed, colors.ink, 2) : null,
      ]}
      className={`rounded-full border-ink px-3 py-1.5 ${selected ? 'bg-primary' : 'bg-surface'}`}>
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
    </Pressable>
  );
}
