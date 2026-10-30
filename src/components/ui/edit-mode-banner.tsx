import { View } from 'react-native';

import { useThemeColors } from '@/lib/theme';

import { Icon } from './icon';
import { Text } from './text';

/** Top of an edit screen: says the mode, and that there is nothing to save. */
export function EditModeBanner() {
  const colors = useThemeColors();

  return (
    <View
      style={{ borderWidth: 1.5, borderStyle: 'dashed' }}
      className="flex-row items-center gap-2 rounded-xl border-edge px-3 py-2">
      <Icon name={{ ios: 'pencil', android: 'edit' }} size={16} color={colors.foreground} />
      <Text className="text-sm font-semibold text-foreground">
        Mode édition · enregistré automatiquement
      </Text>
    </View>
  );
}
