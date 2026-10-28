import { Text as NativeText, type TextProps } from 'react-native';

import { FONTS } from '@/lib/theme';

/**
 * React Native's Text with the app's fonts: React Native has no app-wide default font, so every
 * text goes through here. The `font-display` class switches to the title font; the weight still
 * comes from the `font-*` weight classes.
 */
export function Text({ style, ...props }: TextProps) {
  const fontFamily = props.className?.includes('font-display') ? FONTS.display : FONTS.sans;
  return <NativeText {...props} style={[{ fontFamily }, style]} />;
}
