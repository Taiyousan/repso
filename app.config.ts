import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * The development client is a separate app (own id and name), so it can sit next to the real one
 * on the phone without touching its data. The real app keeps the original id: never change it,
 * Android would treat it as another app and its data would stay behind.
 */
const IS_DEV = process.env.APP_VARIANT === 'development';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? 'Workout Planner (dev)' : config.name!,
  slug: config.slug!,
  android: {
    ...config.android,
    package: IS_DEV ? 'com.taiyousan.workoutplanner.dev' : config.android?.package,
  },
});
