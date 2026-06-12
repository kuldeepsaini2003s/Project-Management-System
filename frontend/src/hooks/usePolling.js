import { useEffect, useRef } from "react";

/**
 * Calls `callback` every `intervalMs` while `active` is true.
 * Skips ticks while the tab is hidden to avoid needless requests.
 */
export default function usePolling(callback, intervalMs, active = true) {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active || !intervalMs) return;
    const tick = () => {
      if (!document.hidden) saved.current();
    };
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, active]);
}
