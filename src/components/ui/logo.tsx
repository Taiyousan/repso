import Svg, { G, Rect } from 'react-native-svg';

/** The tilted dumbbell of the app icon, drawn for a blue background. */
export function Logo({ size = 30, color, ends }: { size?: number; color: string; ends: string }) {
  return (
    // Same drawing as the icon (108 units), cropped to the dumbbell.
    <Svg width={size} height={size} viewBox="14 14 80 80">
      <G transform="rotate(-35 54 54)">
        <Rect x={38} y={50} width={32} height={8} fill={color} />
        <Rect x={28} y={36} width={10} height={36} rx={3} fill={color} />
        <Rect x={70} y={36} width={10} height={36} rx={3} fill={color} />
        <Rect x={21} y={43} width={7} height={22} rx={3} fill={ends} />
        <Rect x={80} y={43} width={7} height={22} rx={3} fill={ends} />
      </G>
    </Svg>
  );
}
