import * as Haptics from 'expo-haptics';
import { useIsFocused } from 'expo-router';
import { useEffect } from 'react';

import { useNow } from '@/lib/use-now';

import { timerRemainingMs, useTimer } from './timer';

/** Time left in ms, ticking while the timer runs and the screen is shown. Display only. */
export function useTimerTicker(): number {
  const status = useTimer((state) => state.status);
  const endsAt = useTimer((state) => state.endsAt);
  const remainingMs = useTimer((state) => state.remainingMs);
  const focused = useIsFocused();
  const now = useNow(250, status === 'running' && focused);

  return timerRemainingMs({ status, endsAt, remainingMs }, now);
}

/**
 * Ends the countdown at zero (haptics, then what it was started for, e.g. validating a timed set)
 * whatever screen is shown, even when the workout was left for another tab. Mounted once, in the
 * root layout.
 */
export function useTimerCompletion(): void {
  const running = useTimer((state) => state.status === 'running');

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const finished = useTimer.getState().finishIfOver(Date.now());
      if (!finished) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      finished.onFinish?.();
    }, 250);
    return () => clearInterval(id);
  }, [running]);
}
