import { Pressable, type PressableProps } from 'react-native';

import { useThemeColors } from '@/lib/theme';

import { raised } from './raised';
import { Text } from './text';

type SmallButtonProps = Pick<PressableProps, 'accessibilityLabel' | 'accessibilityState'> & {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Takes the free width of its row. */
  grow?: boolean;
};

/** Compact raised button, for actions inside a card or a bar (+ Série, Repos, Passer…). */
export function SmallButton({
  label,
  onPress,
  disabled = false,
  grow = false,
  ...props
}: SmallButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      // Brings the touch target to 48 dp.
      hitSlop={6}
      {...props}
      style={({ pressed }) => [
        { borderWidth: 2 },
        disabled ? null : raised(pressed, colors.ink, 2),
      ]}
      className={`items-center rounded-[10px] border-ink bg-surface px-3 py-1.5 ${
        grow ? 'flex-1' : ''
      } ${disabled ? 'opacity-40' : ''}`}>
      <Text className="text-sm font-bold text-foreground">{label}</Text>
    </Pressable>
  );
}
