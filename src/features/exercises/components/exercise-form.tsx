import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { TRACKING_TYPES } from '@/db/schema';

import { EQUIPMENT, equipmentLabel, MUSCLES, muscleLabel, TRACKING_TYPE_LABELS } from '../labels';
import type { CustomExerciseInput } from '../mutations';

type ExerciseFormProps = {
  initialValue?: CustomExerciseInput;
  submitLabel: string;
  onSubmit: (value: CustomExerciseInput) => void;
  onDelete?: () => void;
};

const EMPTY: CustomExerciseInput = {
  name: '',
  primaryMuscles: [],
  secondaryMuscles: [],
  equipment: null,
  trackingType: 'weight_reps',
  instructions: [],
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function ExerciseForm({
  initialValue = EMPTY,
  submitLabel,
  onSubmit,
  onDelete,
}: ExerciseFormProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialValue.name);
  const [primaryMuscles, setPrimaryMuscles] = useState(initialValue.primaryMuscles);
  const [secondaryMuscles, setSecondaryMuscles] = useState(initialValue.secondaryMuscles);
  const [equipment, setEquipment] = useState(initialValue.equipment);
  const [trackingType, setTrackingType] = useState(initialValue.trackingType);
  const [instructions, setInstructions] = useState(initialValue.instructions.join('\n'));

  const isValid = name.trim().length > 0 && primaryMuscles.length > 0;

  const submit = () => {
    if (!isValid) return;
    onSubmit({
      name: name.trim(),
      primaryMuscles,
      // A muscle can't be both primary and secondary.
      secondaryMuscles: secondaryMuscles.filter((muscle) => !primaryMuscles.includes(muscle)),
      equipment,
      trackingType,
      instructions: instructions
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    });
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 p-4"
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      keyboardShouldPersistTaps="handled">
      <TextField
        label="Nom"
        value={name}
        onChangeText={setName}
        placeholder="Ex. Développé couché prise serrée"
        autoFocus={!initialValue.name}
      />

      <Section title="Muscles principaux" hint="Au moins un">
        {MUSCLES.map((muscle) => (
          <Chip
            key={muscle}
            label={muscleLabel(muscle)}
            selected={primaryMuscles.includes(muscle)}
            onPress={() => setPrimaryMuscles((list) => toggle(list, muscle))}
          />
        ))}
      </Section>

      <Section title="Muscles secondaires">
        {MUSCLES.filter((muscle) => !primaryMuscles.includes(muscle)).map((muscle) => (
          <Chip
            key={muscle}
            label={muscleLabel(muscle)}
            selected={secondaryMuscles.includes(muscle)}
            onPress={() => setSecondaryMuscles((list) => toggle(list, muscle))}
          />
        ))}
      </Section>

      <Section title="Matériel">
        {EQUIPMENT.map((item) => (
          <Chip
            key={item}
            label={equipmentLabel(item)}
            selected={equipment === item}
            onPress={() => setEquipment((current) => (current === item ? null : item))}
          />
        ))}
      </Section>

      <Section title="Saisie des séries">
        {TRACKING_TYPES.map((type) => (
          <Chip
            key={type}
            label={TRACKING_TYPE_LABELS[type]}
            selected={trackingType === type}
            onPress={() => setTrackingType(type)}
          />
        ))}
      </Section>

      <TextField
        label="Instructions (une étape par ligne)"
        value={instructions}
        onChangeText={setInstructions}
        multiline
        placeholder="Optionnel"
      />

      <View className="gap-3">
        <Button label={submitLabel} onPress={submit} disabled={!isValid} />
        {onDelete ? (
          <Button label="Supprimer l'exercice" onPress={onDelete} variant="danger" />
        ) : null}
      </View>
    </ScrollView>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-muted">
        {title}
        {hint ? <Text className="font-normal"> · {hint}</Text> : null}
      </Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}
