import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

import {
  getNotificationStatus,
  type NotificationStatus,
  requestExactAlarms,
} from '../notifications';

/** What the rest timer can rely on: notification permission and exact alarms. */
export function NotificationStatusCard() {
  const [status, setStatus] = useState<NotificationStatus | null>(null);

  // Refreshed on focus: the user may come back from the system settings.
  useFocusEffect(
    useCallback(() => {
      getNotificationStatus().then(setStatus, () => setStatus(null));
    }, []),
  );

  return (
    <Card>
      <Text className="text-base font-semibold text-foreground">Timer de repos</Text>
      <StatusRow label="Notifications" ok={status?.notifications} />
      <StatusRow label="Alarmes exactes (à l'heure pile)" ok={status?.exactAlarms} />
      {status && !status.notifications ? (
        <Button
          label="Ouvrir les réglages de l'app"
          variant="secondary"
          onPress={() => Linking.openSettings()}
        />
      ) : null}
      {status && !status.exactAlarms ? (
        <Button
          label="Autoriser les alarmes exactes"
          variant="secondary"
          onPress={() => requestExactAlarms().then(() => getNotificationStatus().then(setStatus))}
        />
      ) : null}
    </Card>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean | undefined }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-foreground">{label}</Text>
      <Text className={ok ? 'font-semibold text-success' : 'font-semibold text-danger'}>
        {ok == null ? '…' : ok ? 'Autorisées' : 'Refusées'}
      </Text>
    </View>
  );
}
