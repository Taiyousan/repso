import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatDuration } from '@/features/programs/sets';
import { useNow } from '@/lib/use-now';

import { remainingSeconds } from '../logic';
import { markRestFinished, useRestTimer } from '../rest-timer';

/** Countdown docked at the bottom of the session screen while resting. */
export function RestTimerBar() {
  const insets = useSafeAreaInsets();
  const { endsAt, totalSeconds, label, adjust, stop } = useRestTimer();
  const now = useNow(250, endsAt != null);

  const remaining = endsAt == null ? 0 : remainingSeconds(endsAt, now);
  const isOver = endsAt != null && remaining === 0;

  useEffect(() => {
    if (!isOver) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markRestFinished();
  }, [isOver]);

  if (endsAt == null) return null;

  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 1;

  return (
    <View
      className="gap-3 border-t border-border bg-surface px-4 pt-3"
      style={{ paddingBottom: insets.bottom + 12 }}>
      <View className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <View
          className="h-full bg-primary"
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
      </View>
      <View className="flex-row items-center gap-3">
        <TimerButton label="−15 s" onPress={() => adjust(-1)} />
        <View className="flex-1 items-center">
          <Text
            className="text-3xl font-bold text-foreground"
            style={{ fontVariant: ['tabular-nums'] }}>
            {formatDuration(remaining)}
          </Text>
          <Text className="text-xs text-muted" numberOfLines={1}>
            {label ? `Repos · ensuite ${label}` : 'Repos'}
          </Text>
        </View>
        <TimerButton label="+15 s" onPress={() => adjust(1)} />
        <TimerButton label="Passer" onPress={stop} primary />
      </View>
    </View>
  );
}

function TimerButton({
  label,
  onPress,
  primary = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`rounded-xl px-3 py-2.5 active:opacity-80 ${primary ? 'bg-primary' : 'bg-surface-muted'}`}>
      <Text
        className={`text-sm font-semibold ${primary ? 'text-primary-foreground' : 'text-foreground'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
