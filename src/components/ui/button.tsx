import { Pressable, Text } from 'react-native';

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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      className={`items-center rounded-xl px-4 py-3 active:opacity-80 ${CONTAINER[variant]} ${
        disabled ? 'opacity-50' : ''
      }`}>
      <Text className={`text-base font-semibold ${LABEL[variant]}`}>{label}</Text>
    </Pressable>
  );
}
