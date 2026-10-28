import { Image } from 'expo-image';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

import { exerciseImageUrl } from '../library';

type ExerciseThumbnailProps = {
  images: string[];
  name: string;
  /** Side of the square in a row, or the height when `fill` stretches it to the parent's width. */
  size?: number;
  /** Full width, square corners: the parent card clips it. */
  fill?: boolean;
};

export function ExerciseThumbnail({
  images,
  name,
  size = 56,
  fill = false,
}: ExerciseThumbnailProps) {
  const layout = fill
    ? { width: '100%' as const, height: size, borderRadius: 0 }
    : { width: size, height: size, borderRadius: 12 };

  if (images.length === 0) {
    return (
      <View style={layout} className="items-center justify-center bg-surface-muted">
        <Text className="text-lg font-bold text-muted">{name.charAt(0).toUpperCase()}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: exerciseImageUrl(images[0]) }}
      recyclingKey={images[0]}
      // Cropping a wide card would cut the figure's head and feet off.
      contentFit={fill ? 'contain' : 'cover'}
      transition={150}
      accessibilityIgnoresInvertColors
      style={{ ...layout, backgroundColor: '#ffffff' }}
    />
  );
}
