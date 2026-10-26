import '@/global.css';
// Registers the notification handler and clears timer notifications left by a previous run.
import '@/features/sessions/timer';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DatabaseGate } from '@/db/database-gate';
import { useThemeColors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style="auto" />
        <DatabaseGate>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.foreground,
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
            <Stack.Screen name="workouts/[id]" options={{ title: '' }} />
            <Stack.Screen name="workouts/new/[id]" options={{ title: 'Nouvelle séance' }} />
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
