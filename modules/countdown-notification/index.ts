import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

type CountdownNotificationModule = {
  show(title: string, body: string, endsAtMs: number): void;
  dismiss(): void;
};

// Optional: absent on iOS, and in builds made before this module existed.
const native =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<CountdownNotificationModule>('CountdownNotification')
    : null;

/** Ongoing notification counting down to `endsAt` (epoch ms), updated by Android itself. */
export function showCountdownNotification(title: string, body: string, endsAt: number): void {
  native?.show(title, body, endsAt);
}

export function dismissCountdownNotification(): void {
  native?.dismiss();
}
