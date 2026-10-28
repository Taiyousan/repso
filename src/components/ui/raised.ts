import type { ViewStyle } from 'react-native';

/**
 * The offset shadow that marks what can be tapped. Pressing pushes the element into its shadow.
 * Containers and fields never get it: in this design, a shadow means "this is a button".
 */
export function raised(pressed: boolean, color: string, offset = 3): ViewStyle {
  return pressed
    ? { transform: [{ translateX: offset }, { translateY: offset }] }
    : { boxShadow: `${offset}px ${offset}px 0px ${color}` };
}
