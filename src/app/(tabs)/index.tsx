import { Link } from 'expo-router';
import { Pressable } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { useThemeColors } from '@/lib/theme';

export default function WorkoutScreen() {
  const colors = useThemeColors();

  return (
    <Screen
      title="Séance"
      action={
        <Link href="/settings" asChild>
          <Pressable accessibilityLabel="Réglages" hitSlop={8} className="p-1">
            <Icon name={{ ios: 'gearshape', android: 'settings' }} color={colors.muted} />
          </Pressable>
        </Link>
      }>
      <EmptyState
        title="Aucune séance en cours"
        description="Démarre une séance depuis un programme ou en séance libre."
      />
    </Screen>
  );
}
