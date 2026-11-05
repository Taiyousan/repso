import * as Haptics from 'expo-haptics';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { Text } from './text';

type StampProps = {
  label: string;
  /** Ink and border color. */
  color: string;
  /** Paper behind the ink, so the stamp covers what it overlaps. */
  background: string;
  /** Resting tilt, in degrees. */
  tilt: number;
  /** Lands with a thud (scale down + vibration) instead of being already there. */
  animate?: boolean;
  delay?: number;
  size?: 'md' | 'sm';
};

/**
 * Rubber-stamp label for the app's two highlights, a finished workout and a record. The only
 * animation in the app: keep it to those moments.
 */
export function Stamp({
  label,
  color,
  background,
  tilt,
  animate = false,
  delay = 0,
  size = 'md',
}: StampProps) {
  const reducedMotion = useReducedMotion();
  const landing = animate && !reducedMotion;

  return (
    <Animated.View
      style={[
        {
          borderColor: color,
          backgroundColor: background,
          borderWidth: size === 'md' ? 3 : 2.5,
          borderRadius: size === 'md' ? 10 : 8,
          paddingHorizontal: size === 'md' ? 14 : 10,
          transform: [{ rotate: `${tilt}deg` }],
        },
        landing
          ? {
              animationName: {
                from: { opacity: 0, transform: [{ scale: 1.7 }, { rotate: `${tilt - 10}deg` }] },
                '65%': { opacity: 1, transform: [{ scale: 0.94 }, { rotate: `${tilt + 1}deg` }] },
                to: { opacity: 1, transform: [{ scale: 1 }, { rotate: `${tilt}deg` }] },
              },
              animationDuration: 420,
              animationDelay: delay,
              animationTimingFunction: 'ease-out',
              animationFillMode: 'backwards',
            }
          : null,
      ]}
      onCSSAnimationEnd={
        landing ? () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) : undefined
      }>
      <Text
        className={`font-display font-extrabold uppercase ${size === 'md' ? 'text-[19px]' : 'text-[15px]'}`}
        style={{ color, letterSpacing: size === 'md' ? 0.8 : 0.9 }}>
        {label}
      </Text>
    </Animated.View>
  );
}
