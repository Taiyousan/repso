import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ExerciseBrowser } from '@/features/exercises/components/exercise-browser';
import type { Resolution } from '@/features/programs/transfer/plan';
import { useImportStore } from '@/features/programs/transfer/store';

/** Replaces how one exercise of the imported program is matched. */
export default function ImportExerciseScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const insets = useSafeAreaInsets();
  const ref = useImportStore((state) => state.draft?.refs.find((item) => item.key === key));
  const resolution = useImportStore((state) => state.draft?.resolutions[key]);
  const resolve = useImportStore((state) => state.resolve);
  const currentId = resolution?.kind === 'library' ? resolution.exerciseId : null;
  const selectedIds = useMemo(() => new Set(currentId === null ? [] : [currentId]), [currentId]);

  if (!ref || !resolution) {
    return (
      <View className="flex-1 bg-background p-4">
        <EmptyState title="Import introuvable" />
      </View>
    );
  }

  const choose = (next: Resolution) => {
    resolve(key, next);
    router.back();
  };

  return (
    <View className="flex-1 gap-3 bg-background pt-3">
      <View className="gap-3 px-4">
        <Text className="text-muted">
          Dans le programme : <Text className="font-semibold text-foreground">{ref.label}</Text>.
          Choisis l’exercice correspondant, crée-le comme exercice perso ou retire-le.
        </Text>
        <View className="flex-row gap-2">
          {resolution.kind === 'library' && resolution.toCheck ? (
            <View className="flex-1">
              <Button
                label="Confirmer"
                onPress={() => choose({ kind: 'library', exerciseId: resolution.exerciseId })}
              />
            </View>
          ) : null}
          <View className="flex-1">
            <Button label="Créer" variant="secondary" onPress={() => choose({ kind: 'create' })} />
          </View>
          <View className="flex-1">
            <Button label="Retirer" variant="danger" onPress={() => choose({ kind: 'skip' })} />
          </View>
        </View>
      </View>
      <ExerciseBrowser
        initialQuery={ref.entry.name ?? ''}
        selectedIds={selectedIds}
        onSelect={(exercise) => choose({ kind: 'library', exerciseId: exercise.id })}
        bottomInset={insets.bottom + 16}
      />
    </View>
  );
}
