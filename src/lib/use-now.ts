import { useEffect, useState } from 'react';

/** Current time (epoch ms), refreshed every `intervalMs` while `enabled`. */
export function useNow(intervalMs: number, enabled = true): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    const tick = () => setNow(Date.now());
    const timeout = setTimeout(tick, 0); // catch up right away after being disabled
    const id = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(timeout);
      clearInterval(id);
    };
  }, [intervalMs, enabled]);

  return now;
}
