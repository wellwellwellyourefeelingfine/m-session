/**
 * ModuleLayout Component
 *
 * Provides consistent layout structure for all modules.
 * Works with ModuleStatusBar (fixed at top) and ModuleControlBar (fixed at bottom).
 *
 * Layout structure:
 * ┌─────────────────────────────────────┐
 * │ [Header - h-16]                    │
 * ├─────────────────────────────────────┤
 * │ [ModuleStatusBar - h-9]            │
 * ├─────────────────────────────────────┤
 * │                                     │
 * │         [Main Content Area]         │
 * │    Scrollable, centered content     │
 * │                                     │
 * │                                     │
 * ├─────────────────────────────────────┤
 * │ [Control Bar - h-14]               │
 * ├─────────────────────────────────────┤
 * │ [Tab Bar - h-16]                   │
 * └─────────────────────────────────────┘
 *
 * Content area accounts for:
 * - Control bar (h-14 = 56px)
 * - Tab bar (h-16 = 64px)
 * - Safe area padding
 */

import { useEffect, useRef, useState } from 'react';
import LeafDrawV2 from './animations/LeafDrawV2';
import AsciiMoon from './animations/AsciiMoon';

/**
 * @param {object} props
 * @param {object} props.layout - Layout configuration
 * @param {boolean} props.layout.centered - Center content vertically
 * @param {string} props.layout.maxWidth - 'sm' | 'md' | 'lg' | 'full'
 * @param {string} props.layout.padding - 'normal' | 'compact' | 'none'
 * @param {React.ReactNode} props.children - Main content
 */
export default function ModuleLayout({
  layout = {},
  children,
}) {
  const {
    centered = true,
    maxWidth = 'md',
    padding = 'normal',
  } = layout;

  const getPaddingClass = () => {
    switch (padding) {
      case 'compact': return 'px-4';
      case 'none': return '';
      default: return 'px-6';
    }
  };

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-sm';
      case 'lg': return 'max-w-lg';
      case 'full': return 'w-full';
      default: return 'max-w-md';
    }
  };

  return (
    <div
      className={`flex flex-col ${getPaddingClass()} pt-4 pb-20`}
      style={{
        minHeight: centered ? 'calc(100vh - var(--header-height) - var(--bottom-chrome))' : undefined,
      }}
    >
      {/* Main content area */}
      <div
        className={`flex-1 ${centered ? 'flex items-center justify-center' : ''} w-full`}
      >
        <div className={`${getMaxWidthClass()} mx-auto w-full`}>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Module Header Component
 * Standardized header with title and optional subtitle/instructions
 */
export function ModuleHeader({
  title,
  subtitle,
  instructions,
  centered = true,
  className = '',
}) {
  return (
    <div className={`${centered ? 'text-center' : ''} space-y-3 ${className}`}>
      {title && (
        <h2 className="text-[var(--color-text-primary)]">
          {title}
        </h2>
      )}

      {subtitle && (
        <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider">
          {subtitle}
        </p>
      )}

      {instructions && (
        <p className="text-[var(--color-text-secondary)] leading-relaxed text-xs">
          {instructions}
        </p>
      )}
    </div>
  );
}

/**
 * Module Content Container
 * Wrapper for main module content with consistent spacing
 */
export function ModuleContent({
  children,
  centered = true,
  className = '',
}) {
  return (
    <div className={`${centered ? 'text-center' : ''} space-y-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Completion Screen Component
 * Shown when a module finishes successfully
 */
export function CompletionScreen({
  title = 'Well done',
  message = 'Take a moment before moving on',
}) {
  return (
    <div className="text-center space-y-4 animate-fadeIn">
      <h2
        className="text-2xl text-[var(--color-text-primary)]"
        style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
      >
        {title}
      </h2>

      <div className="flex justify-center">
        <AsciiMoon />
      </div>

      <p className="tracking-wider text-[10px] text-[var(--color-text-secondary)]">
        {message}
      </p>
    </div>
  );
}

/**
 * Voice Pill Component
 * Cycles through available meditation voices with < / > arrows. Used on
 * meditation idle screens when the content declares one or more voices.
 * With a single voice the pill still renders, with arrows greyed out — same
 * shape so the layout is consistent across meditations regardless of how
 * many voices they ship.
 * The active voice name fades out/in when cycling.
 */
function VoicePill({ voices, selectedVoiceId, onVoiceChange }) {
  const activeIndex = Math.max(0, voices.findIndex((v) => v.id === selectedVoiceId));
  const activeVoice = voices[activeIndex];
  const [displayVoice, setDisplayVoice] = useState(activeVoice);
  const [isFaded, setIsFaded] = useState(false);
  const prevActiveIdRef = useRef(activeVoice?.id);
  const swapTimerRef = useRef(null);

  const canCycle = voices.length > 1 && typeof onVoiceChange === 'function';

  // When selectedVoiceId changes, fade the current name out, swap the label,
  // then fade the new name in. Tracks the last-processed id via ref so that
  // the setDisplayVoice inside the effect doesn't trigger a re-run that would
  // cancel the second transition.
  useEffect(() => {
    if (activeVoice?.id === prevActiveIdRef.current) return;
    prevActiveIdRef.current = activeVoice?.id;

    if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    setIsFaded(true);
    swapTimerRef.current = setTimeout(() => {
      setDisplayVoice(activeVoice);
      setIsFaded(false);
    }, 200);

    return () => {
      if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    };
  }, [activeVoice]);

  const cycle = (delta) => {
    if (!canCycle) return;
    const next = voices[(activeIndex + delta + voices.length) % voices.length];
    if (next && next.id !== selectedVoiceId) onVoiceChange(next.id);
  };

  const arrowBase = 'flex items-center justify-center w-7 h-7 rounded-full text-[var(--accent)] transition-opacity';
  const arrowActive = 'hover:opacity-70 active:opacity-50';
  const arrowDisabled = 'opacity-30 cursor-not-allowed';
  const opacityClass = isFaded ? 'opacity-0' : 'opacity-100';

  return (
    // !mt-3 overrides IdleScreen's space-y-4 (16px) to pull the voice pill
    // closer to the preceding time pill (~12px gap instead).
    <div className="!mt-3 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={canCycle ? () => cycle(-1) : undefined}
        disabled={!canCycle}
        className={`${arrowBase} ${canCycle ? arrowActive : arrowDisabled}`}
        aria-label="Previous voice"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M9 2 L4 7 L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="rounded-full border-[1.5px] border-[var(--accent)] px-4 py-1 min-w-[12rem] flex items-center justify-center gap-2">
        <span className="text-sm font-bold text-[var(--accent)] lowercase tracking-wide">voice:</span>
        <span
          className={`text-sm text-[var(--color-text-primary)] transition-opacity duration-200 ${opacityClass}`}
          aria-live="polite"
        >
          {displayVoice?.label}
        </span>
      </div>

      <button
        type="button"
        onClick={canCycle ? () => cycle(1) : undefined}
        disabled={!canCycle}
        className={`${arrowBase} ${canCycle ? arrowActive : arrowDisabled}`}
        aria-label="Next voice"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M5 2 L10 7 L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Duration Pill Component
 * Shows the meditation's estimated time in an accent-outline pill that
 * matches the VoicePill's shape. When step handlers are provided, flanks
 * the pill with < / > arrows that clamp at min/max (greyed when inactive).
 * Without step handlers, renders as a display-only pill (fixed-duration
 * meditations like Simple Grounding).
 */
export function DurationPill({ minutes, canStepBack, canStepForward, onStepBack, onStepForward, showArrows = false }) {
  const [displayMinutes, setDisplayMinutes] = useState(minutes);
  const [isFaded, setIsFaded] = useState(false);
  const prevMinutesRef = useRef(minutes);
  const swapTimerRef = useRef(null);

  // Fade-swap the number when it changes, mirroring VoicePill's pattern.
  // Tracks last-processed value via ref so setDisplayMinutes doesn't re-run
  // the effect and cancel the fade-in transition.
  useEffect(() => {
    if (minutes === prevMinutesRef.current) return;
    prevMinutesRef.current = minutes;

    if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    setIsFaded(true);
    swapTimerRef.current = setTimeout(() => {
      setDisplayMinutes(minutes);
      setIsFaded(false);
    }, 200);

    return () => {
      if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    };
  }, [minutes]);

  const arrowBase = 'flex items-center justify-center w-7 h-7 rounded-full text-[var(--accent)] transition-opacity';
  const arrowActive = 'hover:opacity-70 active:opacity-50';
  const arrowDisabled = 'opacity-30 cursor-not-allowed';
  const opacityClass = isFaded ? 'opacity-0' : 'opacity-100';

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      {showArrows ? (
        <button
          type="button"
          onClick={canStepBack ? onStepBack : undefined}
          disabled={!canStepBack}
          className={`${arrowBase} ${canStepBack ? arrowActive : arrowDisabled}`}
          aria-label="Shorter"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 2 L4 7 L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <span className="w-7 h-7" aria-hidden="true" />
      )}

      <div className="rounded-full border-[1.5px] border-[var(--accent)] px-3 py-1 flex items-center justify-start gap-2">
        <span className="text-sm font-bold text-[var(--accent)] lowercase tracking-wide">time:</span>
        <span
          className={`text-sm text-[var(--color-text-primary)] transition-opacity duration-200 w-14 text-left tabular-nums ${opacityClass}`}
          aria-live="polite"
        >
          {displayMinutes}min
        </span>
      </div>

      {showArrows ? (
        <button
          type="button"
          onClick={canStepForward ? onStepForward : undefined}
          disabled={!canStepForward}
          className={`${arrowBase} ${canStepForward ? arrowActive : arrowDisabled}`}
          aria-label="Longer"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 2 L10 7 L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <span className="w-7 h-7" aria-hidden="true" />
      )}
    </div>
  );
}

/**
 * Idle Screen Component
 * Shown before a module starts (with title, description, morphing shapes animation)
 *
 * Optional voice selector: when `voices` (array) has more than one entry and
 * `onVoiceChange` is provided, a pill with < / > arrows renders below the
 * duration line, letting the user cycle through voice variants.
 *
 * Optional duration pill: when `durationMinutes` is a number, an accent-outline
 * pill shows "time: X min". If `onDurationStepBack` / `onDurationStepForward`
 * are provided, the pill is flanked by arrows that step through the meditation's
 * duration options (clamped at the passed `canStepBack` / `canStepForward` bounds).
 */
export function IdleScreen({
  title,
  // Optional accent-coloured subtitle rendered between the title and the
  // animation. Used by MasterModule activities to label parts (e.g.
  // "PART 1: MEETING A PROTECTOR") so the main title can stay unified
  // ("Dialogue with a Protector") across linked parts of the same activity.
  subtitle,
  description,
  animation,
  voices,
  selectedVoiceId,
  onVoiceChange,
  durationMinutes,
  onDurationStepBack,
  onDurationStepForward,
  canStepDurationBack,
  canStepDurationForward,
  // Legacy plain-text duration line. Kept for modules that haven't migrated
  // to the `durationMinutes` pill (MasterModule, MeditationSection).
  duration,
}) {
  // Render the voice pill whenever the meditation declares any voices, even
  // a single one — keeps the layout consistent across meditations. With a
  // single voice the cycle arrows render greyed-out (no-op).
  const showVoicePill = Array.isArray(voices) && voices.length >= 1;
  const showDurationPill = typeof durationMinutes === 'number';
  const showDurationArrows = typeof onDurationStepBack === 'function' && typeof onDurationStepForward === 'function';
  const showLegacyDuration = !showDurationPill && duration;

  return (
    <div className="space-y-4 animate-fadeIn px-6">
      {title && (
        <h2
          className="text-2xl text-[var(--color-text-primary)] text-center"
          style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
        >
          {title}
        </h2>
      )}

      {subtitle && (
        <p
          className="text-xs uppercase tracking-wider text-[var(--accent)] text-center"
          style={{ fontFamily: 'Azeret Mono, monospace' }}
        >
          {subtitle}
        </p>
      )}

      <div className="flex justify-center">
        {animation || <AsciiMoon />}
      </div>

      {description && (
        <p className="tracking-wider text-xs text-[var(--color-text-secondary)] leading-relaxed text-left">
          {description}
        </p>
      )}

      {showDurationPill && (
        <DurationPill
          minutes={durationMinutes}
          showArrows={showDurationArrows}
          canStepBack={!!canStepDurationBack}
          canStepForward={!!canStepDurationForward}
          onStepBack={onDurationStepBack}
          onStepForward={onDurationStepForward}
        />
      )}

      {showLegacyDuration && (
        <p className="uppercase tracking-wider text-[10px] text-[var(--color-text-tertiary)] text-center">
          {duration} minutes
        </p>
      )}

      {showVoicePill && (
        <VoicePill voices={voices} selectedVoiceId={selectedVoiceId} onVoiceChange={onVoiceChange} />
      )}
    </div>
  );
}

/**
 * Phase Indicator
 * Shows current phase text (for breathing, meditation, etc.)
 */
export function PhaseIndicator({ phase, className = '' }) {
  return (
    <p className={`text-[var(--color-text-primary)] text-sm uppercase tracking-wider ${className}`}>
      {phase}
    </p>
  );
}
