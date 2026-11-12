import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { addDays, monthWeeks } from '@/domain/stats';
import { formatLongDay, formatMonth } from '@/lib/dates';

import { IconButton } from './icon-button';
import { Text } from './text';

const WEEKDAY_INITIALS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

type MonthCalendarProps = {
  value: Date;
  onChange: (day: Date) => void;
  /** Last day that can be picked, e.g. today for something already done. */
  max?: Date;
};

/** A month of days to pick one from, browsed month by month. */
export function MonthCalendar({ value, onChange, max }: MonthCalendarProps) {
  const [month, setMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const lastDay = max ? addDays(max, 0) : null;
  const today = addDays(new Date(), 0).getTime();
  const selected = addDays(value, 0).getTime();
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <IconButton
          icon={{ ios: 'chevron.left', android: 'chevron_left' }}
          label="Mois précédent"
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        />
        <Text className="flex-1 text-center text-base font-bold text-foreground">
          {formatMonth(month)}
        </Text>
        <IconButton
          icon={{ ios: 'chevron.right', android: 'chevron_right' }}
          label="Mois suivant"
          onPress={() => setMonth(nextMonth)}
          disabled={lastDay != null && nextMonth > lastDay}
        />
      </View>

      <View className="flex-row">
        {WEEKDAY_INITIALS.map((initial, index) => (
          <Text key={index} className="flex-1 text-center text-xs font-semibold text-muted">
            {initial}
          </Text>
        ))}
      </View>

      {monthWeeks(month).map((week, row) => (
        <View key={row} className="flex-row">
          {week.map((day, column) => {
            if (!day) return <View key={column} className="flex-1" />;
            const time = day.getTime();
            const isSelected = time === selected;
            const disabled = lastDay != null && day > lastDay;
            return (
              <Pressable
                key={column}
                onPress={() => onChange(day)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled }}
                accessibilityLabel={formatLongDay(day)}
                className="h-10 flex-1 items-center justify-center">
                <View
                  className={`h-9 w-9 items-center justify-center rounded-full ${
                    isSelected
                      ? 'bg-primary'
                      : time === today
                        ? 'border border-primary'
                        : 'active:bg-surface-muted'
                  }`}>
                  <Text
                    className={`text-sm font-bold ${
                      isSelected
                        ? 'text-primary-foreground'
                        : disabled
                          ? 'text-muted opacity-40'
                          : 'text-foreground'
                    }`}>
                    {day.getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
