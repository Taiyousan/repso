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

// Only the primary button has an edge; the others are flat and dim when pressed.
const CONTAINER = {
  primary: 'border-primary bg-primary',
  secondary: 'border-surface-muted bg-surface-muted active:opacity-70',
  danger: 'border-surface-muted bg-surface-muted active:opacity-70',
};

const LABEL = {
  primary: 'text-lg font-extrabold text-primary-foreground',
  secondary: 'text-base font-extrabold text-foreground',
  danger: 'text-base font-extrabold text-danger',
};

export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  const colors = useThemeColors();
  const hasEdge = variant === 'primary' && !disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      // Disabled, it can't be tapped: no edge.
      style={({ pressed }) => [
        { borderWidth: 1.5 },
        hasEdge ? raised(pressed, colors.primaryEdge) : null,
      ]}
      className={`items-center rounded-xl px-4 py-2.5 ${CONTAINER[variant]} ${
        disabled ? 'opacity-40' : ''
      }`}>
      <Text className={LABEL[variant]}>{label}</Text>
    </Pressable>
  );
}
