import { View } from 'react-native';
import Body from 'react-native-body-highlighter';

import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/lib/theme';

import { muscleLabel } from '../labels';
import { toBodyParts } from '../muscle-map';

type MuscleMapProps = {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  gender?: 'male' | 'female';
};

/** Front and back views with primary muscles in ink, secondary ones in blue. */
function BodyViews({
  primaryMuscles,
  secondaryMuscles,
  gender = 'male',
  scale,
}: MuscleMapProps & { scale: number }) {
  const colors = useThemeColors();
  const bodyProps = {
    data: toBodyParts(primaryMuscles, secondaryMuscles),
    gender,
    scale,
    colors: [colors.foreground, colors.primary],
    defaultFill: colors.surfaceMuted,
    border: colors.border,
  };

  return (
    <View className="flex-row justify-center">
      <Body {...bodyProps} side="front" />
      <Body {...bodyProps} side="back" />
    </View>
  );
}

/** Both body views, large, with their legend. */
export function MuscleMap(props: MuscleMapProps) {
  return (
    <View className="gap-3 rounded-2xl border border-outline bg-surface p-4">
      <BodyViews {...props} scale={0.85} />
      <View className="flex-row justify-center gap-5">
        <Legend colorClassName="bg-foreground" label="Principal" />
        <Legend colorClassName="bg-primary" label="Secondaire" />
      </View>
    </View>
  );
}

/** Small body views beside the muscles' names, for an exercise sheet. */
export function MuscleSummary(props: MuscleMapProps) {
  const { primaryMuscles, secondaryMuscles } = props;

  return (
    <View className="flex-row items-center gap-4 rounded-2xl border border-outline bg-surface px-4 py-3">
      <BodyViews {...props} scale={0.4} />
      <View className="flex-1 gap-2.5">
        <MuscleGroup
          colorClassName="bg-foreground"
          label={primaryMuscles.length > 1 ? 'Principaux' : 'Principal'}
          muscles={primaryMuscles}
        />
        <MuscleGroup
          colorClassName="bg-primary"
          label={secondaryMuscles.length > 1 ? 'Secondaires' : 'Secondaire'}
          muscles={secondaryMuscles}
        />
      </View>
    </View>
  );
}

function MuscleGroup({
  colorClassName,
  label,
  muscles,
}: {
  colorClassName: string;
  label: string;
  muscles: string[];
}) {
  if (muscles.length === 0) return null;
  return (
    <View className="gap-0.5">
      <Legend colorClassName={colorClassName} label={label} />
      <Text className="text-base font-extrabold text-foreground">
        {muscles.map(muscleLabel).join(', ')}
      </Text>
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
