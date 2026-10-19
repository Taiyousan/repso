import { NativeTabs } from 'expo-router/native-tabs';
import { useCSSVariable } from 'uniwind';

export default function TabsLayout() {
  const [surface, foreground, primary] = useCSSVariable([
    '--color-surface',
    '--color-foreground',
    '--color-primary',
  ]) as string[];

  return (
    <NativeTabs
      backgroundColor={surface}
      tintColor={primary}
      labelStyle={{ selected: { color: foreground } }}>
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
    </NativeTabs>
  );
}
