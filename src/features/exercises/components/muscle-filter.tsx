import { memo, useMemo } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import type { BodyPart } from 'react-native-body-highlighter';
import { bodyBack } from 'react-native-body-highlighter/dist/assets/bodyBack';
import { bodyFront } from 'react-native-body-highlighter/dist/assets/bodyFront';
import Svg, { Path } from 'react-native-svg';

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

/**
 * The library's <Body> draws each shape as its own pressable <Path> (~80 per body): 17 tiles of
 * that took seconds to mount. Merging the shapes of each part keeps the same drawing in ~20 paths.
 */
function mergeShapes(parts: BodyPart[]) {
  return parts.map(({ slug, path = {} }) => ({
    slug,
    d: [...(path.common ?? []), ...(path.left ?? []), ...(path.right ?? [])].join(' '),
  }));
}

const SILHOUETTES = {
  front: { viewBox: '0 0 724 1448', parts: mergeShapes(bodyFront) },
  back: { viewBox: '724 0 724 1448', parts: mergeShapes(bodyBack) },
};

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
  const highlighted = useMemo(
    () => new Set(toBodyParts([muscle], []).map((part) => part.slug)),
    [muscle],
  );
  const silhouette = SILHOUETTES[BACK_VIEW_MUSCLES.has(muscle) ? 'back' : 'front'];
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
      <Svg viewBox={silhouette.viewBox} width={44} height={88}>
        {silhouette.parts.map((part, index) => (
          <Path
            key={index}
            d={part.d}
            fill={highlighted.has(part.slug) ? colors.primary : colors.border}
          />
        ))}
      </Svg>
      <Text
        numberOfLines={1}
        className={`px-1 text-xs ${selected ? 'font-semibold text-primary' : 'text-muted'}`}>
        {label}
      </Text>
    </Pressable>
  );
});
