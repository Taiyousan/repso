import { NativeTabs } from 'expo-router/native-tabs';

import { useThemeColors } from '@/lib/theme';

export default function TabsLayout() {
  const colors = useThemeColors();

  return (
    <NativeTabs
      backgroundColor={colors.surface}
      // Every state is set explicitly: Android's defaults don't follow the app theme.
      iconColor={{ default: colors.muted, selected: colors.primary }}
      labelStyle={{ default: { color: colors.muted }, selected: { color: colors.foreground } }}
      // Android hides unselected labels beyond three tabs by default.
      labelVisibilityMode="labeled"
      indicatorColor={colors.surfaceMuted}
      rippleColor={colors.surfaceMuted}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Séance</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="figure.strengthtraining.traditional" md="fitness_center" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="programs">
        <NativeTabs.Trigger.Label>Programmes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet.rectangle" md="list_alt" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="exercises">
        <NativeTabs.Trigger.Label>Exercices</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="books.vertical" md="menu_book" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Label>Historique</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="clock" md="history" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stats">
        <NativeTabs.Trigger.Label>Stats</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.xaxis" md="bar_chart" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
