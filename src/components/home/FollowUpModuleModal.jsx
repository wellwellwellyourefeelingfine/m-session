/**
 * FollowUpModuleModal Component
 * Modal that appears when user taps a follow-up module
 * Shows different content based on phase lock and completion status
 */

import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { FOLLOW_UP_MODULES } from '../followup/content/followUpContent';

export default function FollowUpModuleModal({ moduleId, onClose }) {
  const followUp = useSessionStore((state) => state.followUp);
  const startFollowUpModule = useSessionStore((state) => state.startFollowUpModule);
  const [now, setNow] = useState(Date.now());
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 300);
  };

  const module = FOLLOW_UP_MODULES[moduleId];
  const moduleState = followUp.modules[moduleId];

  const isPhaseLocked = followUp.phaseUnlockTime && now < followUp.phaseUnlockTime;
  const isCompleted = moduleState.status === 'completed';
  const isAvailable = !isPhaseLocked && !isCompleted;
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
  if (isLocked && followUp.phaseUnlockTime) {
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

  const handleBegin = () => {
    startFollowUpModule(moduleId);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 bg-black/30 flex items-end justify-center z-50 ${closing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-[var(--color-bg)] w-full max-w-md rounded-t-2xl p-6 pb-8 ${closing ? 'animate-slideDownOut' : 'animate-slideUp'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top row: title + close button on same line */}
        <div className="flex items-start justify-between">
          <h3
            className="text-xl text-[var(--color-text-primary)]"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {module.title}
          </h3>
          <button
            onClick={handleClose}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors p-1 -m-1 flex-shrink-0 ml-4"
          >
            <span className="text-xl">−</span>
          </button>
        </div>

        {/* Duration estimate */}
        <p className="text-[var(--color-text-tertiary)] text-xs mb-3" style={{ marginTop: '-2px' }}>
          {module.duration}
        </p>

        {/* Description */}
        <p className="text-[var(--color-text-primary)] mb-4 leading-relaxed text-sm uppercase tracking-wider">
          {module.description}
        </p>

        {/* Locked state: Phase lock info box */}
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
              You've already completed this module.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          {/* Begin button — always visible, grayed out when locked */}
          {!isCompleted && (
            <button
              onClick={isAvailable ? handleBegin : undefined}
              disabled={isLocked}
              className={`w-full py-4 uppercase tracking-wider text-xs transition-opacity ${
                isAvailable
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)]'
                  : 'bg-[var(--color-border)] text-[var(--color-text-tertiary)] cursor-not-allowed'
              }`}
            >
              Begin
            </button>
          )}
          <button
            onClick={handleClose}
            className="w-full py-3 text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs hover:text-[var(--color-text-secondary)] transition-colors"
          >
            {isAvailable ? 'Not Now' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
