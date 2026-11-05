import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Logo } from '@/components/ui/logo';
import { Text } from '@/components/ui/text';
import { currentWeek, weekStreak } from '@/domain/stats';
import { formatLongDay } from '@/lib/dates';
import { useThemeColors } from '@/lib/theme';

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const ON_PRIMARY_FAINT = 'rgba(255, 255, 255, 0.16)';
const ON_PRIMARY_LINE = 'rgba(255, 255, 255, 0.45)';

/**
 * Blue top of the home screen, the only branded one: the app's name, this week's training and the
 * card to open next (children).
 */
export function HomeHeader({
  trainedDates,
  children,
}: PropsWithChildren<{ trainedDates: Date[] }>) {
  const colors = useThemeColors();
  // Tabs stay mounted: only the one shown sets the status bar.
  const focused = useIsFocused();
  const now = new Date();
  const streak = weekStreak(trainedDates, now);
  const week = currentWeek(trainedDates, now);
  const trainedDays = week.filter((day) => day.trained).length;

  return (
    <View
      className="gap-3.5 bg-primary px-4 pt-3 pb-4"
      style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
      {focused ? <StatusBar style="light" /> : null}

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5" accessibilityRole="header">
          <Logo color={colors.surface} ends={colors.primaryEdge} />
          <Text className="font-display text-[24px] font-extrabold text-primary-foreground">
            Repso
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Réglages"
          hitSlop={7}
          style={{ width: 34, height: 34, backgroundColor: ON_PRIMARY_FAINT }}
          className="items-center justify-center rounded-full active:opacity-70">
          <Icon name={{ ios: 'gearshape', android: 'settings' }} size={17} color={colors.surface} />
        </Pressable>
      </View>

      <View className="flex-row items-end justify-between gap-3">
        <View className="shrink">
          <Text className="text-sm font-bold text-primary-soft">{formatLongDay(now)}</Text>
          <Text className="font-display text-2xl font-extrabold text-primary-foreground">
            {streak > 1 ? `${streak} semaines d’affilée` : 'Cette semaine'}
          </Text>
        </View>
        <View
          className="flex-row gap-[5px]"
          accessible
          accessibilityLabel={`${trainedDays} jour${trainedDays > 1 ? 's' : ''} d’entraînement cette semaine`}>
          {week.map((day, index) => (
            <View key={index} className="items-center gap-[3px]">
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  ...(day.trained
                    ? { backgroundColor: colors.surface }
                    : {
                        borderWidth: day.today ? 2 : 1.5,
                        borderColor: day.today ? colors.surface : ON_PRIMARY_LINE,
                      }),
                }}
              />
              <Text className="text-[10px] font-bold text-primary-soft">{DAY_LETTERS[index]}</Text>
            </View>
          ))}
        </View>
      </View>

      {children}
    </View>
  );
}
