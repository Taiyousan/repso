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
  primary: 'border-primary bg-primary',
  secondary: 'border-edge bg-surface',
  danger: 'border-danger bg-surface',
};

const LABEL = {
  primary: 'text-lg font-extrabold text-primary-foreground',
  secondary: 'text-base font-extrabold text-foreground',
  danger: 'text-base font-extrabold text-danger',
};

export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  const colors = useThemeColors();
  const shadow = { primary: colors.primaryEdge, secondary: colors.edge, danger: colors.danger }[
    variant
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      // Disabled, it can't be tapped: no shadow.
      style={({ pressed }) => [{ borderWidth: 1.5 }, disabled ? null : raised(pressed, shadow)]}
      className={`items-center rounded-xl px-4 py-2.5 ${CONTAINER[variant]} ${
        disabled ? 'opacity-40' : ''
      }`}>
      <Text className={LABEL[variant]}>{label}</Text>
    </Pressable>
  );
}
