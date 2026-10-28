import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { SmallButton } from '@/components/ui/small-button';
import { Text } from '@/components/ui/text';
import { formatDuration } from '@/features/programs/sets';

import { timerCaption, useTimer } from '../timer';
import { useTimerTicker } from '../use-timer-ticker';

/**
 * Running countdown, shown in the workout's bottom bar above "Terminer"; tapping the time opens
 * the timer screen. Nothing when no countdown runs.
 */
export function TimerBar() {
  const { status, kind, totalSeconds, label, adjust, stop } = useTimer();
  const remainingMs = useTimerTicker();

  if (status === 'idle') return null;

  const remaining = Math.ceil(remainingMs / 1000);
  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 1;
  const caption = timerCaption({ status, kind, label });

  return (
    <View className="gap-3">
      <View className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <View
          className="h-full bg-foreground"
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </View>
      <View className="flex-row items-center gap-2">
        <SmallButton label="−15 s" onPress={() => adjust(-1)} />
        <Pressable
          onPress={() => router.push('/timer')}
          accessibilityRole="button"
          accessibilityLabel="Ouvrir le minuteur"
          className="flex-1 items-center active:opacity-70">
          <Text
            className="font-display text-2xl font-extrabold text-foreground"
            style={{ fontVariant: ['tabular-nums'] }}>
            {formatDuration(remaining)}
          </Text>
          <Text className="text-xs text-muted" numberOfLines={1}>
            {caption}
          </Text>
        </Pressable>
        <SmallButton label="+15 s" onPress={() => adjust(1)} />
        <SmallButton label="Passer" onPress={stop} />
      </View>
    </View>
  );
}
