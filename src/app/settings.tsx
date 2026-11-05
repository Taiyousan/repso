import Constants from 'expo-constants';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Section } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { BackupCard } from '@/features/backup/components/backup-card';
import { LIBRARY_VERSION } from '@/features/exercises/library';
import { NotificationStatusCard } from '@/features/sessions/components/notification-status-card';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 p-4"
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      <Section title="Données">
        <BackupCard />
      </Section>

      <Section title="Notifications">
        <NotificationStatusCard />
      </Section>

      <Section title="À propos">
        <Card>
          <Text className="text-foreground">
            Version {Constants.expoConfig?.version ?? '?'} · Bibliothèque v{LIBRARY_VERSION}
          </Text>
          <Text className="text-sm text-muted">
            Exercices : free-exercise-db (domaine public). Silhouettes :
            react-native-body-highlighter (MIT).
          </Text>
        </Card>
      </Section>
    </ScrollView>
  );
}
