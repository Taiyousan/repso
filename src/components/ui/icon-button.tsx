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
  size = 22,
}: IconButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      className={`rounded-lg p-1.5 active:bg-surface-muted ${disabled ? 'opacity-30' : ''}`}>
      <Icon name={icon} size={size} color={tone === 'danger' ? colors.danger : colors.muted} />
    </Pressable>
  );
}
