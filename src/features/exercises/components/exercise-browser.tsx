import { FlashList } from '@shopify/flash-list';
import { useDeferredValue, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import type { Exercise } from '@/db/schema';
import { useRecentExerciseIds } from '@/features/sessions/queries';
import { useThemeColors } from '@/lib/theme';

import { MUSCLES } from '../labels';
import { useExerciseList } from '../queries';
import { filterExercises } from '../search';
import { ExerciseCard } from './exercise-card';
import { ExerciseFilters, type Scope } from './exercise-filters';
import { MuscleTile } from './muscle-filter';

/** Recently done exercises shown first, three rows of two at most. */
const RECENT_COUNT = 6;

type ExerciseBrowserProps = {
  /** Selection mode, used by the exercise picker. */
  selectedIds?: ReadonlySet<number>;
  onSelect?: (exercise: Exercise) => void;
  /** Space kept free under the list (floating button, bottom bar…). */
  bottomInset?: number;
  /** Opens the search field already filled in. */
  initialQuery?: string;
};

/** Library search: essentials/all scope, text search, muscle and equipment filters, list. */
export function ExerciseBrowser({
  selectedIds,
  onSelect,
  bottomInset = 96,
  initialQuery = '',
}: ExerciseBrowserProps) {
  const { data: exercises } = useExerciseList();
  const recentIds = useRecentExerciseIds();
  // A prefilled search looks for one given exercise, wherever it is in the library.
  const [scope, setScope] = useState<Scope>(initialQuery ? 'all' : 'essentials');
  const [query, setQuery] = useState(initialQuery);
  const [muscle, setMuscle] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(initialQuery !== '');
  const deferredQuery = useDeferredValue(query);
  const activeFilters = (muscle ? 1 : 0) + (equipment ? 1 : 0);

  const essentialsCount = useMemo(
    () => exercises.filter((exercise) => exercise.isEssential || exercise.isCustom).length,
    [exercises],
  );

  /** Every match, scope aside. */
  const matches = useMemo(
    () =>
      filterExercises(exercises, {
        query: deferredQuery,
        muscle,
        equipment,
        essentialsOnly: false,
      }),
    [exercises, deferredQuery, muscle, equipment],
  );

  const { recent, others, hiddenByScope } = useMemo(() => {
    // Recently done exercises come first whatever the filters, even outside the essentials:
    // the user knows them, hiding one behind the scope would just be puzzling.
    const rank = new Map(recentIds.map((exerciseId, index) => [exerciseId, index]));
    const recent = matches
      .filter((exercise) => rank.has(exercise.id))
      .sort((a, b) => rank.get(a.id)! - rank.get(b.id)!)
      .slice(0, RECENT_COUNT);

    const shown = new Set(recent.map((exercise) => exercise.id));
    const inScope = (exercise: Exercise) =>
      scope === 'all' || exercise.isEssential || exercise.isCustom;
    const rest = matches.filter((exercise) => !shown.has(exercise.id));

    return {
      recent,
      others: rest.filter(inScope),
      // The scope lives in the overlay now, so the list itself offers to widen it.
      hiddenByScope: rest.filter((exercise) => !inScope(exercise)).length,
    };
  }, [matches, recentIds, scope]);

  return (
    <View className="flex-1 gap-3">
      {/* Not flex: horizontal ScrollViews grow to fill a flex parent and stretch their items. */}
      <View className="gap-2">
        {searchOpen ? (
          <View className="px-4">
            <TextField
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher (français ou anglais)"
              // A prefilled search shows its results first; reopened by the user, it wants typing.
              autoFocus={query !== initialQuery || !initialQuery}
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        ) : null}
        {/* One row for everything: search, filters, then a tile per muscle. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-4"
          keyboardShouldPersistTaps="handled">
          <ActionTile
            icon={{ ios: 'magnifyingglass', android: 'search' }}
            label="Rechercher"
            active={searchOpen}
            onPress={() => {
              // Closing clears the search, so what is shown always matches the row.
              if (searchOpen) setQuery('');
              setSearchOpen(!searchOpen);
            }}
          />
          <ActionTile
            icon={{ ios: 'line.3.horizontal.decrease', android: 'tune' }}
            label="Filtres"
            active={activeFilters > 0}
            badge={activeFilters}
            onPress={() => setFiltersOpen(true)}
          />
          {MUSCLES.map((item) => (
            <MuscleTile
              key={item}
              muscle={item}
              selected={muscle === item}
              onPress={() => setMuscle(muscle === item ? null : item)}
            />
          ))}
        </ScrollView>
      </View>

      <View className="flex-1">
        <FlashList
          data={others}
          numColumns={2}
          extraData={selectedIds}
          keyExtractor={(exercise) => String(exercise.id)}
          renderItem={({ item }) => (
            <View className="flex-1 p-1.5">
              <ExerciseCard
                exercise={item}
                onSelect={onSelect}
                selected={selectedIds?.has(item.id)}
              />
            </View>
          )}
          ListHeaderComponent={
            recent.length > 0 ? (
              <View>
                <SectionTitle label="Exécuté récemment" />
                <View className="flex-row flex-wrap">
                  {recent.map((exercise) => (
                    <View key={exercise.id} className="w-1/2 p-1.5">
                      <ExerciseCard
                        exercise={exercise}
                        onSelect={onSelect}
                        selected={selectedIds?.has(exercise.id)}
                      />
                    </View>
                  ))}
                </View>
                {others.length > 0 ? <SectionTitle label="Tous les exercices" /> : null}
              </View>
            ) : null
          }
          ListFooterComponent={
            hiddenByScope > 0 ? (
              <View className="px-1.5 pt-4">
                <Button
                  label={`Voir ${hiddenByScope} exercice${hiddenByScope > 1 ? 's' : ''} de plus`}
                  variant="secondary"
                  onPress={() => setScope('all')}
                />
              </View>
            ) : null
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: bottomInset }}
          ListEmptyComponent={
            // Nothing to say while the recent ones are still listed above.
            recent.length === 0 ? (
              <View className="px-1.5 pt-4">
                <EmptyState
                  title="Aucun exercice trouvé"
                  description={
                    scope === 'essentials'
                      ? 'Essaie dans toute la bibliothèque, ou crée ton propre exercice.'
                      : 'Modifie ta recherche ou crée ton propre exercice.'
                  }
                />
              </View>
            ) : null
          }
        />
      </View>

      {filtersOpen ? (
        <ExerciseFilters
          scope={scope}
          onScopeChange={setScope}
          essentialsCount={essentialsCount}
          totalCount={exercises.length}
          muscle={muscle}
          onMuscleChange={setMuscle}
          equipment={equipment}
          onEquipmentChange={setEquipment}
          onReset={() => {
            setMuscle(null);
            setEquipment(null);
          }}
          onClose={() => setFiltersOpen(false)}
          resultCount={recent.length + others.length}
        />
      ) : null}
    </View>
  );
}

type ActionTileProps = {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  active: boolean;
  badge?: number;
  onPress: () => void;
};

/** Same tile as a muscle, for the actions that open the search field and the filters. */
function ActionTile({ icon, label, active, badge = 0, onPress }: ActionTileProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={badge > 0 ? `${label}, ${badge} actif${badge > 1 ? 's' : ''}` : label}
      accessibilityState={{ selected: active }}
      style={{ width: 48, height: 56 }}
      className={`items-center justify-center rounded-2xl border border-outline active:opacity-70 ${
        active ? 'bg-primary-soft' : 'bg-surface'
      }`}>
      <Icon name={icon} size={20} color={colors.foreground} />
      {badge > 0 ? (
        <View
          style={{ width: 16, height: 16, top: 6, right: 6 }}
          className="absolute items-center justify-center rounded-full bg-foreground">
          <Text style={{ fontSize: 10 }} className="font-bold text-primary-foreground">
            {badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <Text className="px-1.5 pt-3 pb-1 text-sm font-medium tracking-wide text-muted uppercase">
      {label}
    </Text>
  );
}
