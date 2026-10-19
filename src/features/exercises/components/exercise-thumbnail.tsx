import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { exerciseImageUrl } from '../library';

type ExerciseThumbnailProps = {
  images: string[];
  name: string;
};

export function ExerciseThumbnail({ images, name }: ExerciseThumbnailProps) {
  if (images.length === 0) {
    return (
      <View className="size-14 items-center justify-center rounded-xl bg-surface-muted">
        <Text className="text-lg font-bold text-muted">{name.charAt(0).toUpperCase()}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: exerciseImageUrl(images[0]) }}
      recyclingKey={images[0]}
      contentFit="cover"
      transition={150}
      accessibilityIgnoresInvertColors
      style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: '#ffffff' }}
    />
  );
}
