import { requireOptionalNativeModule } from 'expo';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { KeyboardScrollView } from '@/components/ui/keyboard-scroll-view';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { TRACKING_TYPES, type TrackingType } from '@/db/schema';
import { useThemeColors } from '@/lib/theme';

import { EQUIPMENT, equipmentLabel, MUSCLES, muscleLabel, TRACKING_TYPE_DETAILS } from '../labels';
import { MAX_EXERCISE_IMAGES } from '../local-images';
import type { CustomExerciseInput } from '../mutations';
import { ExerciseThumbnail } from './exercise-thumbnail';

// Absent from builds made before photos existed: pick-image.ts is then never loaded.
const canAddImages =
  requireOptionalNativeModule('ExponentImagePicker') !== null &&
  requireOptionalNativeModule('ExpoImageManipulator') !== null;

const PHOTO_SLOTS = ['Début', 'Fin'];

type MuscleRole = 'primary' | 'secondary';

/** Tapping a muscle cycles through these: primary, then secondary, then removed. */
const NEXT_ROLE: Record<MuscleRole | 'none', MuscleRole | null> = {
  none: 'primary',
  primary: 'secondary',
  secondary: null,
};

type ExerciseFormProps = {
  initialValue?: CustomExerciseInput;
  submitLabel: string;
  onSubmit: (value: CustomExerciseInput) => void;
  /** Programs and workouts using the exercise: changing how its sets are logged warns then. */
  usageCount?: number;
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

export function ExerciseForm({
  initialValue = EMPTY,
  submitLabel,
  onSubmit,
  usageCount = 0,
}: ExerciseFormProps) {
  const colors = useThemeColors();
  const [name, setName] = useState(initialValue.name);
  const [roles, setRoles] = useState(
    () =>
      new Map<string, MuscleRole>([
        ...initialValue.primaryMuscles.map((muscle) => [muscle, 'primary'] as const),
        ...initialValue.secondaryMuscles.map((muscle) => [muscle, 'secondary'] as const),
      ]),
  );
  const [equipment, setEquipment] = useState(initialValue.equipment);
  const [trackingType, setTrackingType] = useState(initialValue.trackingType);
  const [instructions, setInstructions] = useState(initialValue.instructions.join('\n'));
  const [instructionsOpen, setInstructionsOpen] = useState(initialValue.instructions.length > 0);
  const [images, setImages] = useState(initialValue.images);
  const [addingImage, setAddingImage] = useState(false);

  const musclesWith = (role: MuscleRole) => MUSCLES.filter((muscle) => roles.get(muscle) === role);
  const primaryMuscles = musclesWith('primary');
  const secondaryMuscles = musclesWith('secondary');
  const isValid = name.trim().length > 0 && primaryMuscles.length > 0;
  // "Distance" only records a duration: no longer offered, unless the exercise already uses it.
  const trackingTypes = TRACKING_TYPES.filter(
    (type) => type !== 'distance' || initialValue.trackingType === 'distance',
  );

  const cycleMuscle = (muscle: string) =>
    setRoles((current) => {
      const next = new Map(current);
      const role = NEXT_ROLE[current.get(muscle) ?? 'none'];
      if (role) next.set(muscle, role);
      else next.delete(muscle);
      return next;
    });

  const submit = () => {
    if (!isValid) return;
    onSubmit({
      name: name.trim(),
      primaryMuscles,
      secondaryMuscles,
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

  const chooseImageSource = () =>
    Alert.alert('Ajouter une photo', undefined, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Appareil photo', onPress: () => addImage('camera') },
      { text: 'Galerie', onPress: () => addImage('library') },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 16, padding: 16 }}
        keyboardShouldPersistTaps="handled">
        <Card>
          <TextField
            label="Nom"
            value={name}
            onChangeText={setName}
            placeholder="Ex. Développé couché prise serrée"
            autoFocus={!initialValue.name}
          />
          {canAddImages || images.length > 0 ? (
            <View className="flex-row items-center gap-2.5 pb-4">
              {PHOTO_SLOTS.map((slot, index) => {
                const image = images[index];
                if (!image && !(canAddImages && index === images.length)) return null;
                return (
                  <View key={slot}>
                    {image ? (
                      <PhotoSlot
                        image={image}
                        label={slot}
                        name={name}
                        onRemove={() => setImages((list) => list.filter((item) => item !== image))}
                      />
                    ) : (
                      <Pressable
                        onPress={chooseImageSource}
                        disabled={addingImage}
                        accessibilityRole="button"
                        accessibilityLabel={`Ajouter la photo de ${slot.toLowerCase()}`}
                        style={{
                          width: 72,
                          height: 72,
                          borderWidth: 1.5,
                          borderStyle: 'dashed',
                          opacity: addingImage ? 0.5 : 1,
                        }}
                        className="items-center justify-center rounded-xl border-edge bg-background active:opacity-70">
                        <Icon
                          name={{ ios: 'plus', android: 'add' }}
                          size={20}
                          color={colors.primary}
                        />
                        <Text className="text-xs font-extrabold text-primary">Photo</Text>
                      </Pressable>
                    )}
                    <Text
                      style={{ position: 'absolute', bottom: -18, left: 0, right: 0 }}
                      className="text-center text-xs font-bold text-muted">
                      {slot}
                    </Text>
                  </View>
                );
              })}
              <Text className="flex-1 pl-1 text-sm text-muted">
                Facultatif. Les deux photos s’alternent comme une animation.
              </Text>
            </View>
          ) : null}
        </Card>

        <Card>
          <CardTitle
            title="Comment noter les séries ?"
            hint="Change les colonnes de l’entraînement et les records suivis."
          />
          <View accessibilityRole="radiogroup" className="gap-1">
            {trackingTypes.map((type) => (
              <TrackingOption
                key={type}
                type={type}
                selected={trackingType === type}
                onPress={() => setTrackingType(type)}
              />
            ))}
          </View>
          {usageCount > 0 && trackingType !== initialValue.trackingType ? (
            <View className="flex-row gap-2 rounded-xl bg-reward px-3 py-2.5">
              <Icon
                name={{ ios: 'info.circle', android: 'info' }}
                size={16}
                color={colors.rewardInk}
              />
              <Text className="flex-1 text-sm font-bold text-foreground">
                Déjà utilisé : les séries passées gardent leurs valeurs, mais leurs records peuvent
                changer de sens.
              </Text>
            </View>
          ) : null}
        </Card>

        <Card>
          <CardTitle
            title="Muscles"
            hint="Une fois : principal. Deux fois : secondaire. Trois : retiré."
          />
          <View className="flex-row flex-wrap gap-1.5">
            {MUSCLES.map((muscle) => (
              <MuscleChip
                key={muscle}
                label={muscleLabel(muscle)}
                role={roles.get(muscle) ?? null}
                onPress={() => cycleMuscle(muscle)}
              />
            ))}
          </View>
          <View className="gap-1 border-t border-border pt-2.5">
            <MuscleSummary color={colors.foreground} label="Principal" muscles={primaryMuscles} />
            <MuscleSummary color={colors.primary} label="Secondaires" muscles={secondaryMuscles} />
          </View>
        </Card>

        <Card>
          <CardTitle title="Matériel" />
          <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-1.5">
            {[null, ...EQUIPMENT].map((item) => (
              <ChoiceChip
                key={item ?? 'none'}
                label={item ? equipmentLabel(item) : 'Aucun'}
                selected={equipment === item}
                onPress={() => setEquipment(item)}
              />
            ))}
          </View>
        </Card>

        <View className="rounded-2xl border border-outline bg-surface p-1">
          <Pressable
            onPress={() => setInstructionsOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityState={{ expanded: instructionsOpen }}
            className="flex-row items-center gap-3 rounded-xl px-3 py-2.5 active:opacity-70">
            <View className="flex-1">
              <CardTitle title="Instructions" hint="Facultatif, une étape par ligne" />
            </View>
            <Icon
              name={
                instructionsOpen
                  ? { ios: 'chevron.up', android: 'expand_less' }
                  : { ios: 'chevron.down', android: 'expand_more' }
              }
              size={20}
              color={colors.foreground}
            />
          </Pressable>
          {instructionsOpen ? (
            <View className="px-3 pb-3">
              <TextField
                accessibilityLabel="Instructions"
                value={instructions}
                onChangeText={setInstructions}
                multiline
                placeholder="Règle le siège, saisis les poignées…"
              />
            </View>
          ) : null}
        </View>
      </KeyboardScrollView>

      <ActionBar>
        {!isValid ? (
          <Text className="text-center text-sm text-muted">
            Ajoute un nom et au moins un muscle principal.
          </Text>
        ) : null}
        <Button label={submitLabel} onPress={submit} disabled={!isValid} />
      </ActionBar>
    </View>
  );
}

function CardTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <View className="gap-0.5">
      <Text className="font-display text-base font-bold text-foreground">{title}</Text>
      {hint ? <Text className="text-sm text-muted">{hint}</Text> : null}
    </View>
  );
}

function PhotoSlot({
  image,
  label,
  name,
  onRemove,
}: {
  image: string;
  label: string;
  name: string;
  onRemove: () => void;
}) {
  const colors = useThemeColors();
  return (
    <View>
      <ExerciseThumbnail images={[image]} name={name} size={72} />
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Retirer la photo de ${label.toLowerCase()}`}
        hitSlop={12}
        style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22 }}
        className="items-center justify-center rounded-full bg-surface active:opacity-70">
        <Icon name={{ ios: 'xmark', android: 'close' }} size={12} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

/** A radio row: the way of logging, typical exercises, and a set as the workout shows it. */
function TrackingOption({
  type,
  selected,
  onPress,
}: {
  type: TrackingType;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const { label, examples, set } = TRACKING_TYPE_DETAILS[type];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      className={`flex-row items-center gap-3 rounded-xl px-3 py-2.5 active:opacity-70 ${
        selected ? 'bg-primary-soft' : ''
      }`}>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selected ? colors.primary : colors.edge,
        }}
        className="items-center justify-center">
        {selected ? (
          <View
            style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }}
          />
        ) : null}
      </View>
      <View className="flex-1">
        <Text className={`text-base text-foreground ${selected ? 'font-extrabold' : 'font-bold'}`}>
          {label}
        </Text>
        <Text className="text-sm text-muted">{examples}</Text>
      </View>
      <Text
        style={{ fontVariant: ['tabular-nums'] }}
        className={`font-display text-base ${
          selected
            ? 'rounded-lg bg-surface px-2 font-extrabold text-foreground'
            : 'font-bold text-muted'
        }`}>
        {set}
      </Text>
    </Pressable>
  );
}

function MuscleChip({
  label,
  role,
  onPress,
}: {
  label: string;
  role: MuscleRole | null;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const styles = {
    primary: { container: 'bg-foreground', label: 'text-surface', dot: colors.surface },
    secondary: { container: 'bg-primary-soft', label: 'text-primary-edge', dot: colors.primary },
  };
  const style = role ? styles[role] : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        role ? `${label}, ${role === 'primary' ? 'principal' : 'secondaire'}` : label
      }
      accessibilityHint="Touche pour changer son rôle"
      className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 active:opacity-70 ${
        style?.container ?? 'bg-surface-muted'
      }`}>
      {style ? (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: style.dot }} />
      ) : null}
      <Text className={`text-sm font-bold ${style?.label ?? 'text-foreground'}`}>{label}</Text>
    </Pressable>
  );
}

function MuscleSummary({
  color,
  label,
  muscles,
}: {
  color: string;
  label: string;
  muscles: string[];
}) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text className="text-sm font-bold text-muted">{label}</Text>
      <Text className="flex-1 text-sm font-extrabold text-foreground" numberOfLines={2}>
        {muscles.length > 0 ? muscles.map(muscleLabel).join(', ') : '—'}
      </Text>
    </View>
  );
}

function ChoiceChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      className={`rounded-full px-3 py-1.5 active:opacity-70 ${
        selected ? 'bg-foreground' : 'bg-surface-muted'
      }`}>
      <Text className={`text-sm font-bold ${selected ? 'text-surface' : 'text-foreground'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
