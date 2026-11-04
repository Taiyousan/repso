import { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import type { BodyPart } from 'react-native-body-highlighter';
import { bodyBack } from 'react-native-body-highlighter/dist/assets/bodyBack';
import { bodyFront } from 'react-native-body-highlighter/dist/assets/bodyFront';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui/text';
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

const SILHOUETTES = { front: mergeShapes(bodyFront), back: mergeShapes(bodyBack) };

/**
 * Zoom on each muscle: a square of the library's drawing (front 0-724, back 724-1448) centered on
 * the muscle's parts, 1.25 × their bounding box and at least 350 units so some body shows around.
 */
const FRAMES: Record<Muscle, string> = {
  chest: '189 202 350 350',
  shoulders: '149 128 438 438',
  triceps: '852 227 464 464',
  biceps: '135 223 458 458',
  forearms: '63 291 604 604',
  lats: '908 279 350 350',
  'middle back': '908 279 350 350',
  traps: '908 210 350 350',
  'lower back': '907 388 350 350',
  abdominals: '177 380 374 374',
  quadriceps: '186 632 356 356',
  hamstrings: '909 700 350 350',
  glutes: '909 522 350 350',
  calves: '885 931 399 399',
  adductors: '189 598 350 350',
  abductors: '909 522 350 350',
  neck: '189 103 350 350',
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
      style={showLabel ? null : { width: 48, height: 56 }}
      className={`items-center justify-center overflow-hidden rounded-2xl border border-outline active:opacity-70 ${
        showLabel ? 'w-24 gap-1 py-1.5' : ''
      } ${selected ? 'bg-primary-soft' : 'bg-surface'}`}>
      <Svg viewBox={FRAMES[muscle]} width={showLabel ? 60 : 40} height={showLabel ? 60 : 40}>
        {silhouette.map((part, index) => (
          <Path
            key={index}
            d={part.d}
            fill={highlighted.has(part.slug) ? colors.foreground : colors.edge}
          />
        ))}
      </Svg>
      {showLabel ? (
        <Text
          numberOfLines={1}
          className={`px-1 text-xs ${selected ? 'font-bold text-foreground' : 'text-muted'}`}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
});
