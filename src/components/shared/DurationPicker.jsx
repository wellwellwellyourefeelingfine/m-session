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
  // Filter steps to only include valid ones
  const validSteps = useMemo(
    () => durationSteps.filter((step) => step >= minDuration && step <= maxDuration),
    [durationSteps, minDuration, maxDuration]
  );

  // Track selected index into validSteps
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Sync index when picker opens
  useEffect(() => {
    if (isOpen) {
      const index = validSteps.indexOf(currentDuration);
      setSelectedIndex(index >= 0 ? index : 0);
    }
  }, [isOpen, currentDuration, validSteps]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
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

  const handleDecrement = () => {
    setSelectedIndex((i) => Math.max(0, i - 1));
  };

  const handleIncrement = () => {
    setSelectedIndex((i) => Math.min(validSteps.length - 1, i + 1));
  };

  const handleConfirm = () => {
    onSelect(validSteps[selectedIndex]);
    onClose();
  };

  if (!isOpen) return null;

  const isAtMin = selectedIndex === 0;
  const isAtMax = selectedIndex === validSteps.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-xs shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-center">Duration</h3>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-6 py-10">
          <button
            onClick={handleDecrement}
            disabled={isAtMin}
            className={`w-12 h-12 flex items-center justify-center border border-[var(--color-border)] transition-opacity ${
              isAtMin ? 'opacity-20 cursor-not-allowed' : 'opacity-100 active:opacity-60'
            }`}
            aria-label="Decrease duration"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="4" y1="10" x2="16" y2="10" />
            </svg>
          </button>

          <span className="text-4xl font-light tracking-wide min-w-[80px] text-center">
            {validSteps[selectedIndex]}m
          </span>

          <button
            onClick={handleIncrement}
            disabled={isAtMax}
            className={`w-12 h-12 flex items-center justify-center border border-[var(--color-border)] transition-opacity ${
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

        {/* Footer with buttons */}
        <div className="px-6 py-4 border-t border-[var(--color-border)] space-y-3">
          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-sm hover:opacity-80 transition-opacity"
          >
            Confirm
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-[var(--color-text-tertiary)] text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
