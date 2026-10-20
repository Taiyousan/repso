import { create } from 'zustand';

import { cancelRestEnd, scheduleRestEnd } from './notifications';

const ADJUST_STEP_SECONDS = 15;

type RestTimerState = {
  /** Epoch ms when the rest ends; null when no rest is running. */
  endsAt: number | null;
  totalSeconds: number;
  label: string;
  start: (seconds: number, label: string) => void;
  adjust: (direction: 1 | -1) => void;
  stop: () => void;
};

// Notification calls are chained so a quick start/adjust/stop sequence applies in order.
let pending: Promise<void> = Promise.resolve();
const queue = (task: () => Promise<void>) => {
  pending = pending.then(task).catch(() => undefined);
};

/** Rest countdown between sets, backed by a scheduled notification (fires in background). */
export const useRestTimer = create<RestTimerState>((set, get) => ({
  endsAt: null,
  totalSeconds: 0,
  label: '',

  start(seconds, label) {
    const endsAt = Date.now() + seconds * 1000;
    set({ endsAt, totalSeconds: seconds, label });
    queue(() => scheduleRestEnd(endsAt, label));
  },

  adjust(direction) {
    const { endsAt, totalSeconds, label } = get();
    if (endsAt == null) return;
    const nextEndsAt = Math.max(Date.now(), endsAt + direction * ADJUST_STEP_SECONDS * 1000);
    set({
      endsAt: nextEndsAt,
      totalSeconds: Math.max(0, totalSeconds + direction * ADJUST_STEP_SECONDS),
    });
    queue(() => scheduleRestEnd(nextEndsAt, label));
  },

  stop() {
    set({ endsAt: null, totalSeconds: 0, label: '' });
    queue(cancelRestEnd);
  },
}));

/** Clears the countdown once it reached zero; the notification is delivered by the system. */
export function markRestFinished() {
  useRestTimer.setState({ endsAt: null, totalSeconds: 0, label: '' });
}
