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

/** Compact button with a bottom edge, for actions inside a card or a bar (+ Série, Repos, Passer…). */
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
      hitSlop={7}
      {...props}
      style={({ pressed }) => [
        { height: 34, borderWidth: 1.5 },
        disabled ? null : raised(pressed, colors.edge),
      ]}
      className={`items-center justify-center rounded-[10px] border-edge bg-surface px-2.5 ${
        grow ? 'flex-1' : ''
      } ${disabled ? 'opacity-40' : ''}`}>
      <Text className="text-[13px] font-extrabold text-foreground">{label}</Text>
    </Pressable>
  );
}
