import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

type SymbolName = Exclude<ComponentProps<typeof SymbolView>['name'], string>;

type IconProps = {
  /** SF Symbol (iOS) and Material Symbol (Android) names. */
  name: Required<Pick<SymbolName, 'ios' | 'android'>>;
  size?: number;
  color: ColorValue;
};

export function Icon({ name, size = 24, color }: IconProps) {
  return <SymbolView name={name} size={size} tintColor={color} />;
}
