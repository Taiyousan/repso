import { memo, useMemo } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import Body from 'react-native-body-highlighter';

import { useThemeColors } from '@/lib/theme';

import { type Muscle, MUSCLES, muscleLabel } from '../labels';
import { toBodyParts } from '../muscle-map';

/** Muscles that are only visible from behind. */
const BACK_VIEW_MUSCLES = new Set<Muscle>([
  'lats',
  'middle back',
  'traps',
  'lower back',
  'glutes',
  'hamstrings',
  'calves',
  'triceps',
  'abductors',
]);

type MuscleFilterProps = {
  selected: string | null;
  onSelect: (muscle: string | null) => void;
};

/** Horizontal row of mini body maps, one per muscle. */
export function MuscleFilter({ selected, onSelect }: MuscleFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="grow-0"
      contentContainerClassName="gap-2 px-4"
      keyboardShouldPersistTaps="handled">
      {MUSCLES.map((muscle) => (
        <MuscleTile
          key={muscle}
          muscle={muscle}
          selected={selected === muscle}
          onPress={() => onSelect(selected === muscle ? null : muscle)}
        />
      ))}
    </ScrollView>
  );
}

type MuscleTileProps = {
  muscle: Muscle;
  selected: boolean;
  onPress: () => void;
};

const MuscleTile = memo(function MuscleTile({ muscle, selected, onPress }: MuscleTileProps) {
  const colors = useThemeColors();
  const data = useMemo(() => toBodyParts([muscle], []), [muscle]);
  const label = muscleLabel(muscle);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      className={`w-24 items-center gap-1 rounded-2xl border bg-surface py-2 ${
        selected ? 'border-primary' : 'border-border'
      }`}>
      <Body
        data={data}
        side={BACK_VIEW_MUSCLES.has(muscle) ? 'back' : 'front'}
        scale={0.22}
        colors={[colors.primary]}
        defaultFill={colors.border}
        border="none"
      />
      <Text
        numberOfLines={1}
        className={`px-1 text-xs ${selected ? 'font-semibold text-primary' : 'text-muted'}`}>
        {label}
      </Text>
    </Pressable>
  );
});
