import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Section } from '@/components/ui/card';
import { ListGroup } from '@/components/ui/list-group';
import { ListRow } from '@/components/ui/list-row';
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
        <ListGroup>
          <ListRow title="Licences" onPress={() => router.push('/licenses')} flat />
        </ListGroup>
        <Text className="text-sm text-muted">
          Version {Constants.expoConfig?.version ?? '?'} · Bibliothèque v{LIBRARY_VERSION}
        </Text>
      </Section>
    </ScrollView>
  );
}
