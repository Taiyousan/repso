import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as SplashScreen from 'expo-splash-screen';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { seedExerciseLibrary } from '@/features/exercises/library';
import { discardDraftWorkoutTemplates } from '@/features/programs/mutations';

import { db } from './client';
import migrations from './migrations/migrations';

/**
 * Runs pending migrations, imports the exercise library and drops abandoned drafts, keeping the
 * splash screen up until the database is ready.
 */
export function DatabaseGate({ children }: PropsWithChildren) {
  const migration = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<Error | null>(null);
  const error = migration.error ?? seedError;

  useEffect(() => {
    if (!migration.success) return;
    Promise.resolve()
      .then(() => {
        seedExerciseLibrary();
        discardDraftWorkoutTemplates();
      })
      .then(
        () => setSeeded(true),
        (e: unknown) => setSeedError(e instanceof Error ? e : new Error(String(e))),
      );
  }, [migration.success]);

  useEffect(() => {
    if (seeded || error) SplashScreen.hideAsync();
  }, [seeded, error]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background p-6">
        <Text className="text-lg font-semibold text-danger">Erreur de base de données</Text>
        <Text className="text-center text-muted">{error.message}</Text>
      </View>
    );
  }

  if (!seeded) return null;

  return children;
}
