import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { niceScale } from '@/lib/chart';
import { useThemeColors } from '@/lib/theme';

const AXIS_WIDTH = 36;
/** Keeps the end markers and their ring inside the drawing. */
const EDGE_PADDING = 8;
const LABEL_HEIGHT = 20;
/** Past this many points, only the last and the selected one get a marker. */
const MAX_MARKERS = 24;

export type LinePoint = { key: string | number; x: number; y: number; label?: string };

type LineChartProps = {
  /** Sorted by x. */
  points: LinePoint[];
  selected: number;
  onSelect: (index: number) => void;
  formatTick: (value: number) => string;
  height?: number;
  accessibilityLabel?: string;
};

/**
 * Line over x values (e.g. dates) with a light area wash; the y axis fits the data rather than
 * starting at zero, so progress stays visible. Tapping selects the nearest point.
 */
export function LineChart({
  points,
  selected,
  onSelect,
  formatTick,
  height = 180,
  accessibilityLabel,
}: LineChartProps) {
  const colors = useThemeColors();
  const [width, setWidth] = useState(0);

  const ys = points.map((point) => point.y);
  const scale = niceScale(Math.min(...ys), Math.max(...ys));
  const plotBottom = height - LABEL_HEIGHT;
  const left = AXIS_WIDTH + EDGE_PADDING;
  const right = width - EDGE_PADDING;
  const minX = points[0].x;
  const spanX = points.at(-1)!.x - minX;

  const x = (value: number) =>
    spanX === 0 ? (left + right) / 2 : left + ((value - minX) / spanX) * (right - left);
  const y = (value: number) =>
    plotBottom - ((value - scale.min) / (scale.max - scale.min)) * (plotBottom - EDGE_PADDING);

  const line = points.map((point, index) => `${index ? 'L' : 'M'}${x(point.x)},${y(point.y)}`);
  const area = `${line.join(' ')} L${x(points.at(-1)!.x)},${plotBottom} L${x(minX)},${plotBottom} Z`;

  const select = (locationX: number) => {
    let nearest = 0;
    points.forEach((point, index) => {
      if (Math.abs(x(point.x) - locationX) < Math.abs(x(points[nearest].x) - locationX)) {
        nearest = index;
      }
    });
    onSelect(nearest);
  };

  const marker = (index: number, radius: number) => (
    <Circle
      key={`marker-${points[index].key}`}
      cx={x(points[index].x)}
      cy={y(points[index].y)}
      r={radius}
      fill={colors.primary}
      stroke={colors.surface}
      strokeWidth={2}
    />
  );
  const markerIndexes =
    points.length <= MAX_MARKERS ? points.map((_, index) => index) : [points.length - 1];
  const first = points[0];
  const last = points.at(-1)!;

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

            <Line
              x1={x(points[selected].x)}
              x2={x(points[selected].x)}
              y1={EDGE_PADDING}
              y2={plotBottom}
              stroke={colors.muted}
              strokeWidth={1}
            />
            {points.length > 1 ? (
              <>
                <Path d={area} fill={colors.primary} fillOpacity={0.1} />
                <Path
                  d={line.join(' ')}
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </>
            ) : null}
            {markerIndexes.filter((index) => index !== selected).map((index) => marker(index, 4))}
            {marker(selected, 6)}

            {first.label ? (
              <SvgText
                x={points.length > 1 ? left - EDGE_PADDING : x(first.x)}
                y={height - 5}
                fontSize={10}
                fill={colors.muted}
                textAnchor={points.length > 1 ? 'start' : 'middle'}>
                {first.label}
              </SvgText>
            ) : null}
            {points.length > 1 && last.label ? (
              <SvgText x={width} y={height - 5} fontSize={10} fill={colors.muted} textAnchor="end">
                {last.label}
              </SvgText>
            ) : null}
          </Svg>
        </Pressable>
      ) : null}
    </View>
  );
}
