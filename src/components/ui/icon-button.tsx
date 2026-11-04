import { type ComponentProps } from 'react';
import { Pressable } from 'react-native';

import { useThemeColors } from '@/lib/theme';

import { Icon } from './icon';

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
      style={{ width: 34, height: 34 }}
      className={`items-center justify-center rounded-[10px] bg-surface-muted active:opacity-70 ${
        disabled ? 'opacity-30' : ''
      }`}>
      <Icon name={icon} size={size} color={tone === 'danger' ? colors.danger : colors.foreground} />
    </Pressable>
  );
}
