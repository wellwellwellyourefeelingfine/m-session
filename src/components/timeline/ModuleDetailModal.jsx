/**
 * ModuleDetailModal Component
 * Expanded view of a module showing full details
 * Allows duration adjustment for variable-duration modules
 */

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getModuleById, MODULE_TYPES } from '../../content/modules';

// Generate duration steps if not provided (5-minute increments)
function generateDurationSteps(min, max) {
  const steps = [];
  for (let i = min; i <= max; i += 5) {
    steps.push(i);
  }
  // Ensure max is included if not already
  if (steps[steps.length - 1] !== max) {
    steps.push(max);
  }
  return steps;
}

export default function ModuleDetailModal({
  isOpen,
  onClose,
  module,
  onDurationChange,
  isActiveSession = false,
}) {
  const libraryModule = getModuleById(module?.libraryId);
  const moduleType = MODULE_TYPES[libraryModule?.type];

  // Check if this module supports variable duration
  // Show stepper if hasVariableDuration is true OR if min/max duration differ
  const minDuration = libraryModule?.minDuration || 10;
  const maxDuration = libraryModule?.maxDuration || 30;
  const hasVariableDuration = libraryModule?.hasVariableDuration === true || minDuration !== maxDuration;
  const durationSteps = libraryModule?.durationSteps || generateDurationSteps(minDuration, maxDuration);

  // Filter steps to only include valid ones
  const validSteps = useMemo(
    () => durationSteps.filter((step) => step >= minDuration && step <= maxDuration),
    [durationSteps, minDuration, maxDuration]
  );

  // Track selected index into validSteps
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200); // Match animation duration
  };

  // Sync index when modal opens
  useEffect(() => {
    if (isOpen && module) {
      const index = validSteps.indexOf(module.duration);
      setSelectedIndex(index >= 0 ? index : 0);
    }
  }, [isOpen, module?.duration, validSteps]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

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
    const newIndex = Math.max(0, selectedIndex - 1);
    setSelectedIndex(newIndex);
    if (validSteps[newIndex] !== module.duration) {
      onDurationChange(validSteps[newIndex]);
    }
  };

  const handleIncrement = () => {
    const newIndex = Math.min(validSteps.length - 1, selectedIndex + 1);
    setSelectedIndex(newIndex);
    if (validSteps[newIndex] !== module.duration) {
      onDurationChange(validSteps[newIndex]);
    }
  };

  if (!isOpen || !module) return null;

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

  // Capitalize first letter of intensity
  const formatIntensity = (intensity) => {
    if (!intensity) return '';
    return intensity.charAt(0).toUpperCase() + intensity.slice(1);
  };

  // Use portal to render modal at document body level for proper z-index stacking
  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-sm shadow-lg max-h-[85vh] overflow-y-auto ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-4">
            <h3
              className="font-serif text-xl"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {module.title}
            </h3>
            <p className="text-[var(--color-text-tertiary)] text-sm mt-1">
              {moduleType?.label || libraryModule?.type} • {formatIntensity(libraryModule?.intensity)}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] p-1 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Description */}
          {libraryModule?.description && (
            <p className="text-[var(--color-text-secondary)]">
              {libraryModule.description}
            </p>
          )}

          {/* Instructions (if available) */}
          {libraryModule?.content?.instructions && (
            <div>
              <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider mb-2">
                How it works
              </p>
              <p className="text-[var(--color-text-secondary)] text-sm">
                {libraryModule.content.instructions}
              </p>
            </div>
          )}
        </div>

        {/* Duration Section */}
        <div className="px-6 py-4 border-t border-[var(--color-border)]">
          <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider mb-3 text-center">
            Duration
          </p>

          {hasVariableDuration && !isActiveSession ? (
            // Editable stepper
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handleDecrement}
                disabled={isAtMin}
                className={`w-10 h-10 flex items-center justify-center border border-[var(--color-border)] transition-opacity ${
                  isAtMin ? 'opacity-20 cursor-not-allowed' : 'opacity-100 active:opacity-60'
                }`}
                aria-label="Decrease duration"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="4" y1="10" x2="16" y2="10" />
                </svg>
              </button>

              <span className="text-3xl font-light tracking-wide min-w-[70px] text-center">
                {formatDuration(validSteps[selectedIndex])}
              </span>

              <button
                onClick={handleIncrement}
                disabled={isAtMax}
                className={`w-10 h-10 flex items-center justify-center border border-[var(--color-border)] transition-opacity ${
                  isAtMax ? 'opacity-20 cursor-not-allowed' : 'opacity-100 active:opacity-60'
                }`}
                aria-label="Increase duration"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="10" y1="4" x2="10" y2="16" />
                  <line x1="4" y1="10" x2="16" y2="10" />
                </svg>
              </button>
            </div>
          ) : (
            // Static display
            <p className="text-2xl font-light tracking-wide text-center">
              {formatDuration(module.duration)}
            </p>
          )}
        </div>

        {/* Tags */}
        {libraryModule?.tags?.length > 0 && (
          <div className="px-6 py-3 border-t border-[var(--color-border)]">
            <div className="flex flex-wrap gap-2">
              {libraryModule.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-[var(--color-text-tertiary)] bg-[var(--color-bg-secondary)] px-2 py-1"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-border)]">
          <button
            onClick={handleClose}
            className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-sm hover:opacity-80 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
