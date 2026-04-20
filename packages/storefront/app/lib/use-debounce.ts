import {useCallback, useEffect, useRef} from 'react';

/**
 * useDebouncedCallback — returns a stable wrapped callback that only fires
 * after `delay` ms of quiescence. Trailing edge only. Cleans up on unmount.
 *
 * Usage:
 *   const debouncedFetch = useDebouncedCallback(fetchResults, 250);
 *   <input onChange={debouncedFetch} />
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay = 250,
): (...args: Args) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Keep the latest callback without invalidating the returned wrapper's
  // identity — consumers can safely put this in effect deps.
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (...args: Args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );
}
