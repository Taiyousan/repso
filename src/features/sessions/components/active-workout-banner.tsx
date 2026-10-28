import { View } from 'react-native';

import { PressableCard } from '@/components/ui/pressable-card';
import { Text } from '@/components/ui/text';
import { useNow } from '@/lib/use-now';

import { formatElapsed } from '../logic';
import { useActiveSession } from '../queries';
import { openSession } from '../start';

/** Top of the tabs while a workout runs: it keeps running when its screen is left. */
export function ActiveWorkoutBanner() {
  const active = useActiveSession();
  if (!active) return null;
  return <Banner id={active.id} name={active.name} startedAt={active.startedAt} />;
}

/** On its own so the ticking clock only re-renders the banner. */
function Banner({ id, name, startedAt }: { id: number; name: string; startedAt: Date }) {
  const now = useNow(1000);
  const elapsed = Math.max(0, Math.floor((now - startedAt.getTime()) / 1000));

  return (
    <View className="px-4 pt-2">
      <PressableCard
        onPress={() => openSession(id)}
        accessibilityLabel={`Entraînement en cours : ${name}. Reprendre`}
        selected
        className="flex-row items-center gap-2.5 px-3.5 py-2.5">
        <View className="size-2 rounded-full bg-foreground" />
        <Text className="flex-1 text-sm font-bold text-foreground" numberOfLines={1}>
          Entraînement en cours · {name} ·{' '}
          <Text className="text-sm font-bold" style={{ fontVariant: ['tabular-nums'] }}>
            {formatElapsed(elapsed)}
          </Text>
        </Text>
        <Text className="text-sm font-extrabold text-foreground">Reprendre ›</Text>
      </PressableCard>
    </View>
  );
}
