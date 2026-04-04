/**
 * useProgressReporter Hook
 *
 * Convenience wrapper for modules to report progress to the parent's
 * unified ModuleStatusBar. Constructs the standardized callback shape
 * and memoizes to prevent re-render cascades.
 *
 * Usage:
 *   const report = useProgressReporter(onProgressUpdate);
 *   report.step(3, 10);                          // step-based progress
 *   report.timer(45, 120, { isPaused: false });   // timer-based progress
 *   report.raw(42.5);                             // pre-computed 0-100 percentage
 *   report.idle();                                // clear progress
 */

import { useMemo, useRef, useCallback } from 'react';

export default function useProgressReporter(onProgressUpdate) {
  const callbackRef = useRef(onProgressUpdate);
  callbackRef.current = onProgressUpdate;

  const step = useCallback((currentStep, totalSteps) => {
    if (!callbackRef.current) return;
    const progress = totalSteps > 0
      ? Math.min(((currentStep) / totalSteps) * 100, 100)
      : 0;
    callbackRef.current({
      progress,
      mode: 'step',
      elapsed: 0,
      total: 0,
      showTimer: false,
      isPaused: false,
      currentStep,
      totalSteps,
    });
  }, []);

  const timer = useCallback((elapsed, total, opts = {}) => {
    if (!callbackRef.current) return;
    const progress = total > 0 ? Math.min((elapsed / total) * 100, 100) : 0;
    callbackRef.current({
      progress,
      mode: 'timer',
      elapsed,
      total,
      showTimer: opts.showTimer ?? true,
      isPaused: opts.isPaused ?? false,
      currentStep: 0,
      totalSteps: 0,
    });
  }, []);

  const raw = useCallback((progress) => {
    if (!callbackRef.current) return;
    callbackRef.current({
      progress: Math.min(progress, 100),
      mode: 'step',
      elapsed: 0,
      total: 0,
      showTimer: false,
      isPaused: false,
      currentStep: 0,
      totalSteps: 0,
    });
  }, []);

  const idle = useCallback(() => {
    if (!callbackRef.current) return;
    callbackRef.current({
      progress: 0,
      mode: 'idle',
      elapsed: 0,
      total: 0,
      showTimer: false,
      isPaused: false,
      currentStep: 0,
      totalSteps: 0,
    });
  }, []);

  return useMemo(() => ({ step, timer, raw, idle }), [step, timer, raw, idle]);
}
