import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { SegmentedControl } from '@/components/ui/segmented-control';

import { exerciseImageUrl } from '../library';

const FRAME_DURATION_MS = 900;

type Mode = 'animate' | '0' | '1';

const MODES: { value: Mode; label: string }[] = [
  { value: 'animate', label: 'Animation' },
  { value: '0', label: 'Départ' },
  { value: '1', label: 'Arrivée' },
];

type ExerciseAnimationProps = {
  images: string[];
};

/**
 * free-exercise-db provides a start and an end position: alternating them gives a simple
 * animation, which can be frozen on either position. Both frames stay mounted so switching
 * never waits for a download.
 */
export function ExerciseAnimation({ images }: ExerciseAnimationProps) {
  const [mode, setMode] = useState<Mode>('animate');
  const [tick, setTick] = useState(0);
  const animates = mode === 'animate' && images.length >= 2;

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

  const frame = animates ? tick % images.length : mode === 'animate' ? 0 : Number(mode);

  return (
    <View className="gap-2">
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
      {images.length >= 2 ? (
        <SegmentedControl options={MODES} value={mode} onChange={setMode} />
      ) : null}
    </View>
  );
}
