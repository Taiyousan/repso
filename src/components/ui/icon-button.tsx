import { type ComponentProps } from 'react';
import { Pressable } from 'react-native';

import { useThemeColors } from '@/lib/theme';

import { Icon } from './icon';
import { raised } from './raised';

type IconButtonProps = {
  icon: ComponentProps<typeof Icon>['name'];
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'muted' | 'danger';
  size?: number;
};

export function IconButton({
  icon,
  label,
  onPress,
  disabled = false,
  tone = 'muted',
  size = 17,
}: IconButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      // 34 + 2 × 7 = the 48 dp touch target Android asks for.
      hitSlop={7}
      style={({ pressed }) => [
        { width: 34, height: 34, borderWidth: 1.5 },
        disabled ? null : raised(pressed, colors.edge),
      ]}
      className={`items-center justify-center rounded-[10px] border-edge bg-surface ${
        disabled ? 'opacity-30' : ''
      }`}>
      <Icon name={icon} size={size} color={tone === 'danger' ? colors.danger : colors.foreground} />
    </Pressable>
  );
}
