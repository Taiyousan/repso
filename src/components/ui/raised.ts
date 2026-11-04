import type { ViewStyle } from 'react-native';

/**
 * The bottom edge of a screen's main action and of the set check button. Pressing pushes the
 * element down onto its edge. Other buttons are flat (pale fill), containers and fields never get
 * it: the fewer edges on a screen, the more the one that matters stands out.
 */
export function raised(pressed: boolean, color: string, offset = 3): ViewStyle {
  return pressed
    ? { transform: [{ translateY: offset }] }
    : { boxShadow: `0px ${offset}px 0px ${color}` };
}
