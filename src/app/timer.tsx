import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Text } from '@/components/ui/text';
import { formatDuration } from '@/features/programs/sets';
import { TIMER_PRESETS, timerCaption, useTimer } from '@/features/sessions/timer';
import { useTimerTicker } from '@/features/sessions/use-timer-ticker';
import { useThemeColors } from '@/lib/theme';

const RING_SIZE = 280;
// Explicit sizes (not utility classes) so this screen never depends on generated CSS.
const MAIN_BUTTON = 88;
const SIDE_BUTTON = 64;

/** The app's timer: shows the running countdown, or lets the user set and start one. */
export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const timer = useTimer();
  const remainingMs = useTimerTicker();
  const remaining = Math.ceil(remainingMs / 1000);

  const isIdle = timer.status === 'idle';
  // Empty track while setting a duration; full ring emptying as time goes by.
  const progress = isIdle || timer.totalSeconds === 0 ? 0 : remaining / timer.totalSeconds;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: insets.bottom + 24,
      }}>
      <ProgressRing
        progress={progress}
        size={RING_SIZE}
        strokeWidth={12}
        animationMs={250}
        highlightComplete={false}>
        <View className="items-center gap-1 px-8">
          <Text
            style={{ fontSize: 56, lineHeight: 64, fontVariant: ['tabular-nums'] }}
            className="font-bold text-foreground">
            {formatDuration(remaining)}
          </Text>
          <Text className="text-center text-sm text-muted" numberOfLines={2}>
            {timerCaption(timer)}
          </Text>
          {!isIdle ? (
            <Text className="text-xs text-muted">sur {formatDuration(timer.totalSeconds)}</Text>
          ) : null}
        </View>
      </ProgressRing>

      {isIdle ? (
        <View className="flex-row flex-wrap justify-center gap-2">
          {TIMER_PRESETS.map((seconds) => (
            <Chip
              key={seconds}
              label={formatDuration(seconds)}
              selected={remaining === seconds}
              onPress={() => timer.setDuration(seconds)}
            />
          ))}
        </View>
      ) : null}

      <View className="flex-row items-center justify-center" style={{ gap: 28 }}>
        <RoundButton size={SIDE_BUTTON} label="−15 s" onPress={() => timer.adjust(-1)} />
        <RoundButton
          size={MAIN_BUTTON}
          primary
          accessibilityLabel={
            isIdle ? 'Démarrer' : timer.status === 'running' ? 'Mettre en pause' : 'Reprendre'
          }
          icon={
            timer.status === 'running'
              ? { ios: 'pause.fill', android: 'pause' }
              : { ios: 'play.fill', android: 'play_arrow' }
          }
          onPress={() =>
            isIdle
              ? timer.startManual(remaining)
              : timer.status === 'running'
                ? timer.pause()
                : timer.resume()
          }
        />
        <RoundButton size={SIDE_BUTTON} label="+15 s" onPress={() => timer.adjust(1)} />
      </View>

      {!isIdle ? (
        <Pressable
          onPress={timer.stop}
          accessibilityRole="button"
          hitSlop={8}
          className="flex-row items-center gap-1.5 active:opacity-70">
          <Icon name={{ ios: 'stop.fill', android: 'stop' }} size={18} color={colors.danger} />
          <Text className="text-base font-semibold text-danger">Arrêter</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

type RoundButtonProps = {
  size: number;
  onPress: () => void;
  primary?: boolean;
  label?: string;
  icon?: React.ComponentProps<typeof Icon>['name'];
  accessibilityLabel?: string;
};

function RoundButton({
  size,
  onPress,
  primary = false,
  label,
  icon,
  accessibilityLabel,
}: RoundButtonProps) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: primary ? colors.primary : colors.surface,
        borderWidth: 1.5,
        borderColor: primary ? colors.primary : colors.edge,
      }}
      className="items-center justify-center active:opacity-80">
      {icon ? (
        <Icon name={icon} size={size * 0.45} color={primary ? colors.surface : colors.foreground} />
      ) : (
        <Text className="text-base font-semibold text-foreground">{label}</Text>
      )}
    </Pressable>
  );
}
