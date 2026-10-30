import { Pressable } from 'react-native';

import { useThemeColors } from '@/lib/theme';

import { raised } from './raised';
import { Text } from './text';

type HeaderButtonProps = {
  label: string;
  onPress: () => void;
  /** "Terminé" of an edit screen: the way out, in blue. */
  primary?: boolean;
};

/** Text button of a header: "Modifier" on a read screen, "Terminé" on an edit screen. */
export function HeaderButton({ label, onPress, primary = false }: HeaderButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={7}
      style={({ pressed }) => [
        { height: 34, borderWidth: 1.5 },
        raised(pressed, primary ? colors.primaryEdge : colors.edge),
      ]}
      className={`justify-center rounded-[10px] px-3 ${
        primary ? 'border-primary bg-primary' : 'border-edge bg-surface'
      }`}>
      <Text
        className={`text-[13px] font-extrabold ${
          primary ? 'text-primary-foreground' : 'text-foreground'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}
