import { Modal, Pressable, ScrollView, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { IconButton } from '@/components/ui/icon-button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';

import { EQUIPMENT, equipmentLabel } from '../labels';
import { MuscleFilter } from './muscle-filter';

export type Scope = 'essentials' | 'all';

type ExerciseFiltersProps = {
  scope: Scope;
  onScopeChange: (scope: Scope) => void;
  essentialsCount: number;
  totalCount: number;
  muscle: string | null;
  onMuscleChange: (muscle: string | null) => void;
  equipment: string | null;
  onEquipmentChange: (equipment: string | null) => void;
  onReset: () => void;
  onClose: () => void;
  /** How many exercises the filters leave, shown on the closing button. */
  resultCount: number;
};

/**
 * Filters, opened on demand instead of taking room above the results for good. A modal so that
 * nothing floats over it (the library's "+" button, the picker's bar) and Android's back closes it.
 */
export function ExerciseFilters({
  scope,
  onScopeChange,
  essentialsCount,
  totalCount,
  muscle,
  onMuscleChange,
  equipment,
  onEquipmentChange,
  onReset,
  onClose,
  resultCount,
}: ExerciseFiltersProps) {
  const insets = useSafeAreaInsets();
  const hasFilters = muscle != null || equipment != null;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <IconButton icon={{ ios: 'xmark', android: 'close' }} label="Fermer" onPress={onClose} />
          <Text className="text-base font-semibold text-foreground">Filtres</Text>
          <Pressable onPress={onReset} disabled={!hasFilters} hitSlop={8}>
            <Text
              className={`text-base font-medium ${hasFilters ? 'font-bold text-foreground' : 'text-muted'}`}>
              Réinitialiser
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ gap: 20, padding: 16 }}>
          <Section title="Bibliothèque">
            <SegmentedControl
              options={[
                { value: 'essentials', label: `Essentiels (${essentialsCount})` },
                { value: 'all', label: `Tous (${totalCount})` },
              ]}
              value={scope}
              onChange={onScopeChange}
            />
          </Section>
          <Section title="Muscle">
            <MuscleFilter selected={muscle} onSelect={onMuscleChange} />
          </Section>
          <Section title="Équipement">
            <View className="flex-row flex-wrap gap-2">
              {EQUIPMENT.map((item) => (
                <Chip
                  key={item}
                  label={equipmentLabel(item)}
                  selected={equipment === item}
                  onPress={() => onEquipmentChange(equipment === item ? null : item)}
                />
              ))}
            </View>
          </Section>
        </ScrollView>

        <View
          className="border-t border-border bg-surface px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}>
          <Button
            label={
              resultCount === 0
                ? 'Aucun exercice'
                : `Voir ${resultCount} exercice${resultCount > 1 ? 's' : ''}`
            }
            onPress={onClose}
          />
        </View>
      </View>
    </Modal>
  );
}
