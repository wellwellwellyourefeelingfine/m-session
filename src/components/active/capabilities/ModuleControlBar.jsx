/**
 * ModuleControlBar Component
 *
 * A fixed-position control bar that sits above the tab bar.
 * Provides consistent module controls across all module types.
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────────┐
 * │  <|     [Left Slot]    [Primary Button]   [Right Slot]  |>  │
 * │ back                                                   skip │
 * └──────────────────────────────────────────────────────────┘
 *
 * - Far left: Back button (|<) - small icon, shows confirmation
 * - Far right: Skip button (>|) - small icon, shows confirmation
 * - Center: Primary action button (Begin/Continue/Pause/Resume)
 * - Left slot: Optional secondary control (e.g., animation toggle)
 * - Right slot: Optional secondary control (e.g., mute button)
 */

import { useState } from 'react';

/**
 * @param {object} props
 * @param {string} props.phase - Current phase: 'idle' | 'active' | 'paused' | 'completed'
 * @param {object} props.primary - Primary button config { label, onClick, disabled }
 * @param {boolean} props.showBack - Show back button
 * @param {boolean} props.showSkip - Show skip button
 * @param {function} props.onBack - Back button handler
 * @param {function} props.onSkip - Skip button handler
 * @param {React.ReactNode} props.leftSlot - Optional left slot content
 * @param {React.ReactNode} props.rightSlot - Optional right slot content
 * @param {string} props.backConfirmMessage - Custom back confirmation message
 * @param {string} props.skipConfirmMessage - Custom skip confirmation message
 */
export default function ModuleControlBar({
  phase = 'idle',
  primary = {},
  showBack = false,
  showSkip = true,
  onBack,
  onSkip,
  leftSlot,
  rightSlot,
  backConfirmMessage = 'Go back to the previous module?',
  skipConfirmMessage = 'Skip this module?',
}) {
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [isPrimaryPressed, setIsPrimaryPressed] = useState(false);

  const handleBackClick = () => {
    // If no confirmation message provided, go back directly
    if (!backConfirmMessage) {
      onBack?.();
    } else {
      setShowBackConfirm(true);
    }
  };

  const handleSkipClick = () => {
    setShowSkipConfirm(true);
  };

  const confirmBack = () => {
    setShowBackConfirm(false);
    onBack?.();
  };

  const confirmSkip = () => {
    setShowSkipConfirm(false);
    onSkip?.();
  };

  return (
    <>
      {/* Fixed control bar - positioned above tab bar */}
      {/* pointer-events-none allows clicks to pass through transparent areas */}
      <div className="fixed bottom-12 left-0 right-0 h-14 z-30 pointer-events-none">
        <div className="h-full flex items-center justify-between px-4">
          {/* Far left: Back button */}
          <div className="w-10 flex justify-start">
            {showBack && (
              <button
                onClick={handleBackClick}
                className="w-8 h-8 rounded-full border border-[var(--color-text-tertiary)] flex items-center justify-center
                  text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] transition-colors pointer-events-auto"
                aria-label="Go back"
              >
                <BackIcon />
              </button>
            )}
          </div>

          {/* Left slot for secondary controls */}
          <div className="w-12 flex justify-center">
            {leftSlot}
          </div>

          {/* Center: Primary button */}
          <div className="flex-1 flex justify-center px-4">
            {primary?.label && !primary.disabled ? (
              <button
                onClick={primary.onClick}
                onTouchStart={() => setIsPrimaryPressed(true)}
                onTouchEnd={() => setIsPrimaryPressed(false)}
                onMouseDown={() => setIsPrimaryPressed(true)}
                onMouseUp={() => setIsPrimaryPressed(false)}
                onMouseLeave={() => setIsPrimaryPressed(false)}
                className={`px-8 py-2.5 bg-[var(--color-text-primary)] text-[var(--color-bg)]
                  uppercase tracking-wider text-[10px] min-w-[120px] rounded-sm
                  transition-all duration-100 ease-out pointer-events-auto
                  ${isPrimaryPressed
                    ? 'translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0_rgba(0,0,0,0.2)]'
                    : 'translate-x-0 translate-y-0 shadow-[2px_2px_0_rgba(0,0,0,0.2)]'
                  }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {primary.label}
              </button>
            ) : (
              <button
                disabled
                className="px-8 py-2.5 border border-[var(--color-border)] text-[var(--color-text-tertiary)]
                  uppercase tracking-wider text-[10px] cursor-not-allowed min-w-[120px] flex items-center justify-center pointer-events-auto"
                style={{ backgroundColor: 'var(--color-border)', opacity: 0.4 }}
              >
                {primary?.label || (
            <span className="flex items-center gap-2">
              <span className="w-[6px] h-[6px] rounded-full border-[1.5px] border-[var(--color-text-secondary)]" />
              <span className="w-[6px] h-[6px] rounded-full border-[1.5px] border-[var(--color-text-secondary)]" />
              <span className="w-[6px] h-[6px] rounded-full border-[1.5px] border-[var(--color-text-secondary)]" />
            </span>
          )}
              </button>
            )}
          </div>

          {/* Right slot for secondary controls */}
          <div className="w-12 flex justify-center">
            {rightSlot}
          </div>

          {/* Far right: Skip button */}
          <div className="w-10 flex justify-end">
            {showSkip && (
              <button
                onClick={handleSkipClick}
                className="w-8 h-8 rounded-full border border-[var(--color-text-tertiary)] flex items-center justify-center
                  text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] transition-colors pointer-events-auto"
                aria-label="Skip module"
              >
                <SkipIcon />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Back confirmation modal */}
      {showBackConfirm && (
        <ConfirmationModal
          message={backConfirmMessage}
          confirmLabel="Go Back"
          cancelLabel="Stay Here"
          onConfirm={confirmBack}
          onCancel={() => setShowBackConfirm(false)}
        />
      )}

      {/* Skip confirmation modal */}
      {showSkipConfirm && (
        <ConfirmationModal
          message={skipConfirmMessage}
          confirmLabel="Skip"
          cancelLabel="Continue"
          onConfirm={confirmSkip}
          onCancel={() => setShowSkipConfirm(false)}
        />
      )}
    </>
  );
}

/**
 * Back Icon (|<)
 */
function BackIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Vertical line */}
      <line x1="4" y1="4" x2="4" y2="12" />
      {/* Arrow pointing left */}
      <polyline points="10,4 6,8 10,12" />
    </svg>
  );
}

/**
 * Skip Icon (>|)
 */
function SkipIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Arrow pointing right */}
      <polyline points="6,4 10,8 6,12" />
      {/* Vertical line */}
      <line x1="12" y1="4" x2="12" y2="12" />
    </svg>
  );
}

/**
 * Confirmation Modal
 */
function ConfirmationModal({
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6"
      onClick={onCancel}
    >
      <div
        className="bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-xs p-6 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="uppercase tracking-wider text-xs text-center mb-6 text-[var(--color-text-primary)]">
          {message}
        </p>
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            className="w-full py-3 border border-[var(--color-border)]
              text-[var(--color-text-primary)] uppercase tracking-wider text-xs
              hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)]
              uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Secondary control button for slots
 */
export function SlotButton({ icon, label, onClick, active = false, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed pointer-events-auto
        ${active
          ? 'text-[var(--color-text-primary)] border-[var(--color-text-primary)]'
          : 'text-[var(--color-text-tertiary)] border-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]'
        }`}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

/**
 * Mute/Unmute button for right slot
 */
export function MuteButton({ isMuted, onToggle, disabled = false }) {
  return (
    <SlotButton
      icon={isMuted ? <MutedIcon /> : <UnmutedIcon />}
      label={isMuted ? 'Unmute' : 'Mute'}
      onClick={onToggle}
      active={!isMuted}
      disabled={disabled}
    />
  );
}

function UnmutedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

export { ConfirmationModal, BackIcon, SkipIcon };
