import { FlashList } from '@shopify/flash-list';
import { useDeferredValue, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TextField } from '@/components/ui/text-field';
import type { Exercise } from '@/db/schema';

import { EQUIPMENT, equipmentLabel } from '../labels';
import { useExerciseList } from '../queries';
import { filterExercises } from '../search';
import { ExerciseListItem } from './exercise-list-item';
import { MuscleFilter } from './muscle-filter';

type Scope = 'essentials' | 'all';

type ExerciseBrowserProps = {
  /** Selection mode, used by the exercise picker. */
  selectedIds?: ReadonlySet<number>;
  onSelect?: (exercise: Exercise) => void;
  /** Space kept free under the list (floating button, bottom bar…). */
  bottomInset?: number;
};

/** Library search: essentials/all scope, text search, muscle and equipment filters, list. */
export function ExerciseBrowser({ selectedIds, onSelect, bottomInset = 96 }: ExerciseBrowserProps) {
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
    <View className="flex-1 gap-3">
      {/* Not flex: horizontal ScrollViews grow to fill a flex parent and stretch their items. */}
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
          extraData={selectedIds}
          keyExtractor={(exercise) => String(exercise.id)}
          renderItem={({ item }) => (
            <ExerciseListItem
              exercise={item}
              onSelect={onSelect}
              selected={selectedIds?.has(item.id)}
            />
          )}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: bottomInset }}
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
    </View>
  );
}
