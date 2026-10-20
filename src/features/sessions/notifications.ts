import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

const REST_CHANNEL_ID = 'rest-timer';
/** A single rest notification at a time: scheduling again replaces it. */
const REST_NOTIFICATION_ID = 'rest-end';

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

/**
 * Schedules the end-of-timer alert at `endsAt`. 'alarmClock' delivery is exact: the default lets
 * Android defer the alarm to save battery, which delayed it by a few seconds.
 */
export async function scheduleTimerEnd(endsAt: number, title: string, body: string): Promise<void> {
  if (!(await ensureNotificationsReady())) return;
  await Notifications.scheduleNotificationAsync({
    identifier: REST_NOTIFICATION_ID,
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: endsAt,
      channelId: REST_CHANNEL_ID,
      delivery: 'alarmClock',
    },
  });
}

export async function cancelTimerEnd(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REST_NOTIFICATION_ID).catch(() => undefined);
}

/** Removes the end alert from the notification shade once delivered. */
export async function dismissTimerEnd(): Promise<void> {
  await Notifications.dismissNotificationAsync(REST_NOTIFICATION_ID).catch(() => undefined);
}

export type NotificationStatus = { notifications: boolean; exactAlarms: boolean };

/** Shown in settings to check what the rest timer can rely on. */
export async function getNotificationStatus(): Promise<NotificationStatus> {
  const [notifications, exactAlarms] = await Promise.all([
    Notifications.getPermissionsAsync(),
    Platform.OS === 'android'
      ? Notifications.getExactAlarmPermissionsAsync()
      : Promise.resolve({ granted: true }),
  ]);
  return { notifications: notifications.granted, exactAlarms: exactAlarms.granted };
}

export async function requestExactAlarms(): Promise<void> {
  await Notifications.requestExactAlarmPermissionsAsync().catch(() => undefined);
}
