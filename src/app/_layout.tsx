import '@/global.css';
// Registers the notification handler and clears timer notifications left by a previous run.
import '@/features/sessions/timer';

import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
} from '@expo-google-fonts/figtree';
import {
  Unbounded_500Medium,
  Unbounded_700Bold,
  Unbounded_800ExtraBold,
} from '@expo-google-fonts/unbounded';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Uniwind } from 'uniwind';

import { DatabaseGate } from '@/db/database-gate';
import { FONTS, useThemeColors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();
// The design is light only, whatever the system setting.
Uniwind.setTheme('light');

/** Each family declares its weights, so the `font-*` weight classes pick the right face. */
const FONT_FAMILIES = [
  {
    fontFamily: FONTS.sans,
    fontDefinitions: [
      { path: Figtree_400Regular, weight: 400 },
      { path: Figtree_500Medium, weight: 500 },
      { path: Figtree_600SemiBold, weight: 600 },
      { path: Figtree_700Bold, weight: 700 },
      { path: Figtree_800ExtraBold, weight: 800 },
    ],
  },
  {
    fontFamily: FONTS.display,
    fontDefinitions: [
      { path: Unbounded_500Medium, weight: 500 },
      { path: Unbounded_700Bold, weight: 700 },
      { path: Unbounded_800ExtraBold, weight: 800 },
    ],
  },
];

export default function RootLayout() {
  const colors = useThemeColors();
  const [fontsLoaded, fontError] = useFonts(FONT_FAMILIES);

  // The splash screen stays up until the fonts and then the database are ready.
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DefaultTheme}>
        <StatusBar style="dark" />
        <DatabaseGate>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.foreground,
              headerTitleStyle: { fontFamily: FONTS.display, fontWeight: '700', fontSize: 17 },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.background },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="exercises/[id]" options={{ title: '' }} />
            <Stack.Screen name="exercises/edit/[id]" options={{ title: "Modifier l'exercice" }} />
            <Stack.Screen name="exercises/new" options={{ title: 'Nouvel exercice' }} />
            <Stack.Screen name="settings" options={{ title: 'Réglages' }} />
            <Stack.Screen name="programs/new" options={{ title: 'Nouveau programme' }} />
            <Stack.Screen name="programs/[id]" options={{ title: '' }} />
            <Stack.Screen name="programs/edit/[id]" options={{ title: 'Modifier le programme' }} />
            <Stack.Screen name="programs/import" options={{ title: 'Importer un programme' }} />
            <Stack.Screen
              name="programs/export"
              options={{ title: 'Exporter un programme', presentation: 'modal' }}
              dangerouslySingular
            />
            <Stack.Screen
              name="programs/import-exercise"
              options={{ title: 'Exercice importé' }}
              dangerouslySingular
            />
            <Stack.Screen name="workouts/[id]" options={{ title: '' }} />
            <Stack.Screen name="workouts/new/[id]" options={{ title: 'Nouvelle séance' }} />
            <Stack.Screen name="workouts/edit/[id]" options={{ title: 'Modifier la séance' }} />
            <Stack.Screen
              name="workouts/add-exercises/[id]"
              options={{ title: 'Ajouter des exercices' }}
              // A slow push tapped twice must not stack the catalog twice.
              dangerouslySingular
            />
            <Stack.Screen name="session/[id]" options={{ title: '' }} />
            <Stack.Screen name="timer" options={{ title: 'Minuteur', presentation: 'modal' }} />
            <Stack.Screen
              name="session/tags/[id]"
              options={{ title: 'Tags', presentation: 'modal' }}
              dangerouslySingular
            />
            <Stack.Screen
              name="session/add-exercises/[id]"
              options={{ title: 'Ajouter des exercices' }}
              // A slow push tapped twice must not stack the catalog twice.
              dangerouslySingular
            />
          </Stack>
        </DatabaseGate>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
