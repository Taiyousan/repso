import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';

import { useNow } from '@/lib/use-now';

import { timerRemainingMs, useTimer } from './timer';

/** Ticks while the timer runs, ends it at zero (with haptics), returns the time left in ms. */
export function useTimerTicker(): number {
  const status = useTimer((state) => state.status);
  const endsAt = useTimer((state) => state.endsAt);
  const remainingMs = useTimer((state) => state.remainingMs);
  const now = useNow(250, status === 'running');

  useEffect(() => {
    const finished = useTimer.getState().finishIfOver(now);
    if (!finished) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    finished.onFinish?.();
  }, [now]);

  return timerRemainingMs({ status, endsAt, remainingMs }, now);
}
