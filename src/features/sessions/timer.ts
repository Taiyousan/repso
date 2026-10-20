import { create } from 'zustand';

import {
  dismissCountdownNotification,
  showCountdownNotification,
} from '@/modules/countdown-notification';

import { cancelTimerEnd, scheduleTimerEnd } from './notifications';

const ADJUST_STEP_SECONDS = 15;
export const DEFAULT_MANUAL_SECONDS = 60;
export const TIMER_PRESETS = [30, 45, 60, 90, 120, 180, 300] as const;

/** rest: started automatically after a set. manual: started from the timer screen. */
export type TimerKind = 'rest' | 'manual';
export type TimerStatus = 'idle' | 'running' | 'paused';

type TimerState = {
  status: TimerStatus;
  kind: TimerKind;
  /** Epoch ms when it ends, while running. */
  endsAt: number | null;
  /** Time left when paused, or the chosen duration when idle. */
  remainingMs: number;
  /** Full length of the current countdown, for progress display. */
  totalSeconds: number;
  /** Rest: the exercise coming next. */
  label: string;

  startRest: (seconds: number, nextExercise: string) => void;
  startManual: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  pause: () => void;
  resume: () => void;
  adjust: (direction: 1 | -1) => void;
  stop: () => void;
  /** Called by the UI on each tick; returns true only the first time the countdown is over. */
  finishIfOver: (now: number) => boolean;
};

// Notification calls are chained so a quick sequence of actions applies in order.
let pending: Promise<void> = Promise.resolve();
const queue = (task: () => Promise<void> | void) => {
  pending = pending.then(task).catch(() => undefined);
};

function texts(kind: TimerKind, label: string) {
  return kind === 'rest'
    ? {
        countdownTitle: 'Repos',
        countdownBody: label ? `Ensuite : ${label}` : 'Séance en cours',
        endTitle: 'Repos terminé',
        endBody: label ? `C'est reparti : ${label}` : "C'est reparti !",
      }
    : {
        countdownTitle: 'Minuteur',
        countdownBody: 'En cours',
        endTitle: 'Minuteur terminé',
        endBody: 'Temps écoulé !',
      };
}

function notifyRunning(kind: TimerKind, label: string, endsAt: number) {
  const text = texts(kind, label);
  queue(async () => {
    showCountdownNotification(text.countdownTitle, text.countdownBody, endsAt);
    await scheduleTimerEnd(endsAt, text.endTitle, text.endBody);
  });
}

function notifyStopped() {
  queue(async () => {
    dismissCountdownNotification();
    await cancelTimerEnd();
  });
}

const IDLE = { status: 'idle' as const, endsAt: null, label: '' };

/** The app's single countdown: rest between sets, or a manual timer (planks, intervals…). */
export const useTimer = create<TimerState>((set, get) => ({
  ...IDLE,
  kind: 'manual',
  remainingMs: DEFAULT_MANUAL_SECONDS * 1000,
  totalSeconds: DEFAULT_MANUAL_SECONDS,

  startRest(seconds, nextExercise) {
    const endsAt = Date.now() + seconds * 1000;
    set({ status: 'running', kind: 'rest', endsAt, totalSeconds: seconds, label: nextExercise });
    notifyRunning('rest', nextExercise, endsAt);
  },

  startManual(seconds) {
    const endsAt = Date.now() + seconds * 1000;
    set({ status: 'running', kind: 'manual', endsAt, totalSeconds: seconds, label: '' });
    notifyRunning('manual', '', endsAt);
  },

  setDuration(seconds) {
    if (get().status !== 'idle') return;
    const clamped = Math.max(5, seconds);
    set({ kind: 'manual', remainingMs: clamped * 1000, totalSeconds: clamped });
  },

  pause() {
    const { status, endsAt } = get();
    if (status !== 'running' || endsAt == null) return;
    set({ status: 'paused', endsAt: null, remainingMs: Math.max(0, endsAt - Date.now()) });
    notifyStopped();
  },

  resume() {
    const { status, remainingMs, kind, label } = get();
    if (status !== 'paused') return;
    const endsAt = Date.now() + remainingMs;
    set({ status: 'running', endsAt });
    notifyRunning(kind, label, endsAt);
  },

  adjust(direction) {
    const { status, endsAt, remainingMs, totalSeconds, kind, label } = get();
    const deltaMs = direction * ADJUST_STEP_SECONDS * 1000;
    const nextTotal = Math.max(0, totalSeconds + direction * ADJUST_STEP_SECONDS);
    if (status === 'running' && endsAt != null) {
      const nextEndsAt = Math.max(Date.now(), endsAt + deltaMs);
      set({ endsAt: nextEndsAt, totalSeconds: nextTotal });
      notifyRunning(kind, label, nextEndsAt);
    } else if (status === 'paused') {
      set({ remainingMs: Math.max(0, remainingMs + deltaMs), totalSeconds: nextTotal });
    } else {
      get().setDuration(Math.round(remainingMs / 1000) + direction * ADJUST_STEP_SECONDS);
    }
  },

  stop() {
    const { kind, totalSeconds } = get();
    // A manual timer goes back to its duration, ready to be started again.
    set({
      ...IDLE,
      remainingMs: (kind === 'manual' ? totalSeconds : DEFAULT_MANUAL_SECONDS) * 1000,
    });
    notifyStopped();
  },

  finishIfOver(now) {
    const { status, endsAt, kind, totalSeconds } = get();
    if (status !== 'running' || endsAt == null || now < endsAt) return false;
    // The system delivers the end alert and removes the countdown notification by itself.
    set({
      ...IDLE,
      remainingMs: (kind === 'manual' ? totalSeconds : DEFAULT_MANUAL_SECONDS) * 1000,
    });
    return true;
  },
}));

/** Milliseconds left, whatever the state. */
export function timerRemainingMs(
  state: Pick<TimerState, 'status' | 'endsAt' | 'remainingMs'>,
  now: number,
) {
  if (state.status === 'running' && state.endsAt != null) return Math.max(0, state.endsAt - now);
  return state.remainingMs;
}
