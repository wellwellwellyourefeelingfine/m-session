/**
 * ModuleDetailModal Component
 * Expanded view of a module showing full details
 * Allows duration adjustment for variable-duration modules
 */

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getModuleById, CATEGORY_ICONS, MODULE_ICONS, FRAMEWORKS } from '../../content/modules';
import { SparkleIcon, CompassIcon, WavesIcon, BoatIcon, NotebookPenIcon, LeafIcon, MusicIcon, HeartHandshakeIcon, SnailIcon, ClockIcon, CircleXIcon } from '../shared/Icons';

const ICON_MAP = {
  sparkle: SparkleIcon,
  compass: CompassIcon,
  waves: WavesIcon,
  boat: BoatIcon,
  'notebook-pen': NotebookPenIcon,
  leaf: LeafIcon,
  music: MusicIcon,
  'heart-handshake': HeartHandshakeIcon,
  snail: SnailIcon,
  clock: ClockIcon,
};

function getModuleIcon(libraryId, category) {
  if (libraryId && MODULE_ICONS[libraryId]) return ICON_MAP[MODULE_ICONS[libraryId]] || SparkleIcon;
  if (category && CATEGORY_ICONS[category]) return ICON_MAP[CATEGORY_ICONS[category]] || SparkleIcon;
  return SparkleIcon;
}

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
  mode = 'info',  // 'info' (timeline card click) or 'add' (library selection)
  onAdd,          // callback for 'add' mode
}) {
  const libraryModule = getModuleById(module?.libraryId);

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

  // Use portal to render modal at document body level for proper z-index stacking
  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
      onClick={handleClose}
      data-tutorial="module-detail-modal"
    >
      <div
        className={`relative bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl w-full max-w-sm shadow-lg max-h-[92vh] overflow-y-auto ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — top-right corner */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-4 text-[var(--color-text-tertiary)] opacity-70 hover:opacity-100 transition-opacity z-10"
          aria-label="Close"
          data-tutorial="module-detail-close"
        >
          <CircleXIcon size={26} />
        </button>

        {/* Header */}
        <div className="px-6 pt-4 pr-14">
          <h3
            className="font-serif text-2xl"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none', lineHeight: 1.1 }}
          >
            {module.title}
          </h3>
          {(() => {
            const Icon = getModuleIcon(module.libraryId, libraryModule?.category);
            return (
              <div className="mt-2 mb-1">
                <Icon size={40} className="text-[var(--accent)]" />
              </div>
            );
          })()}
        </div>

        {/* Body */}
        <div className="px-6 pt-1 pb-0 space-y-3">
          {/* Description */}
          {libraryModule?.description && (
            <div>
              <p
                className="text-lg text-[var(--color-text-tertiary)] mb-1"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                Activity Summary:
              </p>
              <p className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed">
                {libraryModule.description}
              </p>
            </div>
          )}

          {/* Instructions (if available) */}
          {libraryModule?.content?.instructions && (
            <div>
              <p
                className="text-lg text-[var(--color-text-tertiary)] mb-1"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                How It Works:
              </p>
              <p className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed">
                {libraryModule.content.instructions}
              </p>
            </div>
          )}
        </div>

        {/* Duration Section */}
        <div className="px-6 py-2">
          <p
            className="text-lg text-[var(--color-text-tertiary)] mb-2 text-center"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            Duration
          </p>

          {hasVariableDuration && module.status !== 'completed' && module.status !== 'skipped' ? (
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handleDecrement}
                disabled={isAtMin}
                className={`w-10 h-10 flex items-center justify-center rounded-full border border-[var(--color-border)] transition-opacity ${
                  isAtMin ? 'opacity-20 cursor-not-allowed' : 'opacity-100 active:opacity-60'
                }`}
                aria-label="Decrease duration"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="4" y1="10" x2="16" y2="10" />
                </svg>
              </button>

              <span
                className="text-3xl min-w-[70px] text-center"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                {formatDuration(validSteps[selectedIndex])}
              </span>

              <button
                onClick={handleIncrement}
                disabled={isAtMax}
                className={`w-10 h-10 flex items-center justify-center rounded-full border border-[var(--color-border)] transition-opacity ${
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
            <p
              className="text-2xl text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {formatDuration(module.duration)}
            </p>
          )}
        </div>

        {/* Add to Timeline button — placed after duration, before metadata */}
        {mode === 'add' && (
          <div className="px-6 py-3">
            <button
              onClick={() => { onAdd?.(); handleClose(); }}
              className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-sm hover:opacity-80 transition-opacity"
            >
              Add to Timeline
            </button>
          </div>
        )}

        {/* Intensity + Tags */}
        {(libraryModule?.intensity != null || libraryModule?.tags?.length > 0) && (
          <div className="px-6 py-3">
            {/* Intensity */}
            {libraryModule?.intensity != null && (
              <div className="flex items-baseline gap-2 -mb-2">
                <p
                  className="text-lg text-[var(--color-text-tertiary)] leading-none"
                  style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                >
                  Intensity:
                </p>
                <span className="flex items-center space-x-1" style={{ transform: 'translateY(-1px)' }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i <= libraryModule.intensity ? 'bg-[var(--accent)]' : 'bg-[var(--color-border)]'
                      }`}
                    />
                  ))}
                </span>
              </div>
            )}

            {/* Therapeutic Frameworks */}
            {libraryModule?.framework?.length > 0 && (
              <p className="mb-0.5 leading-relaxed">
                <span
                  className="text-lg text-[var(--color-text-tertiary)]"
                  style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                >
                  Framework{libraryModule.framework.length > 1 ? 's' : ''}:
                </span>
                {' '}
                <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">
                  {libraryModule.framework.map((f) => {
                    const fw = FRAMEWORKS[f];
                    if (fw?.abbreviation) return `${fw.abbreviation} (${fw.label})`;
                    return fw?.label || f;
                  }).join(', ')}
                </span>
              </p>
            )}

            {/* Tags */}
            {libraryModule?.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                  {libraryModule.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-[var(--color-text-tertiary)] border border-[var(--color-border)] rounded-full px-3 py-1 whitespace-nowrap"
                      style={{ textTransform: 'none' }}
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Footer — only shown in info mode (add mode button is above intensity) */}
        {mode === 'info' && (
          <div className="px-6 py-4">
            <button
              onClick={handleClose}
              className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-sm hover:opacity-80 transition-opacity"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
