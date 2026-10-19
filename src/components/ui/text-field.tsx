import { Text, TextInput, type TextInputProps, View } from 'react-native';

import { useThemeColors } from '@/lib/theme';

type TextFieldProps = Omit<TextInputProps, 'className' | 'placeholderTextColor'> & {
  label?: string;
};

export function TextField({ label, multiline, ...props }: TextFieldProps) {
  const colors = useThemeColors();

  return (
    <View className="gap-1.5">
      {label ? <Text className="text-sm font-medium text-muted">{label}</Text> : null}
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground ${
          multiline ? 'min-h-28' : ''
        }`}
      />
    </View>
  );
}
