import { memo, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
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

/** Named grid of mini body maps, for the filters overlay. */
export function MuscleFilter({ selected, onSelect }: MuscleFilterProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {MUSCLES.map((muscle) => (
        <MuscleTile
          key={muscle}
          muscle={muscle}
          selected={selected === muscle}
          onPress={() => onSelect(selected === muscle ? null : muscle)}
          showLabel
        />
      ))}
    </View>
  );
}

type MuscleTileProps = {
  muscle: Muscle;
  selected: boolean;
  onPress: () => void;
  /** Names the muscle under the body; without it the tile is a compact icon. */
  showLabel?: boolean;
};

export const MuscleTile = memo(function MuscleTile({
  muscle,
  selected,
  onPress,
  showLabel = false,
}: MuscleTileProps) {
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
      style={showLabel ? undefined : { width: 52, height: 64 }}
      className={`items-center justify-center rounded-2xl border bg-surface ${
        showLabel ? 'w-24 gap-1 py-1.5' : ''
      } ${selected ? 'border-primary' : 'border-border'}`}>
      {/* The silhouettes keep the 1:2 ratio of their viewBox. */}
      <Svg viewBox={silhouette.viewBox} width={showLabel ? 34 : 26} height={showLabel ? 68 : 52}>
        {silhouette.parts.map((part, index) => (
          <Path
            key={index}
            d={part.d}
            fill={highlighted.has(part.slug) ? colors.primary : colors.border}
          />
        ))}
      </Svg>
      {showLabel ? (
        <Text
          numberOfLines={1}
          className={`px-1 text-xs ${selected ? 'font-semibold text-primary' : 'text-muted'}`}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
});
