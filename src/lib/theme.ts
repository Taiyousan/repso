import { useCSSVariable } from 'uniwind';

const TOKENS = [
  '--color-background',
  '--color-surface',
  '--color-surface-muted',
  '--color-border',
  '--color-foreground',
  '--color-muted',
  '--color-primary',
  '--color-primary-soft',
] as const;

/** Theme colors as plain values, for props that don't accept class names. */
export function useThemeColors() {
  const [background, surface, surfaceMuted, border, foreground, muted, primary, primarySoft] =
    useCSSVariable([...TOKENS]) as string[];
  return { background, surface, surfaceMuted, border, foreground, muted, primary, primarySoft };
}
