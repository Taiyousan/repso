import { type PropsWithChildren, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useThemeColors } from '@/lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const FILL_DURATION_MS = 600;

type ProgressRingProps = PropsWithChildren<{
  /** 0 to 1. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  /** Fill animation length; short and linear suits a ticking countdown. */
  animationMs?: number;
  /** Turn green when full (progress of a list); off for a countdown. */
  highlightComplete?: boolean;
}>;

/**
 * Circle filling clockwise from the top (animated on the UI thread), turning green when full;
 * children are centered.
 */
export function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 5,
  animationMs = FILL_DURATION_MS,
  highlightComplete = true,
  children,
}: ProgressRingProps) {
  const colors = useThemeColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));

  const animatedProgress = useSharedValue(clamped);

  useEffect(() => {
    animatedProgress.value = withTiming(clamped, {
      duration: animationMs,
      easing: animationMs === FILL_DURATION_MS ? Easing.out(Easing.cubic) : Easing.linear,
    });
  }, [animatedProgress, clamped, animationMs]);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceMuted}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={highlightComplete && clamped >= 1 ? colors.success : colors.foreground}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={arcProps}
          fill="none"
        />
      </Svg>
      {children}
    </View>
  );
}
