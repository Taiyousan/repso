/** What the app is built with, credited in the Licences screen. */

export type Credit = { name: string; author: string; license: string; url: string };

export const DATA_CREDITS: Credit[] = [
  {
    name: 'free-exercise-db',
    author: 'Yuhonas',
    license: 'Domaine public (Unlicense)',
    url: 'https://github.com/yuhonas/free-exercise-db',
  },
];

export const FONT_CREDITS: Credit[] = [
  {
    name: 'Baloo 2',
    author: 'Ek Type',
    license: 'SIL Open Font License 1.1',
    url: 'https://fonts.google.com/specimen/Baloo+2',
  },
  {
    name: 'Nunito',
    author: 'Vernon Adams, Cyreal, Jacques Le Bailly',
    license: 'SIL Open Font License 1.1',
    url: 'https://fonts.google.com/specimen/Nunito',
  },
  {
    name: 'Material Symbols',
    author: 'Google',
    license: 'Apache 2.0',
    url: 'https://fonts.google.com/icons',
  },
];

/** Runtime dependencies of package.json; a test keeps the list in step with it. */
export const LIBRARY_CREDITS: Credit[] = [
  {
    name: 'React Native',
    author: 'Meta Platforms',
    license: 'MIT',
    url: 'https://github.com/facebook/react-native',
  },
  {
    name: 'React',
    author: 'Meta Platforms',
    license: 'MIT',
    url: 'https://github.com/facebook/react',
  },
  {
    name: 'Expo et ses modules',
    author: '650 Industries',
    license: 'MIT',
    url: 'https://github.com/expo/expo',
  },
  {
    name: 'Expo Google Fonts',
    author: 'Expo',
    license: 'MIT',
    url: 'https://github.com/expo/google-fonts',
  },
  {
    name: 'Drizzle ORM',
    author: 'Drizzle Team',
    license: 'Apache 2.0',
    url: 'https://github.com/drizzle-team/drizzle-orm',
  },
  {
    name: 'FlashList',
    author: 'Shopify',
    license: 'MIT',
    url: 'https://github.com/Shopify/flash-list',
  },
  {
    name: 'React Native Body Highlighter',
    author: 'HichamELBSI',
    license: 'MIT',
    url: 'https://github.com/HichamELBSI/react-native-body-highlighter',
  },
  {
    name: 'React Native Gesture Handler, Reanimated, Screens, SVG et Worklets',
    author: 'Software Mansion',
    license: 'MIT',
    url: 'https://github.com/software-mansion',
  },
  {
    name: 'React Native Safe Area Context',
    author: 'App & Flow',
    license: 'MIT',
    url: 'https://github.com/AppAndFlow/react-native-safe-area-context',
  },
  {
    name: 'React Native Sortables',
    author: 'Mateusz Łopaciński',
    license: 'MIT',
    url: 'https://github.com/MatiPl01/react-native-sortables',
  },
  {
    name: 'Tailwind CSS',
    author: 'Tailwind Labs',
    license: 'MIT',
    url: 'https://github.com/tailwindlabs/tailwindcss',
  },
  {
    name: 'Uniwind',
    author: 'Unistack',
    license: 'MIT',
    url: 'https://github.com/uni-stack/uniwind',
  },
  {
    name: 'Zustand',
    author: 'Poimandres',
    license: 'MIT',
    url: 'https://github.com/pmndrs/zustand',
  },
];

/** Which credit covers each runtime dependency. */
export const DEPENDENCY_CREDITS: Record<string, string> = {
  '@expo-google-fonts/baloo-2': 'Expo Google Fonts',
  '@expo-google-fonts/nunito': 'Expo Google Fonts',
  '@shopify/flash-list': 'FlashList',
  'drizzle-orm': 'Drizzle ORM',
  react: 'React',
  'react-native': 'React Native',
  'react-native-body-highlighter': 'React Native Body Highlighter',
  'react-native-gesture-handler':
    'React Native Gesture Handler, Reanimated, Screens, SVG et Worklets',
  'react-native-reanimated': 'React Native Gesture Handler, Reanimated, Screens, SVG et Worklets',
  'react-native-safe-area-context': 'React Native Safe Area Context',
  'react-native-screens': 'React Native Gesture Handler, Reanimated, Screens, SVG et Worklets',
  'react-native-sortables': 'React Native Sortables',
  'react-native-svg': 'React Native Gesture Handler, Reanimated, Screens, SVG et Worklets',
  'react-native-worklets': 'React Native Gesture Handler, Reanimated, Screens, SVG et Worklets',
  tailwindcss: 'Tailwind CSS',
  uniwind: 'Uniwind',
  zustand: 'Zustand',
};
