import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/lib/theme';

import { exerciseImageUrl } from '../library';

const FRAME_DURATION_MS = 900;

type ExerciseAnimationProps = {
  images: string[];
};

/**
 * free-exercise-db provides a start and an end position: alternating them gives a simple
 * animation. Tapping it pauses on the current position, tapping again resumes. Both frames stay
 * mounted so switching never waits for a download.
 */
export function ExerciseAnimation({ images }: ExerciseAnimationProps) {
  const colors = useThemeColors();
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const animated = images.length >= 2;
  const animates = animated && !paused;

  useEffect(() => {
    if (!animates) return;
    const interval = setInterval(() => setTick((current) => current + 1), FRAME_DURATION_MS);
    return () => clearInterval(interval);
  }, [animates]);

  if (images.length === 0) {
    return (
      <View className="aspect-[3/2] items-center justify-center rounded-2xl bg-surface-muted">
        <Text className="text-muted">Pas d&apos;illustration</Text>
      </View>
    );
  }

  const frame = tick % images.length;

  return (
    <Pressable
      onPress={() => setPaused((current) => !current)}
      disabled={!animated}
      accessibilityRole="button"
      accessibilityLabel={paused ? "Reprendre l'animation" : "Mettre l'animation en pause"}
      className="aspect-[3/2] overflow-hidden rounded-2xl bg-white">
      {images.map((path, index) => (
        <Image
          key={path}
          source={{ uri: exerciseImageUrl(path) }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
          style={{ position: 'absolute', inset: 0, opacity: index === frame ? 1 : 0 }}
        />
      ))}
      {paused ? (
        <View className="absolute right-2 bottom-2 size-8 items-center justify-center rounded-full bg-surface-muted">
          <Icon
            name={{ ios: 'play.fill', android: 'play_arrow' }}
            size={16}
            color={colors.foreground}
          />
        </View>
      ) : null}
    </Pressable>
  );
}
