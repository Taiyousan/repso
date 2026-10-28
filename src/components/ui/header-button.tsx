import { Pressable } from 'react-native';

import { useThemeColors } from '@/lib/theme';

import { raised } from './raised';
import { Text } from './text';

type HeaderButtonProps = {
  label: string;
  onPress: () => void;
  /** "Terminé" of an edit screen: the way out, in yellow. */
  primary?: boolean;
};

/** Text button of a header: "Modifier" on a read screen, "Terminé" on an edit screen. */
export function HeaderButton({ label, onPress, primary = false }: HeaderButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={6}
      style={({ pressed }) => [{ borderWidth: 2 }, raised(pressed, colors.ink, 2)]}
      className={`rounded-[10px] border-ink px-3 py-1.5 ${primary ? 'bg-primary' : 'bg-surface'}`}>
      <Text className="text-sm font-bold text-foreground">{label}</Text>
    </Pressable>
  );
}
