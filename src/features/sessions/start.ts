import { router } from 'expo-router';
import { Alert } from 'react-native';

import { startSession } from './mutations';
import { ensureNotificationsReady } from './notifications';
import { readActiveSession } from './queries';

export function openSession(id: number) {
  router.push({ pathname: '/session/[id]', params: { id } });
}

/** Starts a session (from a workout template, or free) and opens it; one session at a time. */
export function startAndOpenSession(templateId: number | null) {
  const active = readActiveSession();
  if (active) {
    Alert.alert(
      'Entraînement déjà en cours',
      `Termine « ${active.name} » avant d'en démarrer un autre.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Reprendre', onPress: () => openSession(active.id) },
      ],
    );
    return;
  }
  const id = startSession(templateId);
  // Asked at the first session, so the rest timer can notify.
  void ensureNotificationsReady();
  openSession(id);
}
