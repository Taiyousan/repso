import { useState } from 'react';
import { Text, View } from 'react-native';

import { LineChart } from '@/components/ui/line-chart';
import { SegmentedControl } from '@/components/ui/segmented-control';
import type { TrackingType } from '@/db/schema';
import { formatRecord, RECORD_LABELS, recordKindsFor } from '@/domain/records';
import { progressSeries } from '@/domain/stats';
import { formatDelta } from '@/features/sessions/recap';
import { formatCompact } from '@/lib/chart';
import { formatDay, formatShortDay } from '@/lib/dates';

import { useExerciseProgressSets } from '../queries';

/** Best set volume tells little about progress: charted kinds leave it out. */
const chartedKinds = (trackingType: TrackingType) =>
  recordKindsFor(trackingType).filter((kind) => kind !== 'volume');

type ExerciseProgressProps = { exerciseId: number; trackingType: TrackingType };

/** Best value of each session on this exercise, as a line, with the change since the first one. */
export function ExerciseProgress({ exerciseId, trackingType }: ExerciseProgressProps) {
  const sets = useExerciseProgressSets(exerciseId);
  const kinds = chartedKinds(trackingType);
  const [chosenKind, setKind] = useState(kinds[0]);
  // The tracking type of a custom exercise can change under the chosen kind.
  const kind = kinds.includes(chosenKind) ? chosenKind : kinds[0];
  // Null follows the latest session, also when a new one is added.
  const [selected, setSelected] = useState<number | null>(null);

  const points = progressSeries(sets, trackingType, kind);
  if (points.length === 0) return null;

  const index = selected != null && selected < points.length ? selected : points.length - 1;
  const point = points[index];
  const first = points[0];
  const last = points.at(-1)!;
  const format = (value: number) => formatRecord(kind, value);

  return (
    <View className="gap-3">
      <Text className="text-lg font-semibold text-foreground">Progression</Text>
      <View className="gap-3 rounded-2xl border border-border bg-surface p-4">
        {kinds.length > 1 ? (
          <SegmentedControl
            options={kinds.map((value) => ({ value, label: RECORD_LABELS[value] }))}
            value={kind}
            onChange={(value) => {
              setKind(value);
              setSelected(null);
            }}
          />
        ) : null}

        <View className="flex-row items-end justify-between gap-3">
          <View>
            <Text className="text-2xl font-bold text-foreground">{format(point.value)}</Text>
            <Text className="text-sm text-muted">{formatDay(point.at)}</Text>
          </View>
          {points.length > 1 ? (
            <Text className="text-right text-sm text-muted">
              <Text className="font-semibold text-foreground">
                {formatDelta(last.value - first.value, format)}
              </Text>{' '}
              depuis le {formatShortDay(first.at)}
            </Text>
          ) : null}
        </View>

        <LineChart
          points={points.map((entry) => ({
            key: entry.sessionId,
            x: entry.at.getTime(),
            y: entry.value,
            label: formatShortDay(entry.at),
          }))}
          selected={index}
          onSelect={setSelected}
          formatTick={kind === 'duration' ? format : formatCompact}
          accessibilityLabel={`${RECORD_LABELS[kind]} : ${points.length} séances, dernière à ${format(last.value)}`}
        />
      </View>
    </View>
  );
}
