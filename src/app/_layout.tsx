import '@/global.css';
// Registers the notification handler and clears timer notifications left by a previous run.
import '@/features/sessions/timer';

import { DefaultTheme, type ErrorBoundaryProps, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Uniwind } from 'uniwind';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { DatabaseGate } from '@/db/database-gate';
import { useTimerCompletion } from '@/features/sessions/use-timer-ticker';
import { FONTS, useThemeColors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();
// The design is light only, whatever the system setting.
Uniwind.setTheme('light');

export default function RootLayout() {
  const colors = useThemeColors();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DefaultTheme}>
        <StatusBar style="dark" />
        <TimerCompletion />
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

/** On its own so the timer starting or stopping doesn't render the whole navigator again. */
function TimerCompletion() {
  useTimerCompletion();
  return null;
}

/** Shown by Expo Router instead of the app when a screen fails, rather than closing the app. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  // The failure may come before the splash screen was hidden.
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <View className="flex-1 justify-center gap-4 bg-background p-6">
      <Text className="font-display text-xl font-bold text-foreground">
        Une erreur est survenue
      </Text>
      <Text className="text-muted">
        Tes entraînements enregistrés ne sont pas touchés. Réessaie ; si le problème revient, ferme
        et relance l’app.
      </Text>
      <Text className="text-xs text-muted" selectable>
        {error.message}
      </Text>
      <Button label="Réessayer" onPress={retry} />
    </View>
  );
}
