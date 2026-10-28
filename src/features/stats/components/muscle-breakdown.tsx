import { View } from 'react-native';

import Body from 'react-native-body-highlighter';

import { Text } from '@/components/ui/text';
import type { MuscleSets } from '@/domain/stats';
import { muscleLabel } from '@/features/exercises/labels';
import { toBodyHeat } from '@/features/exercises/muscle-map';
import { formatNumber, mixColors } from '@/lib/chart';
import { useThemeColors } from '@/lib/theme';

/** Steps of the body heat map, from pale yellow to ink. */
const HEAT_LEVELS = 4;

/** Sets per muscle on the body (darker = more sets), then listed with bars, most trained first. */
export function MuscleBreakdown({ muscles }: { muscles: MuscleSets[] }) {
  const colors = useThemeColors();
  const heat = [
    colors.primarySoft,
    colors.primary,
    mixColors(colors.primary, colors.foreground, 0.5),
    colors.foreground,
  ];
  const bodyProps = {
    data: toBodyHeat(
      muscles.map(({ muscle, sets }) => ({ muscle, value: sets })),
      HEAT_LEVELS,
    ),
    gender: 'male' as const,
    scale: 0.7,
    colors: heat,
    defaultFill: colors.surfaceMuted,
    border: colors.border,
  };
  const max = muscles[0]?.sets ?? 0;

  return (
    <View className="gap-4">
      <View className="flex-row justify-center">
        <Body {...bodyProps} side="front" />
        <Body {...bodyProps} side="back" />
      </View>

      <View className="gap-2.5">
        {muscles.map(({ muscle, sets }) => (
          <View key={muscle} className="flex-row items-center gap-3">
            <Text className="w-28 text-sm text-foreground" numberOfLines={1}>
              {muscleLabel(muscle)}
            </Text>
            <View className="h-2 flex-1 rounded-full bg-surface-muted">
              <View
                className="h-2 rounded-full bg-foreground"
                style={{ width: `${(sets / max) * 100}%` }}
              />
            </View>
            <Text
              className="w-9 text-right text-sm font-semibold text-foreground"
              style={{ fontVariant: ['tabular-nums'] }}>
              {formatNumber(sets)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
