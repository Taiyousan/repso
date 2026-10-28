import { Pressable } from 'react-native';

import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/lib/theme';

import { raised } from './raised';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
};

const CONTAINER = {
  primary: 'border-ink bg-primary',
  secondary: 'border-ink bg-surface',
  danger: 'border-danger bg-surface',
};

const LABEL = {
  primary: 'font-display text-[15px] font-bold text-primary-foreground',
  secondary: 'text-base font-bold text-foreground',
  danger: 'text-base font-bold text-danger',
};

export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  const colors = useThemeColors();
  const shadow = variant === 'danger' ? colors.danger : colors.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      // Disabled, it can't be tapped: no shadow.
      style={({ pressed }) => [{ borderWidth: 2.5 }, disabled ? null : raised(pressed, shadow)]}
      className={`items-center rounded-xl px-4 py-3 ${CONTAINER[variant]} ${
        disabled ? 'opacity-40' : ''
      }`}>
      <Text className={LABEL[variant]}>{label}</Text>
    </Pressable>
  );
}
