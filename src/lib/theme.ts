import { useCSSVariable } from 'uniwind';

const TOKENS = [
  '--color-background',
  '--color-surface',
  '--color-surface-muted',
  '--color-border',
  '--color-edge',
  '--color-foreground',
  '--color-muted',
  '--color-primary',
  '--color-primary-edge',
  '--color-primary-soft',
  '--color-danger',
  '--color-success',
  '--color-success-soft',
  '--color-reward',
  '--color-reward-ink',
] as const;

/** Theme colors as plain values, for props that don't accept class names. */
export function useThemeColors() {
  const [
    background,
    surface,
    surfaceMuted,
    border,
    edge,
    foreground,
    muted,
    primary,
    primaryEdge,
    primarySoft,
    danger,
    success,
    successSoft,
    reward,
    rewardInk,
  ] = useCSSVariable([...TOKENS]) as string[];
  return {
    background,
    surface,
    surfaceMuted,
    border,
    edge,
    foreground,
    muted,
    primary,
    primaryEdge,
    primarySoft,
    danger,
    success,
    successSoft,
    reward,
    rewardInk,
  };
}

/**
 * Font families, built into the app by the expo-font plugin (app.json) with one face per weight:
 * Nunito for text, Baloo 2 for titles and figures. Native families, unlike fonts loaded at
 * runtime, keep their weights below Android 10.
 */
export const FONTS = { sans: 'Nunito', display: 'Baloo2' } as const;
