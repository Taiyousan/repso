import { requireOptionalNativeModule } from 'expo';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { KeyboardScrollView } from '@/components/ui/keyboard-scroll-view';
import { SmallButton } from '@/components/ui/small-button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { TRACKING_TYPES } from '@/db/schema';
import { useThemeColors } from '@/lib/theme';

import { EQUIPMENT, equipmentLabel, MUSCLES, muscleLabel, TRACKING_TYPE_LABELS } from '../labels';
import { MAX_EXERCISE_IMAGES } from '../local-images';
import type { CustomExerciseInput } from '../mutations';
import { ExerciseThumbnail } from './exercise-thumbnail';

// Absent from builds made before photos existed: pick-image.ts is then never loaded.
const canAddImages =
  requireOptionalNativeModule('ExponentImagePicker') !== null &&
  requireOptionalNativeModule('ExpoImageManipulator') !== null;

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
  images: [],
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
  const colors = useThemeColors();
  const [name, setName] = useState(initialValue.name);
  const [primaryMuscles, setPrimaryMuscles] = useState(initialValue.primaryMuscles);
  const [secondaryMuscles, setSecondaryMuscles] = useState(initialValue.secondaryMuscles);
  const [equipment, setEquipment] = useState(initialValue.equipment);
  const [trackingType, setTrackingType] = useState(initialValue.trackingType);
  const [instructions, setInstructions] = useState(initialValue.instructions.join('\n'));
  const [images, setImages] = useState(initialValue.images);
  const [addingImage, setAddingImage] = useState(false);

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
      images,
    });
  };

  const addImage = async (source: 'camera' | 'library') => {
    setAddingImage(true);
    const { addExerciseImage } = await import('../pick-image');
    const image = await addExerciseImage(source);
    setAddingImage(false);
    if (image) setImages((list) => [...list, image].slice(0, MAX_EXERCISE_IMAGES));
  };

  return (
    <KeyboardScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ gap: 24, padding: 16, paddingBottom: insets.bottom + 16 }}>
      <TextField
        label="Nom"
        value={name}
        onChangeText={setName}
        placeholder="Ex. Développé couché prise serrée"
        autoFocus={!initialValue.name}
      />

      {canAddImages || images.length > 0 ? (
        <Section title="Photos" hint="2 max, début et fin du mouvement">
          {images.map((image, index) => (
            <View key={image}>
              <ExerciseThumbnail images={[image]} name={name} size={72} />
              <Pressable
                onPress={() => setImages((list) => list.filter((item) => item !== image))}
                accessibilityRole="button"
                accessibilityLabel={`Retirer la photo ${index + 1}`}
                hitSlop={12}
                style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24 }}
                className="items-center justify-center rounded-full bg-surface active:opacity-70">
                <Icon
                  name={{ ios: 'xmark', android: 'close' }}
                  size={14}
                  color={colors.foreground}
                />
              </Pressable>
            </View>
          ))}
          {canAddImages && images.length < MAX_EXERCISE_IMAGES ? (
            <View className="justify-center gap-2">
              <SmallButton
                label="Galerie"
                onPress={() => addImage('library')}
                disabled={addingImage}
              />
              <SmallButton
                label="Appareil photo"
                onPress={() => addImage('camera')}
                disabled={addingImage}
              />
            </View>
          ) : null}
        </Section>
      ) : null}

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
    </KeyboardScrollView>
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
