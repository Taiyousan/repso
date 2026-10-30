import Constants from 'expo-constants';
import { Alert, ScrollView, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card, Section } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { BackupCard } from '@/features/backup/components/backup-card';
import { LIBRARY_VERSION } from '@/features/exercises/library';
import {
  buildTranslationRequestsExport,
  clearTranslationRequests,
  useTranslationRequests,
} from '@/features/exercises/translation-requests';
import { NotificationStatusCard } from '@/features/sessions/components/notification-status-card';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { data: requests } = useTranslationRequests();

  const exportRequests = () => {
    Share.share({
      title: 'Demandes de traduction',
      message: buildTranslationRequestsExport(requests),
    });
  };

  const confirmClear = () => {
    Alert.alert('Vider la liste ?', 'Les demandes de traduction seront supprimées.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Vider', style: 'destructive', onPress: clearTranslationRequests },
    ]);
  };

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

      <Section title="Développeur">
        <Card>
          <Text className="text-base font-semibold text-foreground">Demandes de traduction</Text>
          <Text className="text-muted">
            {requests.length === 0
              ? 'Aucune demande. Utilise « Demander la traduction » sur la fiche d’un exercice.'
              : `${requests.length} exercice${requests.length > 1 ? 's' : ''} en attente`}
          </Text>
          {requests.map((request) => (
            <Text key={request.slug} className="text-foreground">
              • {request.name}
            </Text>
          ))}
          <Button
            label="Exporter la liste"
            onPress={exportRequests}
            disabled={requests.length === 0}
          />
          <Button
            label="Vider la liste"
            variant="secondary"
            onPress={confirmClear}
            disabled={requests.length === 0}
          />
        </Card>
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
