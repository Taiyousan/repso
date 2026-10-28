import { TextInput, type TextInputProps, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { FONTS, useThemeColors } from '@/lib/theme';

type TextFieldProps = Omit<TextInputProps, 'className' | 'placeholderTextColor'> & {
  label?: string;
};

/** A field to fill in: thin ink outline and no shadow, unlike buttons. */
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
        style={[{ fontFamily: FONTS.sans, borderWidth: 1.5 }, style]}
        className={`rounded-xl border-ink bg-surface px-4 py-3 text-base text-foreground ${
          multiline ? 'min-h-28' : ''
        }`}
      />
    </View>
  );
}
