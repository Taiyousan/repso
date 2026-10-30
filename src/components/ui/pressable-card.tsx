import { Pressable, type PressableProps } from 'react-native';

import { useThemeColors } from '@/lib/theme';

import { raised } from './raised';

type PressableCardProps = Omit<PressableProps, 'style'> & {
  className?: string;
  /** Selected look (pale blue), for a card that toggles. */
  selected?: boolean;
  /** The screen's main thing to open, in blue. Its text has to be `primary-foreground`. */
  primary?: boolean;
};

/** A card that opens or toggles something: outlined like a card, with a button's bottom edge. */
export function PressableCard({
  className = '',
  selected = false,
  primary = false,
  ...props
}: PressableCardProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      // Disabled, it can't be tapped: no shadow.
      style={({ pressed }) => [
        { borderWidth: 1.5 },
        props.disabled ? null : raised(pressed, primary ? colors.primaryEdge : colors.edge),
      ]}
      className={`rounded-2xl ${
        primary
          ? 'border-primary bg-primary'
          : `border-edge ${selected ? 'bg-primary-soft' : 'bg-surface'}`
      } ${className}`}
    />
  );
}
