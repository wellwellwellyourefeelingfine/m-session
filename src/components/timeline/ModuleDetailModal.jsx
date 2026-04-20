/**
 * ModuleDetailModal Component
 * Expanded view of a module showing full details
 * Allows duration adjustment for variable-duration modules
 */

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getModuleById, CATEGORY_ICONS, MODULE_ICONS, FRAMEWORKS } from '../../content/modules';
import { SparkleIcon, CompassIcon, WavesIcon, BoatIcon, NotebookPenIcon, LeafIcon, MusicIcon, HeartHandshakeIcon, SnailIcon, ClockIcon, CircleXIcon, CirclePlusIcon, CircleSkipIcon, StarIcon, FireIcon } from '../shared/Icons';
import { useAppStore } from '../../stores/useAppStore';

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
  fire: FireIcon,
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
  mode = 'info',  // 'info' (timeline card click), 'add' (library selection), or 'booster'
  onAdd,          // callback for 'add' mode
  isBoosterReopenAvailable = false, // booster mode only — show "Go to Booster" button
  onGoToBooster,  // booster mode only — handler for "Go to Booster" button
}) {
  const libraryModule = getModuleById(module?.libraryId);
  const isBoosterMode = mode === 'booster' || module?.isBoosterModule;

  // Check if this module supports variable duration
  // Only show stepper when explicitly enabled — modules without hasVariableDuration are fixed
  const hasVariableDuration = libraryModule?.hasVariableDuration === true;
  const minDuration = libraryModule?.minDuration || 10;
  const maxDuration = libraryModule?.maxDuration || 30;
  const durationSteps = libraryModule?.durationSteps || generateDurationSteps(minDuration, maxDuration);

  // Filter steps to only include valid ones
  const validSteps = useMemo(
    () => durationSteps.filter((step) => step >= minDuration && step <= maxDuration),
    [durationSteps, minDuration, maxDuration]
  );

  // Track selected index into validSteps
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  // Favorites
  const favoriteModules = useAppStore((s) => s.favoriteModules || []);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFavorited = module?.libraryId ? favoriteModules.includes(module.libraryId) : false;
  const [starAnimating, setStarAnimating] = useState(null); // 'adding' | 'removing' | null

  const handleStarClick = () => {
    if (!module?.libraryId) return;
    setStarAnimating(isFavorited ? 'removing' : 'adding');
    toggleFavorite(module.libraryId);
  };

  // "More info" collapsible — default collapsed
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(true);
  const [infoContentVisible, setInfoContentVisible] = useState(false);
  const [infoHeightCollapsed, setInfoHeightCollapsed] = useState(true);

  const handleToggleInfo = () => {
    if (!isInfoCollapsed) {
      // Collapse: fade out content, then shrink height
      setInfoContentVisible(false);
      setTimeout(() => {
        setInfoHeightCollapsed(true);
        setIsInfoCollapsed(true);
      }, 120);
    } else {
      // Expand: grow height, fade in once space is opening
      setInfoHeightCollapsed(false);
      setTimeout(() => {
        setInfoContentVisible(true);
        setIsInfoCollapsed(false);
      }, 150);
    }
  };

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
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/25 ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
      onClick={handleClose}
      data-tutorial="module-detail-modal"
    >
      <div
        className={`relative bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl w-full max-w-sm shadow-lg max-h-[78vh] overflow-y-auto ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
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
        {isBoosterMode ? (
          <div className="px-6 pt-4 pr-14">
            <h3
              className="font-serif text-2xl"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none', lineHeight: 1.1 }}
            >
              Booster Check-In
            </h3>
            <div className="mt-2 mb-1">
              <FireIcon size={40} className="text-[var(--accent)]" />
            </div>
          </div>
        ) : (
          <div className="px-6 pt-4 pr-14">
            <div className="flex items-center gap-3">
              <h3
                className="font-serif text-2xl"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none', lineHeight: 1.1 }}
              >
                {module.title}
              </h3>
              {module.libraryId && (
                <button
                  onClick={handleStarClick}
                  className="flex-shrink-0"
                  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <span
                    className={starAnimating === 'adding' ? 'animate-star-add' : starAnimating === 'removing' ? 'animate-star-remove' : ''}
                    onAnimationEnd={() => setStarAnimating(null)}
                    style={{ display: 'inline-flex', transform: 'translateY(-4px)' }}
                  >
                    <StarIcon
                      size={26}
                      filled={isFavorited}
                      className={isFavorited ? 'text-[var(--accent)]' : 'text-[var(--color-text-tertiary)] opacity-50'}
                    />
                  </span>
                </button>
              )}
            </div>
            {(() => {
              const Icon = getModuleIcon(module.libraryId, libraryModule?.category);
              return (
                <div className="mt-2 mb-1">
                  <Icon size={40} className="text-[var(--accent)]" />
                </div>
              );
            })()}
          </div>
        )}

        {/* Body */}
        {isBoosterMode ? (
          <div className="px-6 pt-1 pb-0 space-y-3">
            {/* Activity Summary */}
            <div>
              <p
                className="text-lg text-[var(--color-text-tertiary)] mb-1"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                Activity Summary:
              </p>
              <p className="text-[var(--color-text-primary)] text-sm tracking-wider leading-relaxed">
                A guided check-in to help you decide whether a supplemental dose is right for you at this point in your session.
              </p>
            </div>

            {/* More info — collapsible educational content */}
            <div>
              <button
                onClick={handleToggleInfo}
                className="flex items-center gap-1.5 mb-1 cursor-pointer"
                aria-expanded={!isInfoCollapsed}
              >
                <span
                  className="text-lg text-[var(--color-text-tertiary)]"
                  style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                >
                  More Info:
                </span>
                <span className="text-[var(--color-text-tertiary)] flex items-center">
                  {isInfoCollapsed
                    ? <CirclePlusIcon size={16} className="text-current" />
                    : <CircleSkipIcon size={16} className="text-current" />
                  }
                </span>
              </button>

              <div
                className="overflow-hidden"
                style={{
                  maxHeight: infoHeightCollapsed ? 0 : '1200px',
                  transition: infoHeightCollapsed
                    ? 'max-height 250ms ease-in-out'
                    : 'max-height 350ms ease-in-out',
                }}
              >
                <div
                  className="space-y-3"
                  style={{
                    opacity: infoContentVisible ? 1 : 0,
                    transition: 'opacity 200ms ease-in-out',
                  }}
                >
                  <div>
                    <p className="text-[var(--color-text-tertiary)] text-xs tracking-wider mb-1">How it works</p>
                    <p className="text-[var(--color-text-primary)] text-sm tracking-wider leading-relaxed">
                      The booster check-in is automatically placed in the peak phase and will prompt you around the 90-minute mark after ingestion, or 30 minutes after you report feeling fully arrived — whichever comes first.
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-tertiary)] text-xs tracking-wider mb-1">Timing window</p>
                    <p className="text-[var(--color-text-primary)] text-sm tracking-wider leading-relaxed">
                      Opens as early as 60 minutes and closes at 150 minutes after ingestion. After 180 minutes the booster will not appear.
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-tertiary)] text-xs tracking-wider mb-1">Dosage</p>
                    <p className="text-[var(--color-text-primary)] text-sm tracking-wider leading-relaxed">
                      The recommended booster is approximately half your initial dose, in the range of 30–75mg. Most harm reduction guidance suggests keeping total session dosage under 200mg.
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-tertiary)] text-xs tracking-wider mb-1">Good to know</p>
                    <ul className="text-[var(--color-text-primary)] text-sm tracking-wider leading-relaxed space-y-1 list-disc pl-4">
                      <li>A booster extends the peak phase by approximately 1–2 hours.</li>
                      <li>It is entirely optional — many meaningful sessions happen with a single dose.</li>
                      <li>Not recommended for first-time experiences.</li>
                      <li>Weigh out your booster dose at the same time as your initial dose.</li>
                      <li>You can always skip the booster or snooze the check-in to decide later.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
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
                <p className="text-[var(--color-text-primary)] text-sm tracking-wider leading-relaxed">
                  {libraryModule.description}
                </p>
              </div>
            )}

            {/* More info — collapsible instructions */}
            {libraryModule?.content?.instructions && (
              <div>
                <button
                  onClick={handleToggleInfo}
                  className="flex items-center gap-1.5 mb-1 cursor-pointer"
                  aria-expanded={!isInfoCollapsed}
                >
                  <span
                    className="text-lg text-[var(--color-text-tertiary)]"
                    style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                  >
                    More Info:
                  </span>
                  <span className="text-[var(--color-text-tertiary)] flex items-center">
                    {isInfoCollapsed
                      ? <CirclePlusIcon size={16} className="text-current" />
                      : <CircleSkipIcon size={16} className="text-current" />
                    }
                  </span>
                </button>

                <div
                  className="overflow-hidden"
                  style={{
                    maxHeight: infoHeightCollapsed ? 0 : '500px',
                    transition: infoHeightCollapsed
                      ? 'max-height 250ms ease-in-out'
                      : 'max-height 350ms ease-in-out',
                  }}
                >
                  <div
                    style={{
                      opacity: infoContentVisible ? 1 : 0,
                      transition: 'opacity 200ms ease-in-out',
                    }}
                  >
                    <p className="text-[var(--color-text-primary)] text-sm tracking-wider leading-relaxed">
                      {libraryModule.content.instructions}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Duration Section — booster mode reuses the same centered Duration block, with a Window sub-section beneath */}
        {isBoosterMode ? (
          <>
            <div className="px-6 py-2">
              <p
                className="text-lg text-[var(--color-text-tertiary)] mb-2 text-center"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                Duration
              </p>
              <p
                className="text-2xl text-center"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                5 - 10 min
              </p>
            </div>
            <div className="px-6 pb-2">
              <p
                className="text-lg text-[var(--color-text-tertiary)] mb-1"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                Window:
              </p>
              <p className="text-[var(--color-text-primary)] text-sm tracking-wider leading-relaxed">
                The booster check-in pops up between 60 and 150 minutes after ingestion — the window in which a supplemental dose can still meaningfully extend your peak.
              </p>
            </div>
          </>
        ) : (
        <div className="px-6 pt-2 pb-0">
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
        )}

        {/* Add to Timeline button — placed after duration, before metadata */}
        {mode === 'add' && (
          <div className="px-6 py-3">
            <button
              onClick={() => { onAdd?.(); handleClose(); }}
              className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-sm hover:opacity-80 transition-opacity"
              style={{ fontFamily: 'Azeret Mono, monospace' }}
            >
              Add to Timeline
            </button>
          </div>
        )}

        {/* Intensity + Tags — never shown in booster mode */}
        {!isBoosterMode && (libraryModule?.intensity != null || libraryModule?.tags?.length > 0) && (
          <div className="px-6 pt-1.5 pb-2">
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

        {/* Footer — booster mode has its own (Go to Booster + Close); info mode has Close only */}
        {isBoosterMode ? (
          <div className="px-6 py-4 space-y-2">
            {isBoosterReopenAvailable && (
              <button
                onClick={() => { onGoToBooster?.(); handleClose(); }}
                className="w-full py-3 bg-[var(--accent)] text-white uppercase tracking-wider text-sm hover:opacity-80 transition-opacity"
                style={{ fontFamily: 'Azeret Mono, monospace' }}
              >
                Go to Booster
              </button>
            )}
            <button
              onClick={handleClose}
              className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-sm hover:opacity-80 transition-opacity"
              style={{ fontFamily: 'Azeret Mono, monospace' }}
            >
              Close
            </button>
          </div>
        ) : mode === 'info' && (
          <div className="px-6 pt-2 pb-4">
            <button
              onClick={handleClose}
              className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-sm hover:opacity-80 transition-opacity"
              style={{ fontFamily: 'Azeret Mono, monospace' }}
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
