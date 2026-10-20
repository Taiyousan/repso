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

// The pending notification lives outside the state: it's an effect, not something to render.
let notification: Promise<string | null> = Promise.resolve(null);

function reschedule(seconds: number, label: string) {
  const previous = notification;
  notification = previous.then(async (id) => {
    await cancelRestEnd(id);
    return seconds > 0 ? scheduleRestEnd(seconds, label) : null;
  });
}

/** Rest countdown between sets, backed by a scheduled notification (fires in background). */
export const useRestTimer = create<RestTimerState>((set, get) => ({
  endsAt: null,
  totalSeconds: 0,
  label: '',

  start(seconds, label) {
    set({ endsAt: Date.now() + seconds * 1000, totalSeconds: seconds, label });
    reschedule(seconds, label);
  },

  adjust(direction) {
    const { endsAt, totalSeconds, label } = get();
    if (endsAt == null) return;
    const now = Date.now();
    const nextEndsAt = Math.max(now, endsAt + direction * ADJUST_STEP_SECONDS * 1000);
    set({
      endsAt: nextEndsAt,
      totalSeconds: Math.max(0, totalSeconds + direction * ADJUST_STEP_SECONDS),
    });
    reschedule(Math.round((nextEndsAt - now) / 1000), label);
  },

  stop() {
    set({ endsAt: null, totalSeconds: 0, label: '' });
    reschedule(0, '');
  },
}));

/** Clears the countdown once it reached zero, keeping the (already delivered) notification. */
export function markRestFinished() {
  notification = Promise.resolve(null);
  useRestTimer.setState({ endsAt: null, totalSeconds: 0, label: '' });
}
