import { useRef, useEffect } from 'react';

/**
 * useWakeLock - Reusable Screen Wake Lock hook
 * Requests/releases the Screen Wake Lock API based on a boolean condition.
 * Re-acquires on visibilitychange (iOS releases wake lock when backgrounded).
 */
export function useWakeLock(shouldBeActive) {
  const wakeLockRef = useRef(null);

  // Request or release wake lock based on shouldBeActive
  useEffect(() => {
    const requestWakeLock = async () => {
      if (shouldBeActive) {
        try {
          if ('wakeLock' in navigator && !wakeLockRef.current) {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
          }
        } catch (err) {
          console.debug('Wake lock not available:', err.message);
        }
      } else {
        if (wakeLockRef.current) {
          wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, [shouldBeActive]);

  // Re-acquire wake lock when page becomes visible (iOS releases on background)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && shouldBeActive && !wakeLockRef.current) {
        try {
          if ('wakeLock' in navigator) {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
          }
        } catch (err) {
          console.debug('Wake lock re-acquire failed:', err.message);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [shouldBeActive]);
}
