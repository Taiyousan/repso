import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ProgressRing } from '@/components/ui/progress-ring';
import { formatDuration } from '@/features/programs/sets';
import { TIMER_PRESETS, useTimer } from '@/features/sessions/timer';
import { useTimerTicker } from '@/features/sessions/use-timer-ticker';

/** The app's timer: shows the running rest/countdown, or lets the user set and start one. */
export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const {
    status,
    kind,
    totalSeconds,
    label,
    startManual,
    setDuration,
    pause,
    resume,
    adjust,
    stop,
  } = useTimer();
  const remainingMs = useTimerTicker();
  const remaining = Math.ceil(remainingMs / 1000);

  const isIdle = status === 'idle';
  const progress = isIdle || totalSeconds === 0 ? 1 : remaining / totalSeconds;
  const caption = isIdle
    ? 'Choisis une durée'
    : status === 'paused'
      ? 'En pause'
      : kind === 'rest'
        ? label
          ? `Repos · ensuite ${label}`
          : 'Repos'
        : 'Minuteur en cours';

  return (
    <View
      className="flex-1 items-center justify-center gap-8 bg-background px-6"
      style={{ paddingBottom: insets.bottom + 16 }}>
      <Text className="text-base text-muted" numberOfLines={1}>
        {caption}
      </Text>

      <ProgressRing
        progress={progress}
        size={260}
        strokeWidth={14}
        animationMs={250}
        highlightComplete={false}>
        <Text
          className="text-6xl font-bold text-foreground"
          style={{ fontVariant: ['tabular-nums'] }}>
          {formatDuration(remaining)}
        </Text>
      </ProgressRing>

      <View className="w-full flex-row items-center justify-center gap-4">
        <RoundButton label="−15 s" onPress={() => adjust(-1)} />
        {isIdle ? (
          <RoundButton label="Démarrer" primary onPress={() => startManual(remaining)} />
        ) : status === 'running' ? (
          <RoundButton label="Pause" primary onPress={pause} />
        ) : (
          <RoundButton label="Reprendre" primary onPress={resume} />
        )}
        <RoundButton label="+15 s" onPress={() => adjust(1)} />
      </View>

      {isIdle ? (
        <View className="flex-row flex-wrap justify-center gap-2">
          {TIMER_PRESETS.map((seconds) => (
            <Chip
              key={seconds}
              label={formatDuration(seconds)}
              selected={remaining === seconds}
              onPress={() => setDuration(seconds)}
            />
          ))}
        </View>
      ) : (
        <View className="w-full">
          <Button label="Arrêter" variant="secondary" onPress={stop} />
        </View>
      )}
    </View>
  );
}

function RoundButton({
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
      className={`items-center justify-center rounded-full active:opacity-80 ${
        primary ? 'size-24 bg-primary' : 'size-16 bg-surface-muted'
      }`}>
      <Text
        className={`font-semibold ${primary ? 'text-base text-primary-foreground' : 'text-sm text-foreground'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
