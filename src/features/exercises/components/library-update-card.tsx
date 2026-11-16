import { useState } from 'react';
import { Alert } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { formatShortDay } from '@/lib/dates';

import { useInstalledLibraryVersion } from '../library';
import { updateExerciseLibrary, useLibraryCheckedAt } from '../remote-library';

export function LibraryUpdateCard() {
  const version = useInstalledLibraryVersion();
  const checkedAt = useLibraryCheckedAt();
  const [updating, setUpdating] = useState(false);

  const update = async () => {
    setUpdating(true);
    const result = await updateExerciseLibrary();
    setUpdating(false);
    if (result.status === 'failed') {
      Alert.alert('Mise à jour impossible', result.message);
    } else {
      Alert.alert(
        result.status === 'updated' ? 'Bibliothèque mise à jour' : 'Bibliothèque à jour',
        `Version ${result.version}.`,
      );
    }
  };

  return (
    <Card>
      <Text className="text-base font-semibold text-foreground">Bibliothèque d’exercices</Text>
      <Text className="text-muted">
        De nouveaux exercices et corrections arrivent sans mettre à jour l’application. Repso
        vérifie au plus une fois par jour, à l’ouverture.
      </Text>
      <Text className="text-sm text-muted">
        Version {version}
        {checkedAt ? ` · vérifiée ${formatShortDay(checkedAt)}` : ''}
      </Text>
      <Button
        label={updating ? 'Vérification…' : 'Mettre à jour la bibliothèque'}
        variant="secondary"
        onPress={update}
        disabled={updating}
      />
    </Card>
  );
}
