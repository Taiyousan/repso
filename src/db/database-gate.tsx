import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as SplashScreen from 'expo-splash-screen';
import { type PropsWithChildren, useEffect } from 'react';
import { Text, View } from 'react-native';

import { db } from './client';
import migrations from './migrations/migrations';

/** Runs pending migrations, keeping the splash screen up until the database is ready. */
export function DatabaseGate({ children }: PropsWithChildren) {
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (success || error) SplashScreen.hideAsync();
  }, [success, error]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background p-6">
        <Text className="text-lg font-semibold text-danger">Erreur de base de données</Text>
        <Text className="text-center text-muted">{error.message}</Text>
      </View>
    );
  }

  if (!success) return null;

  return children;
}
