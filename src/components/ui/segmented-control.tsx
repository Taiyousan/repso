import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

type SegmentedControlProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View className="flex-row gap-1 rounded-xl bg-surface-muted p-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={`flex-1 items-center rounded-lg py-1.5 ${selected ? 'bg-primary-soft' : ''}`}>
            <Text
              className={`text-sm ${selected ? 'font-bold text-foreground' : 'font-medium text-muted'}`}
              numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
