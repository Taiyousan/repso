import type { ViewStyle } from 'react-native';

/**
 * The bottom edge that marks what can be tapped. Pressing pushes the element down onto its edge.
 * Containers and fields never get it: in this design, an edge means "this is a button".
 */
export function raised(pressed: boolean, color: string, offset = 3): ViewStyle {
  return pressed
    ? { transform: [{ translateY: offset }] }
    : { boxShadow: `0px ${offset}px 0px ${color}` };
}
