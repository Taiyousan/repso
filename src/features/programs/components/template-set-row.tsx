import { useState } from 'react';
import { Pressable, Text, TextInput, type TextInputProps, View } from 'react-native';

import { IconButton } from '@/components/ui/icon-button';
import type { SetType, TemplateSet, TrackingType } from '@/db/schema';
import { useThemeColors } from '@/lib/theme';

import { removeTemplateSet, updateTemplateSet } from '../mutations';
import { formatDecimal, nextSetType, parseDecimal, parseInteger, SET_TYPE_LABELS } from '../sets';

const BADGE_STYLES: Record<SetType, { container: string; label: string }> = {
  normal: { container: 'bg-surface-muted', label: 'text-foreground' },
  warmup: { container: 'border border-border bg-surface', label: 'text-muted' },
  dropset: { container: 'bg-primary-soft', label: 'text-foreground' },
  failure: { container: 'bg-danger', label: 'text-primary-foreground' },
};

type TemplateSetRowProps = {
  set: TemplateSet;
  badge: string;
  trackingType: TrackingType;
  canRemove: boolean;
};

/** One target set: type badge (tap to cycle), reps/weight or duration, remove button. */
export function TemplateSetRow({ set, badge, trackingType, canRemove }: TemplateSetRowProps) {
  // Inputs keep local text and save when editing ends, so typing never fights the database.
  const [reps, setReps] = useState(set.targetReps == null ? '' : String(set.targetReps));
  const [weight, setWeight] = useState(formatDecimal(set.targetWeight));
  const [duration, setDuration] = useState(
    set.targetDurationSeconds == null ? '' : String(set.targetDurationSeconds),
  );
  const style = BADGE_STYLES[set.type];

  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        onPress={() => updateTemplateSet(set.id, { type: nextSetType(set.type) })}
        accessibilityRole="button"
        accessibilityLabel={`${SET_TYPE_LABELS[set.type]}. Toucher pour changer le type`}
        className={`size-9 items-center justify-center rounded-lg ${style.container}`}>
        <Text className={`text-sm font-bold ${style.label}`}>{badge}</Text>
      </Pressable>

      {trackingType === 'duration' ? (
        <NumberInput
          value={duration}
          onChangeText={setDuration}
          placeholder="30"
          accessibilityLabel="Durée en secondes"
          onEndEditing={() =>
            updateTemplateSet(set.id, { targetDurationSeconds: parseInteger(duration) })
          }
        />
      ) : (
        <NumberInput
          value={reps}
          onChangeText={setReps}
          placeholder="10"
          accessibilityLabel="Répétitions"
          onEndEditing={() => updateTemplateSet(set.id, { targetReps: parseInteger(reps) })}
        />
      )}

      {trackingType === 'weight_reps' ? (
        <NumberInput
          value={weight}
          onChangeText={setWeight}
          placeholder="—"
          keyboardType="decimal-pad"
          accessibilityLabel="Poids en kilos"
          onEndEditing={() => updateTemplateSet(set.id, { targetWeight: parseDecimal(weight) })}
        />
      ) : (
        <View className="flex-1" />
      )}

      <IconButton
        icon={{ ios: 'xmark', android: 'close' }}
        label="Supprimer la série"
        onPress={() => removeTemplateSet(set.id)}
        disabled={!canRemove}
        size={20}
      />
    </View>
  );
}

function NumberInput(props: Omit<TextInputProps, 'className' | 'placeholderTextColor'>) {
  const colors = useThemeColors();
  return (
    <TextInput
      keyboardType="number-pad"
      selectTextOnFocus
      placeholderTextColor={colors.muted}
      {...props}
      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-center text-base text-foreground"
    />
  );
}
