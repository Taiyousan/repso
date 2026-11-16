import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Section } from '@/components/ui/card';
import { ListGroup } from '@/components/ui/list-group';
import { ListRow } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { BackupCard } from '@/features/backup/components/backup-card';
import { useBodyWeights } from '@/features/body-weight/data';
import { LIBRARY_VERSION } from '@/features/exercises/library';
import { formatDecimal } from '@/features/programs/sets';
import { NotificationStatusCard } from '@/features/sessions/components/notification-status-card';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const latest = useBodyWeights().at(0);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 p-4"
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      <Section title="Profil">
        <ListGroup>
          <ListRow
            title="Poids du corps"
            trailing={latest ? `${formatDecimal(latest.weight)} kg` : 'Non renseigné'}
            onPress={() => router.push('/body-weight')}
            flat
          />
        </ListGroup>
      </Section>

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
