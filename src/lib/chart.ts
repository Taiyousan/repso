export type Scale = { min: number; max: number; ticks: number[] };

/** Rounds a raw step up to 1, 2, 2.5 or 5 times a power of ten. */
function niceStep(raw: number): number {
  const power = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / power;
  const nice =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * power;
}

/**
 * Axis covering [min, max] with round ticks, about `tickCount` of them. `minStep` keeps counts
 * (e.g. sessions) on whole numbers. A flat range is widened so the data sits mid-height.
 */
export function niceScale(min: number, max: number, tickCount = 3, minStep = 0): Scale {
  if (max <= min) {
    const padding = Math.abs(min) * 0.1 || 1;
    min -= padding;
    max += padding;
  }
  const step = Math.max(minStep, niceStep((max - min) / (tickCount - 1)));
  const low = Math.floor(min / step) * step;
  const high = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  // Rounded to the step's precision: repeated float additions drift (0.30000000000000004).
  for (let index = 0; low + index * step <= high + step / 1000; index++) {
    ticks.push(Number((low + index * step).toPrecision(12)));
  }
  return { min: low, max: high, ticks };
}

/** 12.5 -> "12,5", 1200 -> "1 200" (narrow no-break space between thousands). */
export function formatNumber(value: number, decimals = 1): string {
  const factor = 10 ** decimals;
  const [integer, fraction] = String(Math.round(value * factor) / factor).split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return fraction ? `${grouped},${fraction}` : grouped;
}

/** Axis ticks: 800 -> "800", 2500 -> "2,5 k", 12000 -> "12 k". */
export function formatCompact(value: number): string {
  if (Math.abs(value) < 1000) return formatNumber(value);
  return `${formatNumber(value / 1000)} k`;
}

/** Color between two "#rrggbb" colors (t from 0 to 1), for steps of a sequential scale. */
export function mixColors(from: string, to: string, t: number): string {
  const parse = (hex: string) =>
    /^#[0-9a-f]{6}$/i.test(hex) &&
    hex
      .slice(1)
      .match(/../g)!
      .map((pair) => parseInt(pair, 16));
  const a = parse(from);
  const b = parse(to);
  if (!a || !b) return to;
  return `#${a
    .map((channel, index) =>
      Math.round(channel + (b[index] - channel) * t)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}
