import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

const REST_CHANNEL_ID = 'rest-timer';

// Rest notifications also show (with sound) while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let ready: Promise<boolean> | null = null;

/**
 * Creates the Android channel, then asks for permission (Android 13+ only prompts once a
 * channel exists). Runs once; resolves to whether notifications are allowed.
 */
export function ensureNotificationsReady(): Promise<boolean> {
  ready ??= (async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(REST_CHANNEL_ID, {
        name: 'Fin du temps de repos',
        importance: AndroidImportance.HIGH,
        vibrationPattern: [0, 400, 200, 400],
        enableVibrate: true,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  })().catch(() => false);
  return ready;
}

export async function scheduleRestEnd(
  seconds: number,
  nextExercise: string,
): Promise<string | null> {
  if (!(await ensureNotificationsReady())) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Repos terminé',
      body: nextExercise ? `C'est reparti : ${nextExercise}` : "C'est reparti !",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, seconds),
      channelId: REST_CHANNEL_ID,
    },
  });
}

export async function cancelRestEnd(id: string | null): Promise<void> {
  if (id) await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
}
