import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { formatDuration } from '@/features/programs/sets';

import { timerCaption, useTimer } from '../timer';
import { useTimerTicker } from '../use-timer-ticker';

/** Countdown docked at the bottom of the session screen; tapping it opens the timer screen. */
export function TimerBar() {
  const insets = useSafeAreaInsets();
  const { status, kind, totalSeconds, label, adjust, stop } = useTimer();
  const remainingMs = useTimerTicker();

  if (status === 'idle') return null;

  const remaining = Math.ceil(remainingMs / 1000);
  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 1;
  const caption = timerCaption({ status, kind, label });

  return (
    <View
      className="gap-3 border-t border-border bg-surface px-4 pt-3"
      style={{ paddingBottom: insets.bottom + 12 }}>
      <View className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <View
          className="h-full bg-primary"
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </View>
      <View className="flex-row items-center gap-3">
        <TimerButton label="−15 s" onPress={() => adjust(-1)} />
        <Pressable
          onPress={() => router.push('/timer')}
          accessibilityRole="button"
          accessibilityLabel="Ouvrir le minuteur"
          className="flex-1 items-center active:opacity-70">
          <Text
            className="text-3xl font-bold text-foreground"
            style={{ fontVariant: ['tabular-nums'] }}>
            {formatDuration(remaining)}
          </Text>
          <Text className="text-xs text-muted" numberOfLines={1}>
            {caption}
          </Text>
        </Pressable>
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
