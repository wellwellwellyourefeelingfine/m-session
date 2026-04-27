/**
 * ModuleControlBar Component
 *
 * A fixed-position control bar that sits above the tab bar.
 * Provides consistent module controls across all module types.
 *
 * Layout (default 5-column):
 * ┌──────────────────────────────────────────────────────────┐
 * │  <|     [Left Slot]    [Primary Button]   [Right Slot]  |>  │
 * │ back                                                   skip │
 * └──────────────────────────────────────────────────────────┘
 *
 * Layout (with seek controls, 7-column):
 * ┌──────────────────────────────────────────────────────────┐
 * │  <|  [Left]  [←10]  [Primary Button]  [10→]  [Right]  |>  │
 * │ back  vol    seek     Pause/Resume     seek   txpt   skip │
 * └──────────────────────────────────────────────────────────┘
 *
 * - Far left: Back button (|<) - small icon, shows confirmation
 * - Far right: Skip button (>|) - small icon, shows confirmation
 * - Center: Primary action button (Begin/Continue/Pause/Resume)
 * - Left slot: Optional secondary control (e.g., volume)
 * - Right slot: Optional secondary control (e.g., transcript)
 * - Seek controls: ←10/10→ buttons flanking primary (conditionally rendered)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '../../../stores/useAppStore';

/**
 * @param {object} props
 * @param {string} props.phase - Current phase: 'idle' | 'active' | 'paused' | 'completed'
 * @param {object} props.primary - Primary button config { label, onClick, disabled, loading }
 *   - `loading: true` renders the active style (same color, same size) but blocks clicks.
 *     Use for brief transitional states (e.g. composing audio) where `disabled: true`'s
 *     greyed-out look would feel jarring.
 * @param {boolean} props.showBack - Show back button
 * @param {boolean} props.showSkip - Show skip button
 * @param {function} props.onBack - Back button handler
 * @param {function} props.onSkip - Skip button handler
 * @param {React.ReactNode} props.leftSlot - Optional left slot content
 * @param {React.ReactNode} props.rightSlot - Optional right slot content
 * @param {string} props.backConfirmMessage - Custom back confirmation message
 * @param {string} props.skipConfirmMessage - Custom skip confirmation message
 * @param {boolean} props.showSeekControls - Show skip-back/skip-forward buttons flanking primary
 * @param {function} props.onSeekBack - Skip back handler (e.g., -10s)
 * @param {function} props.onSeekForward - Skip forward handler (e.g., +10s)
 */
export default function ModuleControlBar({
  _phase = 'idle',
  primary = {},
  showBack = false,
  showSkip = true,
  onBack,
  onSkip,
  leftSlot,
  rightSlot,
  backConfirmMessage = 'Go back to the previous module?',
  skipConfirmMessage = 'Skip this module?',
  showSeekControls = false,
  onSeekBack,
  onSeekForward,
}) {
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [isPrimaryPressed, setIsPrimaryPressed] = useState(false);
  const triggerLogoAnimation = useAppStore((state) => state.triggerLogoAnimation);

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
      <div className="fixed left-0 right-0 h-14 z-30 pointer-events-none" style={{ bottom: 'var(--tabbar-height)' }}>
        <div className="h-full flex items-center justify-between px-4 max-w-[1000px] mx-auto">
          {/* Left group: Back button + left slot */}
          <div className="flex items-center gap-2">
            <div className="w-8 flex justify-center">
              {showBack && (
                <button
                  onClick={handleBackClick}
                  className="w-8 h-8 rounded-full border border-[var(--color-text-tertiary)] flex items-center justify-center
                    text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] transition-colors pointer-events-auto
                    animate-fadeIn"
                  aria-label="Go back"
                >
                  <BackIcon />
                </button>
              )}
            </div>
            <div className="w-8 flex justify-center">
              {leftSlot}
            </div>
          </div>

          {/* Center group: seek-back + primary + seek-forward (tight cluster) */}
          <div className="flex items-center gap-2">
            {showSeekControls && (
              <button
                onClick={onSeekBack}
                className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)]
                  hover:text-[var(--color-text-secondary)] transition-colors pointer-events-auto
                  animate-fadeIn"
                aria-label="Skip back 10 seconds"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <SeekBackIcon />
              </button>
            )}

            {primary?.label && primary.loading && !primary.disabled ? (
              <button
                disabled
                aria-busy="true"
                className="px-8 py-2.5 bg-[var(--color-text-primary)] text-[var(--color-bg)]
                  uppercase tracking-wider text-[10px] w-[120px] rounded-sm
                  pointer-events-auto cursor-not-allowed
                  translate-x-0 translate-y-0 shadow-[2px_2px_0_rgba(0,0,0,0.2)]"
                style={{ WebkitTapHighlightColor: 'transparent', fontFamily: 'Azeret Mono, monospace' }}
              >
                {primary.label}
              </button>
            ) : primary?.label && !primary.disabled ? (
              <button
                onClick={() => { primary.onClick?.(); triggerLogoAnimation(); }}
                onTouchStart={() => setIsPrimaryPressed(true)}
                onTouchEnd={() => setIsPrimaryPressed(false)}
                onMouseDown={() => setIsPrimaryPressed(true)}
                onMouseUp={() => setIsPrimaryPressed(false)}
                onMouseLeave={() => setIsPrimaryPressed(false)}
                className={`px-8 py-2.5 bg-[var(--color-text-primary)] text-[var(--color-bg)]
                  uppercase tracking-wider text-[10px] w-[120px] rounded-sm
                  transition-all duration-100 ease-out pointer-events-auto
                  ${isPrimaryPressed
                    ? 'translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0_rgba(0,0,0,0.2)]'
                    : 'translate-x-0 translate-y-0 shadow-[2px_2px_0_rgba(0,0,0,0.2)]'
                  }`}
                style={{ WebkitTapHighlightColor: 'transparent', fontFamily: 'Azeret Mono, monospace' }}
              >
                {primary.label}
              </button>
            ) : (
              <button
                disabled
                className="px-8 py-2.5 border border-[var(--color-border)] text-[var(--color-text-tertiary)]
                  uppercase tracking-wider text-[10px] cursor-not-allowed w-[120px] flex items-center justify-center pointer-events-auto"
                style={{ backgroundColor: 'var(--color-border)', opacity: 0.4, fontFamily: 'Azeret Mono, monospace' }}
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

            {showSeekControls && (
              <button
                onClick={onSeekForward}
                className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)]
                  hover:text-[var(--color-text-secondary)] transition-colors pointer-events-auto
                  animate-fadeIn"
                aria-label="Skip forward 10 seconds"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <SeekForwardIcon />
              </button>
            )}
          </div>

          {/* Right group: right slot + skip button */}
          <div className="flex items-center gap-2">
            <div className="w-8 flex justify-center">
              {rightSlot}
            </div>
            <div className="w-8 flex justify-center">
              {showSkip && (
                <button
                  onClick={handleSkipClick}
                  className="w-8 h-8 rounded-full border border-[var(--color-text-tertiary)] flex items-center justify-center
                    text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] transition-colors pointer-events-auto
                    animate-fadeIn"
                  aria-label="Skip module"
                >
                  <SkipIcon />
                </button>
              )}
            </div>
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
 * Seek Back Icon — circular arrow with "10"
 */
function SeekBackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Circular arrow (counterclockwise) */}
      <path d="M1 4v6h6" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      {/* "10" text */}
      <text x="12" y="15.5" textAnchor="middle" fontSize="7.5" fill="currentColor" stroke="none" fontFamily="system-ui, sans-serif" fontWeight="600">10</text>
    </svg>
  );
}

/**
 * Seek Forward Icon — circular arrow with "10"
 */
function SeekForwardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Circular arrow (clockwise) */}
      <path d="M23 4v6h-6" />
      <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
      {/* "10" text */}
      <text x="12" y="15.5" textAnchor="middle" fontSize="7.5" fill="currentColor" stroke="none" fontFamily="system-ui, sans-serif" fontWeight="600">10</text>
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
      className="fixed inset-0 bg-black/25 flex items-center justify-center z-50 px-6"
      onClick={onCancel}
    >
      <div
        className="bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-xs p-6 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <p
          className="uppercase tracking-wider text-xs text-center mb-6 text-[var(--color-text-primary)]"
          style={{ fontFamily: 'Azeret Mono, monospace' }}
        >
          {message}
        </p>
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            className="w-full py-3 border border-[var(--color-border)]
              text-[var(--color-text-primary)] uppercase tracking-wider text-xs
              hover:bg-[var(--color-bg-secondary)] transition-colors"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)]
              uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
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

/**
 * Volume button with popup slider for right slot
 */
export function VolumeButton({ volume, onVolumeChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const isMuted = volume === 0;

  return (
    <div ref={containerRef} className="relative pointer-events-auto">
      {isOpen && (
        <VolumeSliderPopup volume={volume} onVolumeChange={onVolumeChange} />
      )}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors
          disabled:opacity-40 disabled:cursor-not-allowed
          ${!isMuted
            ? 'text-[var(--color-text-primary)] border-[var(--color-text-primary)]'
            : 'text-[var(--color-text-tertiary)] border-[var(--color-text-tertiary)]'
          }`}
        aria-label="Volume"
      >
        {isMuted ? <MutedIcon /> : <UnmutedIcon />}
      </button>
    </div>
  );
}

/**
 * Volume slider popup — appears above the volume button
 */
function VolumeSliderPopup({ volume, onVolumeChange }) {
  const trackRef = useRef(null);
  const isDragging = useRef(false);

  const getVolumeFromY = useCallback((clientY) => {
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = 1 - (clientY - rect.top) / rect.height;
    return Math.max(0, Math.min(1, ratio));
  }, []);

  const handleInteraction = useCallback((clientY) => {
    onVolumeChange(getVolumeFromY(clientY));
  }, [getVolumeFromY, onVolumeChange]);

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      handleInteraction(clientY);
    };
    const handleEnd = () => { isDragging.current = false; };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [handleInteraction]);

  return (
    <div
      className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2
        bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full
        px-4 py-2 animate-fadeIn"
      style={{ zIndex: 40, touchAction: 'none' }}
    >
      <div
        ref={trackRef}
        className="relative w-1.5 h-24 bg-[var(--color-border)] rounded-full cursor-pointer"
        onMouseDown={(e) => { isDragging.current = true; handleInteraction(e.clientY); }}
        onTouchStart={(e) => { e.stopPropagation(); isDragging.current = true; handleInteraction(e.touches[0].clientY); }}
      >
        {/* Filled portion */}
        <div
          className="absolute bottom-0 w-full bg-[var(--color-text-primary)] rounded-full pointer-events-none"
          style={{ height: `${volume * 100}%` }}
        />
        {/* Thumb */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full
            bg-[var(--color-text-primary)] pointer-events-none"
          style={{ bottom: `calc(${volume * 100}% - 10px)` }}
        />
      </div>
    </div>
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

export { ConfirmationModal, BackIcon, SkipIcon, SeekBackIcon, SeekForwardIcon };
