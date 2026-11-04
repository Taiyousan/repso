import { View } from 'react-native';
import Body from 'react-native-body-highlighter';

import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/lib/theme';

import { toBodyParts } from '../muscle-map';

type MuscleMapProps = {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  gender?: 'male' | 'female';
};

/** Front and back views with primary muscles in ink, secondary ones in blue. */
export function MuscleMap({ primaryMuscles, secondaryMuscles, gender = 'male' }: MuscleMapProps) {
  const colors = useThemeColors();
  const data = toBodyParts(primaryMuscles, secondaryMuscles);
  const bodyProps = {
    data,
    gender,
    scale: 0.85,
    colors: [colors.foreground, colors.primary],
    defaultFill: colors.surfaceMuted,
    border: colors.border,
  };

  return (
    <View className="gap-3 rounded-2xl border border-outline bg-surface p-4">
      <View className="flex-row justify-center">
        <Body {...bodyProps} side="front" />
        <Body {...bodyProps} side="back" />
      </View>
      <View className="flex-row justify-center gap-5">
        <Legend colorClassName="bg-foreground" label="Principal" />
        <Legend colorClassName="bg-primary" label="Secondaire" />
      </View>
    </View>
  );
}

function Legend({ colorClassName, label }: { colorClassName: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={`size-3 rounded-full ${colorClassName}`} />
      <Text className="text-sm text-muted">{label}</Text>
    </View>
  );
}
