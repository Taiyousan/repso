import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';

import { niceScale } from '@/lib/chart';
import { useThemeColors } from '@/lib/theme';

const AXIS_WIDTH = 36;
const TOP_PADDING = 6;
const LABEL_HEIGHT = 20;
const MAX_BAR_WIDTH = 24;
const CORNER_RADIUS = 4;
/** Room an x label needs on each side of its bar, past which it is anchored to the edge. */
const HALF_LABEL_WIDTH = 20;

export type Bar = { key: string; value: number; label?: string };

type BarChartProps = {
  bars: Bar[];
  /** Highlighted bar, in the accent color. */
  selected: number;
  onSelect: (index: number) => void;
  formatTick: (value: number) => string;
  /** 1 for counts, so ticks stay whole. */
  minStep?: number;
  height?: number;
  accessibilityLabel?: string;
};

/** Columns from a zero baseline with round y ticks; tapping a column selects it. */
export function BarChart({
  bars,
  selected,
  onSelect,
  formatTick,
  minStep,
  height = 160,
  accessibilityLabel,
}: BarChartProps) {
  const colors = useThemeColors();
  const [width, setWidth] = useState(0);

  // At least 1, so empty weeks don't get a flat range widened below zero.
  const scale = niceScale(0, Math.max(1, ...bars.map((bar) => bar.value)), 3, minStep);
  const plotBottom = height - LABEL_HEIGHT;
  const y = (value: number) =>
    plotBottom - ((value - scale.min) / (scale.max - scale.min)) * (plotBottom - TOP_PADDING);
  const slot = (width - AXIS_WIDTH) / bars.length;
  const barWidth = Math.min(MAX_BAR_WIDTH, slot * 0.6);

  const select = (locationX: number) => {
    const index = Math.floor((locationX - AXIS_WIDTH) / slot);
    onSelect(Math.min(bars.length - 1, Math.max(0, index)));
  };

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 ? (
        <Pressable
          onPress={(event) => select(event.nativeEvent.locationX)}
          accessibilityLabel={accessibilityLabel}>
          <Svg width={width} height={height}>
            {scale.ticks.map((tick) => (
              <Line
                key={`grid-${tick}`}
                x1={AXIS_WIDTH}
                x2={width}
                y1={y(tick)}
                y2={y(tick)}
                stroke={colors.border}
                strokeWidth={1}
              />
            ))}
            {scale.ticks.map((tick) => (
              <SvgText
                key={`tick-${tick}`}
                x={AXIS_WIDTH - 6}
                y={y(tick) + 3.5}
                fontSize={10}
                fill={colors.muted}
                textAnchor="end">
                {formatTick(tick)}
              </SvgText>
            ))}

            {bars.map((bar, index) => {
              const center = AXIS_WIDTH + slot * (index + 0.5);
              const top = y(bar.value);
              return bar.value > 0 ? (
                <Path
                  key={bar.key}
                  d={roundedTopBar(center - barWidth / 2, top, barWidth, plotBottom - top)}
                  fill={index === selected ? colors.foreground : colors.primary}
                />
              ) : null;
            })}

            {bars.map((bar, index) => {
              if (!bar.label) return null;
              const center = AXIS_WIDTH + slot * (index + 0.5);
              const anchor =
                center + HALF_LABEL_WIDTH > width
                  ? 'end'
                  : center - HALF_LABEL_WIDTH < AXIS_WIDTH
                    ? 'start'
                    : 'middle';
              return (
                <SvgText
                  key={`label-${bar.key}`}
                  x={anchor === 'end' ? width : anchor === 'start' ? center - barWidth / 2 : center}
                  y={height - 5}
                  fontSize={10}
                  fill={index === selected ? colors.foreground : colors.muted}
                  textAnchor={anchor}>
                  {bar.label}
                </SvgText>
              );
            })}
          </Svg>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Rectangle with rounded top corners, square at the baseline. */
function roundedTopBar(x: number, top: number, width: number, height: number): string {
  const r = Math.min(CORNER_RADIUS, width / 2, height);
  const bottom = top + height;
  return [
    `M${x},${bottom}`,
    `L${x},${top + r}`,
    `Q${x},${top} ${x + r},${top}`,
    `L${x + width - r},${top}`,
    `Q${x + width},${top} ${x + width},${top + r}`,
    `L${x + width},${bottom}`,
    'Z',
  ].join(' ');
}
