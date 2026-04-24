/**
 * AltSessionModuleModal Component
 * Shared modal for pre-session and follow-up modules added from the library.
 * Shows module details, duration picker, and Begin button.
 * In follow-up mode: includes phase-level time-lock UI.
 * In pre-session mode: modules are always immediately available.
 */

import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useAppStore } from '../../stores/useAppStore';
import { getModuleById } from '../../content/modules';
import { LeafIcon, LockIcon, CircleSkipIcon } from '../shared/Icons';

export default function AltSessionModuleModal({ module, onClose, onBegin, mode = 'follow-up' }) {
  const [now, setNow] = useState(Date.now());
  const [closing, setClosing] = useState(false);

  const handleCloseAnimated = () => {
    setClosing(true);
    setTimeout(onClose, 350);
  };

  const followUp = useSessionStore((state) => state.followUp);
  const setCurrentTab = useAppStore((state) => state.setCurrentTab);

  const libraryModule = getModuleById(module.libraryId);

  // Phase-level time-lock (follow-up mode only)
  const isPreSession = mode === 'pre-session';
  const isPhaseLocked = !isPreSession && followUp?.phaseUnlockTime && now < followUp.phaseUnlockTime;
  const isCompleted = module.status === 'completed';
  const isActive = module.status === 'active';
  const isUnlocked = !isPhaseLocked;
  const isLocked = isPhaseLocked && !isCompleted;

  // Live countdown timer — updates every second for active clock
  useEffect(() => {
    if (!isLocked) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isLocked]);

  // Format countdown parts
  let countdownTime = '';
  let countdownDateTime = '';
  if (isLocked && followUp?.phaseUnlockTime) {
    const remaining = followUp.phaseUnlockTime - now;
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
    countdownTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    countdownDateTime = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(followUp.phaseUnlockTime));
  }

  // Duration picker settings

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const handleBegin = () => {
    if (onBegin) {
      onBegin(module);
    }
    onClose();
  };

  return (
    // Backdrop and modal sheet are siblings (not parent/child) so the
    // backdrop's fade in/out doesn't cascade opacity onto the sheet — the
    // sheet only slides.
    <div className="fixed inset-0 flex items-end justify-center z-50">
      <div
        className={`absolute inset-0 bg-black/25 ${closing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
        onClick={handleCloseAnimated}
      />
      <div
        className={`relative bg-[var(--color-bg)] w-full max-w-md rounded-t-2xl p-6 pb-8 ${closing ? 'animate-slideDownOut' : 'animate-slideUp'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top row: accent icon + title/duration on left, close button on right.
            Icon flips between LockIcon (time-locked) and LeafIcon (available). */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-4 min-w-0">
            {isLocked ? (
              <LockIcon size={28} strokeWidth={2.5} className="flex-shrink-0 text-[var(--accent)] mt-1" />
            ) : (
              <LeafIcon size={28} strokeWidth={2.5} className="flex-shrink-0 text-[var(--accent)] mt-1" />
            )}
            <div className="min-w-0">
              <h3
                className="mb-0 text-xl text-[var(--color-text-primary)]"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                {module.title}
              </h3>
              {/* Duration display — read-only. Changes happen in ModuleDetailModal. */}
              <div style={{ marginTop: '2px' }}>
                <p className="text-[var(--color-text-tertiary)] text-xs mb-0">
                  {formatDuration(module.duration)}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleCloseAnimated}
            className="flex-shrink-0 p-2 -m-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <CircleSkipIcon size={22} />
          </button>
        </div>

        {/* Description — `uppercase` is removed so the paragraph inherits
            text-transform from the body tokens. Mono mode: Azeret Mono,
            uppercase (body inherited), wide tracking. Readable mode: Lora,
            lowercase, tight tracking (via --tracking-wider override in
            html.font-readable). */}
        <p className="text-[var(--color-text-primary)] mt-4 mb-4 leading-relaxed text-sm tracking-wider">
          {libraryModule?.description || (isPreSession
            ? 'A pre-session activity to try before your session begins.'
            : 'A follow-up activity to continue your integration.')}
        </p>

        {/* Locked state: Phase lock info box (follow-up mode only) */}
        {isLocked && (
          <div className="mb-4 pt-4 pb-2 px-4 border-2 border-[var(--accent)] rounded">
            <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-3">
              The follow-up phase is time-locked to give you space to rest after your session.
            </p>
            <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider mb-1">
              Available in
            </p>
            <p
              className="text-2xl text-[var(--color-text-primary)] mb-2"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {countdownTime}
            </p>
            {countdownDateTime && (
              <p className="text-[var(--color-text-tertiary)] text-xs" style={{ textTransform: 'none' }}>
                {countdownDateTime}
              </p>
            )}
          </div>
        )}

        {/* Completed state */}
        {isCompleted && (
          <div className="mb-4 py-4 border border-[var(--color-border)] rounded text-center">
            <p className="text-[var(--color-text-tertiary)]">
              You've already completed this activity.
            </p>
          </div>
        )}

        {/* Active state */}
        {isActive && (
          <div className="mb-4 py-4 border border-[var(--color-border)] rounded text-center">
            <p className="text-[var(--color-text-secondary)]">
              This activity is currently in progress.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          {!isCompleted && !isActive && (
            <button
              onClick={isUnlocked ? handleBegin : undefined}
              disabled={isLocked}
              className={`w-full py-4 uppercase tracking-wider text-xs transition-opacity ${
                isUnlocked
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)]'
                  : 'bg-[var(--color-border)] text-[var(--color-text-tertiary)] cursor-not-allowed'
              }`}
            >
              Begin
            </button>
          )}
          {isActive && (
            <button
              onClick={() => {
                if (onBegin) onBegin(module);
                setCurrentTab('active');
                onClose();
              }}
              className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
            >
              Continue
            </button>
          )}
          <button
            onClick={handleCloseAnimated}
            className="w-full py-3 text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs hover:text-[var(--color-text-secondary)] transition-colors"
          >
            {(isUnlocked && !isCompleted) || isActive ? 'Not Now' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
