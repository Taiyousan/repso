import { AppState } from 'react-native';
import { create } from 'zustand';

import {
  dismissCountdownNotification,
  showCountdownNotification,
} from '@/modules/countdown-notification';

import { cancelTimerEnd, dismissTimerEnd, scheduleTimerEnd } from './notifications';

const ADJUST_STEP_SECONDS = 15;
export const DEFAULT_MANUAL_SECONDS = 60;
export const TIMER_PRESETS = [30, 45, 60, 90, 120, 180, 300] as const;

/**
 * rest: started automatically after a set. manual: started from the timer screen.
 * set: a timed set (plank…), validated when the countdown ends.
 */
export type TimerKind = 'rest' | 'manual' | 'set';
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
  /** Rest: the exercise coming next. Set: the exercise being done. */
  label: string;
  /** Timed set being counted down, if any. */
  setId: number | null;
  /** Run when the countdown reaches zero (not when stopped). */
  onFinish: (() => void) | null;

  startRest: (seconds: number, nextExercise: string) => void;
  startManual: (seconds: number) => void;
  startSet: (seconds: number, exercise: string, setId: number, onFinish: () => void) => void;
  setDuration: (seconds: number) => void;
  pause: () => void;
  resume: () => void;
  adjust: (direction: 1 | -1) => void;
  stop: () => void;
  /**
   * Called by the UI on each tick. The first call after the countdown is over ends it and
   * returns what to run; every other call returns null.
   */
  finishIfOver: (now: number) => { onFinish: (() => void) | null } | null;
};

// Notification calls are chained so a quick sequence of actions applies in order.
let pending: Promise<void> = Promise.resolve();
const queue = (task: () => Promise<void> | void) => {
  pending = pending.then(task).catch(() => undefined);
};

function texts(kind: TimerKind, label: string) {
  switch (kind) {
    case 'rest':
      return {
        countdownTitle: 'Repos',
        countdownBody: label ? `Ensuite : ${label}` : 'Séance en cours',
        endTitle: 'Repos terminé',
        endBody: label ? `C'est reparti : ${label}` : "C'est reparti !",
      };
    case 'set':
      return {
        countdownTitle: label || 'Série en cours',
        countdownBody: 'Tiens bon !',
        endTitle: 'Série terminée',
        endBody: label ? `${label} : validée` : 'Validée',
      };
    case 'manual':
      return {
        countdownTitle: 'Minuteur',
        countdownBody: 'En cours',
        endTitle: 'Minuteur terminé',
        endBody: 'Temps écoulé !',
      };
  }
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
    await dismissTimerEnd();
  });
}

/** Leaves the end alert visible a moment, then clears it unless another countdown started. */
const END_ALERT_VISIBLE_MS = 5000;

function notifyFinished() {
  dismissCountdownNotification();
  setTimeout(() => {
    if (useTimer.getState().status === 'idle') void dismissTimerEnd();
  }, END_ALERT_VISIBLE_MS);
}

/** Back to idle; a manual timer keeps its duration, ready to be started again. */
function idleState(kind: TimerKind, totalSeconds: number) {
  return {
    status: 'idle' as const,
    kind: 'manual' as const,
    endsAt: null,
    label: '',
    setId: null,
    onFinish: null,
    remainingMs: (kind === 'manual' ? totalSeconds : DEFAULT_MANUAL_SECONDS) * 1000,
    totalSeconds: kind === 'manual' ? totalSeconds : DEFAULT_MANUAL_SECONDS,
  };
}

/** The app's single countdown: rest between sets, timed sets, or a manual timer. */
export const useTimer = create<TimerState>((set, get) => {
  const run = (
    kind: TimerKind,
    seconds: number,
    extra: Partial<Pick<TimerState, 'label' | 'setId' | 'onFinish'>> = {},
  ) => {
    const endsAt = Date.now() + seconds * 1000;
    const label = extra.label ?? '';
    set({
      status: 'running',
      kind,
      endsAt,
      totalSeconds: seconds,
      remainingMs: seconds * 1000,
      label,
      setId: extra.setId ?? null,
      onFinish: extra.onFinish ?? null,
    });
    notifyRunning(kind, label, endsAt);
  };

  return {
    ...idleState('manual', DEFAULT_MANUAL_SECONDS),

    startRest: (seconds, nextExercise) => run('rest', seconds, { label: nextExercise }),
    startManual: (seconds) => run('manual', seconds),
    startSet: (seconds, exercise, setId, onFinish) =>
      run('set', seconds, { label: exercise, setId, onFinish }),

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
      set(idleState(kind, totalSeconds));
      notifyStopped();
    },

    finishIfOver(now) {
      const { status, endsAt, kind, totalSeconds, onFinish } = get();
      if (status !== 'running' || endsAt == null || now < endsAt) return null;
      set(idleState(kind, totalSeconds));
      notifyFinished();
      return { onFinish };
    },
  };
});

/** One-line description of the timer, for the bar and the timer screen. */
export function timerCaption(state: Pick<TimerState, 'status' | 'kind' | 'label'>): string {
  if (state.status === 'idle') return 'Choisis une durée';
  if (state.status === 'paused') return 'En pause';
  switch (state.kind) {
    case 'rest':
      return state.label ? `Repos · ensuite ${state.label}` : 'Repos';
    case 'set':
      return state.label ? `Série en cours · ${state.label}` : 'Série en cours';
    case 'manual':
      return 'Minuteur';
  }
}

/** Milliseconds left, whatever the state. */
export function timerRemainingMs(
  state: Pick<TimerState, 'status' | 'endsAt' | 'remainingMs'>,
  now: number,
) {
  if (state.status === 'running' && state.endsAt != null) return Math.max(0, state.endsAt - now);
  return state.remainingMs;
}

/**
 * No notification may outlive the timer: clear leftovers (app killed while counting down, alert
 * left in the shade) at launch and whenever the app comes back to the foreground.
 */
function clearIdleNotifications() {
  if (useTimer.getState().status !== 'idle') return;
  dismissCountdownNotification();
  void dismissTimerEnd();
}

clearIdleNotifications();
AppState.addEventListener('change', (state) => {
  if (state === 'active') clearIdleNotifications();
});
