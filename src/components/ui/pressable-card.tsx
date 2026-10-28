import { Pressable, type PressableProps } from 'react-native';

import { useThemeColors } from '@/lib/theme';

import { raised } from './raised';

type PressableCardProps = Omit<PressableProps, 'style'> & {
  className?: string;
  /** Selected look (yellow), for a card that toggles. */
  selected?: boolean;
};

/** A card that opens or toggles something: outlined like a card, raised like a button. */
export function PressableCard({ className = '', selected = false, ...props }: PressableCardProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      // Disabled, it can't be tapped: no shadow.
      style={({ pressed }) => [
        { borderWidth: 2 },
        props.disabled ? null : raised(pressed, colors.ink),
      ]}
      className={`rounded-2xl border-ink ${selected ? 'bg-primary' : 'bg-surface'} ${className}`}
    />
  );
}
