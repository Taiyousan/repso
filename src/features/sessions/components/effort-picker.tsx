import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

import { effortLabel } from '../recap';

type EffortPickerProps = {
  value: number | null;
  /** Tapping the selected value again clears it. */
  onChange: (value: number | null) => void;
};

const VALUES = Array.from({ length: 10 }, (_, index) => index + 1);

/** Perceived effort 1–10, drawn as a gauge filling up to the selected value. */
export function EffortPicker({ value, onChange }: EffortPickerProps) {
  return (
    <View className="gap-2">
      <View className="flex-row gap-1">
        {VALUES.map((item) => {
          const selected = item === value;
          const filled = value != null && item < value;
          return (
            <Pressable
              key={item}
              onPress={() => onChange(selected ? null : item)}
              accessibilityRole="button"
              accessibilityLabel={`Effort ${item} sur 10, ${effortLabel(item)}`}
              accessibilityState={{ selected }}
              className={`h-11 flex-1 items-center justify-center rounded-lg active:opacity-70 ${
                selected ? 'bg-primary' : filled ? 'bg-primary-soft' : 'bg-surface-muted'
              }`}>
              <Text
                className={`text-sm font-semibold ${
                  selected ? 'text-primary-foreground' : 'text-foreground'
                }`}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="text-sm text-muted">
        {value == null ? (
          'Comment as-tu trouvé cette séance ?'
        ) : (
          <>
            <Text className="font-semibold text-foreground">{value}/10</Text> · {effortLabel(value)}
          </>
        )}
      </Text>
    </View>
  );
}
