import { FlashList } from '@shopify/flash-list';
import { Link } from 'expo-router';
import { useDeferredValue, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { ExerciseListItem } from '@/features/exercises/components/exercise-list-item';
import { EQUIPMENT, equipmentLabel, MUSCLES, muscleLabel } from '@/features/exercises/labels';
import { useExerciseList } from '@/features/exercises/queries';
import { filterExercises } from '@/features/exercises/search';

export default function ExercisesScreen() {
  const { data: exercises } = useExerciseList();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(
    () => filterExercises(exercises, { query: deferredQuery, muscle, equipment }),
    [exercises, deferredQuery, muscle, equipment],
  );

  return (
    <Screen title="Exercices" scrollable={false}>
      <View className="gap-3">
        <View className="px-4">
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder={`Rechercher parmi ${exercises.length} exercices`}
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        <FilterRow
          options={MUSCLES}
          selected={muscle}
          onSelect={setMuscle}
          getLabel={muscleLabel}
        />
        <FilterRow
          options={EQUIPMENT}
          selected={equipment}
          onSelect={setEquipment}
          getLabel={equipmentLabel}
        />
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
                description="Modifie ta recherche ou crée ton propre exercice."
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

type FilterRowProps<T extends string> = {
  options: readonly T[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  getLabel: (value: T) => string;
};

function FilterRow<T extends string>({ options, selected, onSelect, getLabel }: FilterRowProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-4"
      keyboardShouldPersistTaps="handled">
      {options.map((option) => (
        <Chip
          key={option}
          label={getLabel(option)}
          selected={selected === option}
          onPress={() => onSelect(selected === option ? null : option)}
        />
      ))}
    </ScrollView>
  );
}
