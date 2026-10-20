import { Pressable, Text } from 'react-native';

import { useThemeColors } from '@/lib/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
};

const CONTAINER = {
  primary: 'bg-primary',
  secondary: 'border border-border bg-surface',
  danger: 'border border-danger bg-surface',
};

const LABEL = {
  primary: 'text-primary-foreground',
  secondary: 'text-foreground',
  danger: 'text-danger',
};

export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  const colors = useThemeColors();
  // Drawn natively on touch, so it shows even when the press starts heavy JS work.
  const ripple = {
    primary: '#ffffff4d',
    secondary: `${colors.foreground}26`,
    danger: `${colors.danger}26`,
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      android_ripple={{ color: ripple, foreground: true }}
      className={`items-center overflow-hidden rounded-xl px-4 py-3 active:scale-97 active:opacity-70 ${
        CONTAINER[variant]
      } ${disabled ? 'opacity-50' : ''}`}>
      <Text className={`text-base font-semibold ${LABEL[variant]}`}>{label}</Text>
    </Pressable>
  );
}
