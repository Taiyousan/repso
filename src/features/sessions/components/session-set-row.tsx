import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { type ComponentRef, useRef, useState } from 'react';
import { Pressable, Text, TextInput, type TextInputProps, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import type { SessionSet, SetType, TrackingType } from '@/db/schema';
import {
  formatDecimal,
  formatDuration,
  nextSetType,
  SET_TYPE_LABELS,
} from '@/features/programs/sets';
import { useThemeColors } from '@/lib/theme';

import {
  canComplete,
  formatPerformance,
  resolveSetValues,
  type SetInput,
  type SetPerformance,
} from '../logic';
import { completeSessionSet, uncompleteSessionSet, updateSessionSet } from '../mutations';
import { useTimer } from '../timer';
import { useTimerTicker } from '../use-timer-ticker';

const BADGE_STYLES: Record<SetType, { container: string; label: string }> = {
  normal: { container: 'bg-surface-muted', label: 'text-foreground' },
  warmup: { container: 'border border-border bg-surface', label: 'text-muted' },
  dropset: { container: 'bg-primary-soft', label: 'text-foreground' },
  failure: { container: 'bg-danger', label: 'text-primary-foreground' },
};

const DEFAULT_TIMED_SET_SECONDS = 30;

type SessionSetRowProps = {
  set: SessionSet;
  /** Shown in the countdown notification of a timed set. */
  exerciseName: string;
  badge: string;
  trackingType: TrackingType;
  /** Same set last time, shown as placeholder and used when validating empty fields. */
  previous: SetPerformance | null;
  /** This set holds a new record of the exercise. */
  isRecord: boolean;
  onCompleted: () => void;
};

const toText = (value: number | null) => (value == null ? '' : String(value));

export function SessionSetRow({
  set,
  exerciseName,
  badge,
  trackingType,
  previous,
  isRecord,
  onCompleted,
}: SessionSetRowProps) {
  const colors = useThemeColors();
  // Inputs keep local text and save when editing ends, so typing never fights the database.
  const [input, setInput] = useState<SetInput>({
    weight: formatDecimal(set.weight),
    reps: toText(set.reps),
    duration: toText(set.durationSeconds),
  });
  const done = set.completedAt != null;
  const isTimed = trackingType === 'duration' || trackingType === 'distance';
  const timerSetId = useTimer((state) => state.setId);
  const isCounting = timerSetId === set.id;
  const resolved = resolveSetValues(input, previous, trackingType);
  const style = BADGE_STYLES[set.type];

  const change = (field: keyof SetInput) => (text: string) =>
    setInput((current) => ({ ...current, [field]: text }));

  const saveTyped = () => {
    const typed = resolveSetValues(input, null, trackingType);
    updateSessionSet(set.id, typed);
  };

  const toggleDone = () => {
    if (done) {
      uncompleteSessionSet(set.id);
      return;
    }
    if (!canComplete(resolved, trackingType)) return;
    completeSessionSet(set.id, resolved);
    setInput({
      weight: formatDecimal(resolved.weight),
      reps: toText(resolved.reps),
      duration: toText(resolved.durationSeconds),
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCompleted();
  };

  /** Counts the set down (typed duration, else last time's, else 30 s), then validates it. */
  const startTimedSet = () => {
    const seconds = resolved.durationSeconds ?? DEFAULT_TIMED_SET_SECONDS;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    useTimer.getState().startSet(seconds, exerciseName, set.id, () => {
      completeSessionSet(set.id, { weight: null, reps: null, durationSeconds: seconds });
      onCompleted();
    });
  };

  return (
    <View
      className={`flex-row items-center gap-2 rounded-lg px-1 py-1 ${done ? 'bg-surface-muted' : ''}`}>
      <Pressable
        onPress={() => updateSessionSet(set.id, { type: nextSetType(set.type) })}
        accessibilityRole="button"
        accessibilityLabel={`${SET_TYPE_LABELS[set.type]}. Toucher pour changer le type`}
        className={`size-9 items-center justify-center rounded-lg ${style.container}`}>
        <Text className={`text-sm font-bold ${style.label}`}>{badge}</Text>
      </Pressable>

      {isRecord ? (
        <View
          accessible
          accessibilityLabel="Record battu"
          className="w-16 flex-row items-center justify-center gap-1">
          <Icon name={{ ios: 'trophy.fill', android: 'trophy' }} size={14} color={colors.primary} />
          <Text className="text-xs font-bold text-primary">Record</Text>
        </View>
      ) : (
        <Text className="w-16 text-center text-xs text-muted" numberOfLines={1}>
          {formatPerformance(previous, trackingType)}
        </Text>
      )}

      {isTimed ? (
        <>
          <NumberInput
            value={done ? toText(set.durationSeconds) : input.duration}
            onChangeText={change('duration')}
            onEndEditing={saveTyped}
            placeholder={toText(previous?.durationSeconds ?? null) || 's'}
            accessibilityLabel="Durée en secondes"
            editable={!done && !isCounting}
          />
          {!done ? (
            isCounting ? (
              <SetCountdown />
            ) : (
              <Pressable
                onPress={startTimedSet}
                accessibilityRole="button"
                accessibilityLabel="Lancer le minuteur de la série"
                hitSlop={4}
                style={{ width: 40, height: 40 }}
                className="items-center justify-center rounded-lg bg-primary">
                <Icon
                  name={{ ios: 'play.fill', android: 'play_arrow' }}
                  size={22}
                  color="#ffffff"
                />
              </Pressable>
            )
          ) : null}
        </>
      ) : (
        <>
          {trackingType === 'weight_reps' ? (
            <NumberInput
              value={done ? formatDecimal(set.weight) : input.weight}
              onChangeText={change('weight')}
              onEndEditing={saveTyped}
              placeholder={formatDecimal(previous?.weight ?? null) || 'kg'}
              keyboardType="decimal-pad"
              accessibilityLabel="Poids en kilos"
              editable={!done}
            />
          ) : null}
          <NumberInput
            value={done ? toText(set.reps) : input.reps}
            onChangeText={change('reps')}
            onEndEditing={saveTyped}
            placeholder={toText(previous?.reps ?? null) || 'reps'}
            accessibilityLabel="Répétitions"
            editable={!done}
          />
        </>
      )}

      <Pressable
        onPress={toggleDone}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel="Valider la série"
        hitSlop={4}
        style={{ width: 40, height: 40 }}
        className={`items-center justify-center rounded-lg ${done ? 'bg-success' : 'border border-border bg-surface'}`}>
        <Icon
          name={{ ios: 'checkmark', android: 'check' }}
          size={22}
          color={done ? '#ffffff' : colors.muted}
        />
      </Pressable>
    </View>
  );
}

/** Time left of the timed set being counted down; opens the timer screen. */
function SetCountdown() {
  const remainingMs = useTimerTicker();
  return (
    <Pressable
      onPress={() => router.push('/timer')}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir le minuteur"
      style={{ width: 40, height: 40 }}
      className="items-center justify-center rounded-lg bg-primary-soft">
      <Text className="text-xs font-bold text-foreground" style={{ fontVariant: ['tabular-nums'] }}>
        {formatDuration(Math.ceil(remainingMs / 1000))}
      </Text>
    </Pressable>
  );
}

/**
 * The value is selected when the field is focused, so a new one just overwrites it. Done by hand
 * rather than with `selectTextOnFocus`, which Android re-applies on every re-render: the second
 * digit typed would replace the first.
 */
function NumberInput({
  onFocus,
  ...props
}: Omit<TextInputProps, 'className' | 'placeholderTextColor'>) {
  const colors = useThemeColors();
  const ref = useRef<ComponentRef<typeof TextInput>>(null);

  return (
    <TextInput
      ref={ref}
      keyboardType="number-pad"
      placeholderTextColor={colors.muted}
      {...props}
      onFocus={(event) => {
        const length = String(props.value ?? '').length;
        if (length > 0) ref.current?.setSelection(0, length);
        onFocus?.(event);
      }}
      className="flex-1 rounded-lg border border-border bg-background px-2 py-2 text-center text-base text-foreground"
    />
  );
}
