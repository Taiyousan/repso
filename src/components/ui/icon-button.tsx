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
  size = 20,
}: IconButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      // 36 + 2 × 6 = the 48 dp touch target Android asks for.
      hitSlop={6}
      style={({ pressed }) => [
        { width: 36, height: 36, borderWidth: 2 },
        disabled ? null : raised(pressed, colors.ink, 2),
      ]}
      className={`items-center justify-center rounded-[10px] border-ink bg-surface ${
        disabled ? 'opacity-30' : ''
      }`}>
      <Icon name={icon} size={size} color={tone === 'danger' ? colors.danger : colors.foreground} />
    </Pressable>
  );
}
