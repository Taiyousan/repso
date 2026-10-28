import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { PressableCard } from '@/components/ui/pressable-card';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { formatVolume } from '@/domain/volume';
import { type SessionSummary, useSessionHistory } from '@/features/sessions/queries';
import { formatDay, formatDurationLong, formatMonth, formatTime, monthKey } from '@/lib/dates';

type Row =
  { type: 'month'; key: string; label: string } | { type: 'session'; session: SessionSummary };

export default function HistoryScreen() {
  const sessions = useSessionHistory();

  // Sessions come newest first: a month header whenever the month changes.
  const rows = useMemo(() => {
    const result: Row[] = [];
    let currentMonth: string | null = null;
    for (const session of sessions) {
      const key = monthKey(session.startedAt);
      if (key !== currentMonth) {
        currentMonth = key;
        result.push({ type: 'month', key, label: formatMonth(session.startedAt) });
      }
      result.push({ type: 'session', session });
    }
    return result;
  }, [sessions]);

  return (
    <Screen title="Historique" scrollable={false}>
      <FlashList
        data={rows}
        keyExtractor={(row) => (row.type === 'month' ? `month-${row.key}` : String(row.session.id))}
        getItemType={(row) => row.type}
        renderItem={({ item }) =>
          item.type === 'month' ? (
            <Text className="px-4 pt-2 pb-2 text-sm font-medium tracking-wide text-muted uppercase">
              {item.label}
            </Text>
          ) : (
            <View className="px-4 pb-3">
              <HistoryItem session={item.session} />
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={
          <View className="px-4">
            <EmptyState
              title="Aucune séance"
              description="Tes séances terminées apparaîtront ici."
            />
          </View>
        }
      />
    </Screen>
  );
}

function HistoryItem({ session }: { session: SessionSummary }) {
  const details = [
    formatDurationLong(session.endedAt.getTime() - session.startedAt.getTime()),
    session.volume > 0 ? formatVolume(session.volume) : null,
    `${session.setCount} série${session.setCount > 1 ? 's' : ''}`,
  ].filter(Boolean);

  return (
    <PressableCard
      onPress={() => router.push({ pathname: '/session/[id]', params: { id: session.id } })}
      className="gap-1 p-4">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="shrink text-base font-semibold text-foreground" numberOfLines={1}>
          {session.name}
        </Text>
        <Text className="text-sm text-muted">
          {formatDay(session.startedAt)} · {formatTime(session.startedAt)}
        </Text>
      </View>
      <Text className="text-sm text-foreground">{details.join(' · ')}</Text>
      {session.perceivedEffort != null || session.tags.length > 0 ? (
        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
          {session.perceivedEffort != null ? (
            <Text className="text-sm text-muted">
              Effort{' '}
              <Text className="font-semibold text-foreground">{session.perceivedEffort}</Text>
              /10
            </Text>
          ) : null}
          {session.tags.map((tag) => (
            <Text key={tag} className="text-sm font-semibold text-foreground">
              #{tag}
            </Text>
          ))}
        </View>
      ) : null}
    </PressableCard>
  );
}
