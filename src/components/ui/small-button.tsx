import { Pressable, type PressableProps } from 'react-native';

import { Text } from './text';

type SmallButtonProps = Pick<PressableProps, 'accessibilityLabel' | 'accessibilityState'> & {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Takes the free width of its row. */
  grow?: boolean;
};

/** Compact flat button, for actions inside a card or a bar (+ Série, Repos, Passer…). */
export function SmallButton({
  label,
  onPress,
  disabled = false,
  grow = false,
  ...props
}: SmallButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      // Brings the touch target to 48 dp.
      hitSlop={7}
      {...props}
      style={{ height: 34 }}
      className={`items-center justify-center rounded-[10px] bg-surface-muted px-2.5 active:opacity-70 ${
        grow ? 'flex-1' : ''
      } ${disabled ? 'opacity-40' : ''}`}>
      <Text className="text-[13px] font-extrabold text-foreground">{label}</Text>
    </Pressable>
  );
}
