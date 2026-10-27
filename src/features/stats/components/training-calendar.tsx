import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { trainingCalendar } from '@/domain/stats';
import { formatDay, formatShortMonth } from '@/lib/dates';

const GAP = 3;
const TARGET_CELL = 16;
const DAY_LABELS_WIDTH = 14;
const DAY_LABELS = ['L', '', 'M', '', 'V', '', 'D'];

type TrainingCalendarProps = {
  sessions: { id: number; startedAt: Date }[];
};

/**
 * Training days of the last weeks, one column per week (Monday on top), as many weeks as fit the
 * width. Tapping a training day opens its session.
 */
export function TrainingCalendar({ sessions }: TrainingCalendarProps) {
  const [width, setWidth] = useState(0);
  const gridWidth = width - DAY_LABELS_WIDTH - GAP;
  const weekCount = Math.max(1, Math.floor((gridWidth + GAP) / (TARGET_CELL + GAP)));
  const cell = (gridWidth - GAP * (weekCount - 1)) / weekCount;
  const weeks = width > 0 ? trainingCalendar(sessions, weekCount) : [];
  const today = new Date().toDateString();

  // A month is named above the week holding its first day, or above the first column when the
  // next name is far enough not to collide.
  const monthLabels = weeks.map((days, index) => {
    const first = days.find((day) => day.date.getDate() === 1);
    if (first) return formatShortMonth(first.date);
    const nextLabel = weeks.slice(1, 3).some((week) => week.some((d) => d.date.getDate() === 1));
    return index === 0 && !nextLabel ? formatShortMonth(days[0].date) : null;
  });

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} className="gap-1">
      <View
        className="flex-row"
        style={{ height: 16, marginLeft: DAY_LABELS_WIDTH + GAP, gap: GAP }}>
        {monthLabels.map((label, index) => (
          <View key={index} style={{ width: cell }}>
            {label ? (
              <Text className="absolute text-xs text-muted" numberOfLines={1} style={{ width: 40 }}>
                {label}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      <View className="flex-row" style={{ gap: GAP }}>
        <View style={{ width: DAY_LABELS_WIDTH, gap: GAP }}>
          {DAY_LABELS.map((label, index) => (
            <View key={index} className="justify-center" style={{ height: cell }}>
              <Text className="text-xs text-muted">{label}</Text>
            </View>
          ))}
        </View>
        {weeks.map((days) => (
          <View key={days[0].date.getTime()} style={{ gap: GAP }}>
            {days.map((day) => {
              const trained = day.sessionIds.length > 0;
              const isToday = day.date.toDateString() === today;
              return (
                <Pressable
                  key={day.date.getTime()}
                  disabled={!trained}
                  onPress={() =>
                    router.push({
                      pathname: '/session/[id]',
                      params: { id: day.sessionIds.at(-1)! },
                    })
                  }
                  accessibilityRole={trained ? 'button' : undefined}
                  accessibilityLabel={trained ? `Séance du ${formatDay(day.date)}` : undefined}
                  className={`rounded ${
                    trained ? 'bg-primary' : day.future ? '' : 'bg-surface-muted'
                  } ${isToday ? 'border-2 border-foreground' : ''}`}
                  style={{ width: cell, height: cell }}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
