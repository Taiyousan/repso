import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useThemeColors } from '@/lib/theme';

type ProgressRingProps = PropsWithChildren<{
  /** 0 to 1. */
  progress: number;
  size?: number;
  strokeWidth?: number;
}>;

/** Circle filling clockwise from the top, turning green when full; children are centered. */
export function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 5,
  children,
}: ProgressRingProps) {
  const colors = useThemeColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));

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
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={clamped >= 1 ? colors.success : colors.primary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped)}
          fill="none"
        />
      </Svg>
      {children}
    </View>
  );
}
