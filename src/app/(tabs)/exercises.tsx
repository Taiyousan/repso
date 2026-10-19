import { FlashList } from '@shopify/flash-list';
import { Link } from 'expo-router';
import { useDeferredValue, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TextField } from '@/components/ui/text-field';
import { ExerciseListItem } from '@/features/exercises/components/exercise-list-item';
import { MuscleFilter } from '@/features/exercises/components/muscle-filter';
import { EQUIPMENT, equipmentLabel } from '@/features/exercises/labels';
import { useExerciseList } from '@/features/exercises/queries';
import { filterExercises } from '@/features/exercises/search';

type Scope = 'essentials' | 'all';

export default function ExercisesScreen() {
  const { data: exercises } = useExerciseList();
  const [scope, setScope] = useState<Scope>('essentials');
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const essentialsCount = useMemo(
    () => exercises.filter((exercise) => exercise.isEssential || exercise.isCustom).length,
    [exercises],
  );

  const results = useMemo(
    () =>
      filterExercises(exercises, {
        query: deferredQuery,
        muscle,
        equipment,
        essentialsOnly: scope === 'essentials',
      }),
    [exercises, deferredQuery, muscle, equipment, scope],
  );

  return (
    <Screen title="Exercices" scrollable={false}>
      <View className="gap-3">
        <View className="gap-3 px-4">
          <SegmentedControl
            options={[
              { value: 'essentials', label: `Essentiels (${essentialsCount})` },
              { value: 'all', label: `Tous (${exercises.length})` },
            ]}
            value={scope}
            onChange={setScope}
          />
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher (français ou anglais)"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        <MuscleFilter selected={muscle} onSelect={setMuscle} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-4"
          keyboardShouldPersistTaps="handled">
          {EQUIPMENT.map((item) => (
            <Chip
              key={item}
              label={equipmentLabel(item)}
              selected={equipment === item}
              onPress={() => setEquipment(equipment === item ? null : item)}
            />
          ))}
        </ScrollView>
      </View>

      <View className="flex-1">
        <FlashList
          data={results}
          keyExtractor={(exercise) => String(exercise.id)}
          renderItem={({ item }) => <ExerciseListItem exercise={item} />}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: 96 }}
          ListEmptyComponent={
            <View className="px-4 pt-4">
              <EmptyState
                title="Aucun exercice trouvé"
                description={
                  scope === 'essentials'
                    ? 'Essaie dans « Tous » ou crée ton propre exercice.'
                    : 'Modifie ta recherche ou crée ton propre exercice.'
                }
              />
            </View>
          }
        />
      </View>

      <Link href="/exercises/new" asChild>
        <Pressable
          accessibilityLabel="Créer un exercice"
          className="absolute right-4 bottom-4 size-14 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-80">
          <Text className="text-3xl leading-8 text-primary-foreground">+</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}
