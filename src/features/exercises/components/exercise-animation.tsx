import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { exerciseImageUrl } from '../library';

const FRAME_DURATION_MS = 900;

type ExerciseAnimationProps = {
  images: string[];
};

/**
 * free-exercise-db provides a start and an end position: alternating them gives a simple
 * animation. Both frames stay mounted so switching never waits for a download.
 */
export function ExerciseAnimation({ images }: ExerciseAnimationProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const interval = setInterval(
      () => setFrame((current) => (current + 1) % images.length),
      FRAME_DURATION_MS,
    );
    return () => clearInterval(interval);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <View className="aspect-[3/2] items-center justify-center rounded-2xl bg-surface-muted">
        <Text className="text-muted">Pas d&apos;illustration</Text>
      </View>
    );
  }

  return (
    <View className="aspect-[3/2] overflow-hidden rounded-2xl bg-white">
      {images.map((path, index) => (
        <Image
          key={path}
          source={{ uri: exerciseImageUrl(path) }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
          style={{ position: 'absolute', inset: 0, opacity: index === frame ? 1 : 0 }}
        />
      ))}
    </View>
  );
}
