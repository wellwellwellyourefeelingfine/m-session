/**
 * useAppUpdater
 *
 * Wraps vite-plugin-pwa's `useRegisterSW` hook with manual-check support and
 * a "silent activation during the startup window" behavior for users who have
 * automatic updates enabled (the default).
 *
 * Designed to be called ONCE at the app root via AppUpdaterProvider. The
 * resulting state is consumed by SessionMenu through the context.
 *
 * Behavior summary:
 * - On registration: stores the ServiceWorkerRegistration so we can call
 *   `.update()` on demand for the manual check.
 * - When a new SW is detected (`needRefresh: true`):
 *   - If automatic updates are enabled AND we're still inside the startup
 *     window (~5 seconds after page load), silently activate and reload.
 *   - Otherwise, leave the worker waiting. The menu will surface "Update App"
 *     and the user can tap to apply, OR the next natural cold-launch will
 *     pick up the waiting worker.
 *
 * The startup-window heuristic exists to differentiate "the user just opened
 * the app and isn't doing anything yet" (safe to reload) from "the user has
 * been actively using the app" (don't yank the rug out from under them).
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useAppStore } from '../stores/useAppStore';

const STARTUP_WINDOW_MS = 5000;
// Minimum time the "Checking…" label is shown so the user gets visual feedback
// even when the underlying update() call resolves instantly (e.g., when the
// manifest is fully cached and there's nothing to fetch).
const MIN_CHECKING_DURATION_MS = 400;

export function useAppUpdater() {
  const registrationRef = useRef(null);
  // Status states:
  //   'idle'     — ready to check; menu shows "App Up-to-Date" or "Update App"
  //   'checking' — check in flight; menu shows "Checking…" and is disabled
  //   'error'    — most recent check threw a real error (network down, server
  //                500, timeout); menu shows "Error - Try Again" so the user
  //                can retry. Cleared automatically on the next successful or
  //                no-op check.
  //
  // Note: "no service worker registered" is NOT an error. That's a dev-mode
  // edge case. We treat it as a no-op (cycles back to 'idle') so the dev/test
  // experience matches production.
  const [checkStatus, setCheckStatus] = useState('idle'); // 'idle' | 'checking' | 'error'

  // Read the user's preference reactively so toggling it in Settings affects
  // the next `needRefresh` event without a page reload.
  const autoUpdateEnabled = useAppStore((s) => s.preferences.autoUpdate);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      registrationRef.current = registration;
    },
    onRegisterError(error) {
      // Log for debugging but don't surface in the UI — the menu just stays
      // at "App Up-to-Date" since there's nothing the user can do about it.
      console.error('SW registration error:', error);
    },
  });

  // Auto-apply during startup window. We use a ref to ensure we only
  // auto-apply once per page load — without it, a re-render could trigger a
  // reload loop.
  const hasAutoAppliedRef = useRef(false);
  useEffect(() => {
    if (!needRefresh || !autoUpdateEnabled) return;
    if (hasAutoAppliedRef.current) return;

    const timeSinceLoad = performance.now();
    if (timeSinceLoad < STARTUP_WINDOW_MS) {
      hasAutoAppliedRef.current = true;
      updateServiceWorker(true); // activates + reloads
    }
    // After the startup window, do nothing — the menu reflects the waiting
    // worker and the user activates manually or on next cold-launch.
  }, [needRefresh, autoUpdateEnabled, updateServiceWorker]);

  /**
   * Manual check. Forces a fetch of /app/sw.js from the server. Three possible
   * outcomes:
   *
   *   1. New worker found → `needRefresh` becomes true; menu shows "Update App".
   *   2. Nothing new → label cycles back to "App Up-to-Date".
   *   3. Genuine error (network failure, server returned an error, timeout)
   *      → checkStatus becomes 'error'; menu shows "Error - Try Again".
   *
   * Treats "no registration" (dev mode without SW, or registration still in
   * flight) as outcome #2 — a successful no-op. This is intentional so the
   * dev/test experience matches production behavior.
   */
  const checkForUpdate = useCallback(async () => {
    setCheckStatus('checking');
    const startedAt = performance.now();
    let didError = false;

    const registration = registrationRef.current;
    if (registration) {
      try {
        await registration.update();
        // Give the browser a tick to fire onNeedRefresh if a new worker installed.
        await new Promise((resolve) => setTimeout(resolve, 200));

        if (registration.waiting) {
          // New worker found — make sure needRefresh is set so the menu reflects it.
          setNeedRefresh(true);
        }
      } catch (error) {
        // Real error (network failure, server error, timeout). Surface to the
        // user via the 'error' status so they can tap to retry.
        console.error('Update check failed:', error);
        didError = true;
      }
    }
    // No registration: nothing to do. Fall through to the min-duration wait
    // so the user still sees "Checking…" briefly. This is treated as a
    // successful no-op, not an error.

    // Enforce a minimum visible duration on the "Checking…" label so the
    // user gets feedback even when the update call resolves instantly.
    const elapsed = performance.now() - startedAt;
    if (elapsed < MIN_CHECKING_DURATION_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_CHECKING_DURATION_MS - elapsed));
    }

    setCheckStatus(didError ? 'error' : 'idle');
  }, [setNeedRefresh]);

  const applyUpdate = useCallback(() => {
    updateServiceWorker(true); // activates + reloads
  }, [updateServiceWorker]);

  return {
    checkStatus, // 'idle' | 'checking' | 'error'
    updateAvailable: needRefresh,
    checkForUpdate,
    applyUpdate,
  };
}
