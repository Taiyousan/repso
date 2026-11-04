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

/**
 * A card that opens or toggles something: outlined like a card, dims when pressed. Only the primary
 * one gets a bottom edge.
 */
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
      // Disabled, it can't be tapped: no edge.
      style={({ pressed }) => [
        { borderWidth: primary ? 1.5 : 1 },
        primary && !props.disabled ? raised(pressed, colors.primaryEdge) : null,
      ]}
      className={`rounded-2xl ${
        primary
          ? 'border-primary bg-primary'
          : `border-outline active:opacity-70 ${selected ? 'bg-primary-soft' : 'bg-surface'}`
      } ${className}`}
    />
  );
}
