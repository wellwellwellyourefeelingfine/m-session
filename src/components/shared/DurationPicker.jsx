/**
 * DurationPicker Component
 * Plus/minus stepper for selecting duration in minutes.
 * Steps through predefined duration values (e.g., 10, 15, 20, 25, 30 minutes).
 */

import { useState, useEffect, useMemo } from 'react';

export default function DurationPicker({
  isOpen,
  onClose,
  onSelect,
  currentDuration,
  durationSteps = [10, 15, 20, 25, 30],
  minDuration = 10,
  maxDuration = 30,
}) {
  const validSteps = useMemo(
    () => durationSteps.filter((step) => step >= minDuration && step <= maxDuration),
    [durationSteps, minDuration, maxDuration]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const index = validSteps.indexOf(currentDuration);
      setSelectedIndex(index >= 0 ? index : 0);
      setClosing(false);
    }
  }, [isOpen, currentDuration, validSteps]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  const handleDecrement = () => {
    setSelectedIndex((i) => Math.max(0, i - 1));
  };

  const handleIncrement = () => {
    setSelectedIndex((i) => Math.min(validSteps.length - 1, i + 1));
  };

  const handleConfirm = () => {
    onSelect(validSteps[selectedIndex]);
    handleClose();
  };

  if (!isOpen) return null;

  const isAtMin = selectedIndex === 0;
  const isAtMax = selectedIndex === validSteps.length - 1;

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 ${closing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-xs shadow-lg ${closing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-4 pb-2">
          <p
            className="text-lg text-[var(--color-text-tertiary)] text-center"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            Duration
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-6 py-6">
          <button
            onClick={handleDecrement}
            disabled={isAtMin}
            className={`w-12 h-12 flex items-center justify-center rounded-full border border-[var(--color-border)] transition-opacity ${
              isAtMin ? 'opacity-20 cursor-not-allowed' : 'opacity-100 active:opacity-60'
            }`}
            aria-label="Decrease duration"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="4" y1="10" x2="16" y2="10" />
            </svg>
          </button>

          <span
            className="text-4xl min-w-[80px] text-center"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {formatDuration(validSteps[selectedIndex])}
          </span>

          <button
            onClick={handleIncrement}
            disabled={isAtMax}
            className={`w-12 h-12 flex items-center justify-center rounded-full border border-[var(--color-border)] transition-opacity ${
              isAtMax ? 'opacity-20 cursor-not-allowed' : 'opacity-100 active:opacity-60'
            }`}
            aria-label="Increase duration"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="10" y1="4" x2="10" y2="16" />
              <line x1="4" y1="10" x2="16" y2="10" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pt-2 pb-4 space-y-3">
          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-sm hover:opacity-80 transition-opacity"
          >
            Confirm
          </button>
          <button
            onClick={handleClose}
            className="w-full py-2 text-[var(--color-text-tertiary)] text-sm uppercase tracking-wider hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
