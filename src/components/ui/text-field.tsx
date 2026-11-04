import { TextInput, type TextInputProps, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { FONTS, useThemeColors } from '@/lib/theme';

type TextFieldProps = Omit<TextInputProps, 'className' | 'placeholderTextColor'> & {
  label?: string;
};

/** A field to fill in: thin outline, no bottom edge. */
export function TextField({ label, multiline, style, ...props }: TextFieldProps) {
  const colors = useThemeColors();

  return (
    <View className="gap-1.5">
      {label ? <Text className="text-sm font-semibold text-foreground">{label}</Text> : null}
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[{ fontFamily: FONTS.sans, borderWidth: 1 }, style]}
        className={`rounded-xl border-edge bg-surface px-3 py-2.5 text-base text-foreground ${
          multiline ? 'min-h-24' : ''
        }`}
      />
    </View>
  );
}
