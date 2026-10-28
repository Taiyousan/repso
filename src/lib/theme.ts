import { useCSSVariable } from 'uniwind';

const TOKENS = [
  '--color-background',
  '--color-surface',
  '--color-surface-muted',
  '--color-border',
  '--color-ink',
  '--color-foreground',
  '--color-muted',
  '--color-primary',
  '--color-primary-soft',
  '--color-danger',
  '--color-success',
  '--color-success-soft',
] as const;

/** Theme colors as plain values, for props that don't accept class names. */
export function useThemeColors() {
  const [
    background,
    surface,
    surfaceMuted,
    border,
    ink,
    foreground,
    muted,
    primary,
    primarySoft,
    danger,
    success,
    successSoft,
  ] = useCSSVariable([...TOKENS]) as string[];
  return {
    background,
    surface,
    surfaceMuted,
    border,
    ink,
    foreground,
    muted,
    primary,
    primarySoft,
    danger,
    success,
    successSoft,
  };
}

/** Font families, loaded in the root layout: Figtree for text, Unbounded for titles and figures. */
export const FONTS = { sans: 'Figtree', display: 'Unbounded' } as const;
