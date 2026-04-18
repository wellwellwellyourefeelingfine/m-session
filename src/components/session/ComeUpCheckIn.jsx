/**
 * ComeUpCheckIn Component
 * Modal that checks in with the user during the come-up phase.
 * Can be minimized to an anchored bar above the tab bar.
 *
 * Views (single unified modal, smooth height + content cross-fade):
 * - 'selection'    — TALL — 3 options (Nothing yet / Starting / Fully arrived)
 * - 'confirmation' — SHORT — shown when "Fully arrived" is picked before 20 min
 * - 'reassurance'  — TALL — halo + message; ready-for-peak CTAs when fully arrived
 */

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { CircleSkipIcon, CirclePlusIcon } from '../shared/Icons';

const CHECK_IN_OPTIONS = [
  {
    value: 'waiting',
    label: 'Nothing yet',
    description: 'Still waiting to feel effects',
  },
  {
    value: 'starting',
    label: 'Starting to feel something',
    description: 'Subtle shifts beginning',
  },
  {
    value: 'fully-arrived',
    label: 'Fully arrived',
    description: 'Clearly feeling the effects',
  },
];

const REASSURANCE_MESSAGES = {
  waiting: {
    subheader: 'No Rush',
    description: 'Most people feel the first effects between 20 and 45 minutes. There is nothing to do right now except relax and let your body settle. The experience will come to you.',
  },
  starting: {
    subheader: 'It\'s Opening',
    description: 'Your body is beginning to respond. Stay with the feeling and breathe gently. Most people feel fully arrived somewhere between 45 minutes and an hour, though everyone\'s timeline is different. The effects will continue to build on their own.',
  },
};


/**
 * Status indicator circle for minimized bar
 * - No response: empty circle with accent stroke
 * - 'waiting': empty circle with accent stroke (same as no response)
 * - 'starting': half-filled circle
 * - 'fully-arrived': fully filled circle
 */
function StatusIndicator({ status, size = 14 }) {
  const strokeWidth = size >= 100 ? 5 : size > 14 ? 2 : 1.5;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Empty circle (no response or waiting)
  if (!status || status === 'waiting') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  // Half-filled circle (starting)
  if (status === 'starting') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
        />
        <defs>
          <clipPath id="halfClip">
            <rect x="0" y={center} width={size} height={center} />
          </clipPath>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="var(--accent)"
          clipPath="url(#halfClip)"
        />
      </svg>
    );
  }

  // Fully filled circle (fully-arrived)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="var(--accent)"
        stroke="var(--accent)"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

export default function ComeUpCheckIn() {
  // View state drives content; panel height is measured from content for a natural fit
  const [view, setView] = useState('selection'); // 'selection' | 'confirmation' | 'reassurance'
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [panelHeight, setPanelHeight] = useState(null); // null = content-driven until first measure
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const prevMinimizedRef = useRef(null);
  const reassuranceTimerRef = useRef(null);
  const contentInnerRef = useRef(null);

  const comeUpCheckIn = useSessionStore((state) => state.comeUpCheckIn);
  const recordCheckInResponse = useSessionStore((state) => state.recordCheckInResponse);
  const minimizeCheckIn = useSessionStore((state) => state.minimizeCheckIn);
  const maximizeCheckIn = useSessionStore((state) => state.maximizeCheckIn);
  const getElapsedMinutes = useSessionStore((state) => state.getElapsedMinutes);
  const beginPeakTransition = useSessionStore((state) => state.beginPeakTransition);

  const minutesSinceIngestion = getElapsedMinutes();
  const isMinimized = comeUpCheckIn.isMinimized;
  const currentResponse = comeUpCheckIn.currentResponse;

  // Clean up reassurance timer on unmount
  useEffect(() => {
    return () => {
      if (reassuranceTimerRef.current) {
        clearTimeout(reassuranceTimerRef.current);
      }
    };
  }, []);

  // Track when transitioning to minimized state for animation
  useEffect(() => {
    prevMinimizedRef.current = isMinimized;
  }, [isMinimized]);

  const clearAutoClose = () => {
    if (reassuranceTimerRef.current) {
      clearTimeout(reassuranceTimerRef.current);
      reassuranceTimerRef.current = null;
    }
  };

  const scheduleAutoClose = (ms) => {
    clearAutoClose();
    reassuranceTimerRef.current = setTimeout(() => {
      handleMinimize();
      reassuranceTimerRef.current = null;
    }, ms);
  };

  // Measure the natural content height after the DOM commits, driving a smooth CSS height transition.
  useLayoutEffect(() => {
    if (!contentInnerRef.current) return;
    // Content-area padding (px-6 py-6) — top + bottom = 48px
    const CONTENT_AREA_VERTICAL_PADDING = 48;
    const next = CONTENT_AREA_VERTICAL_PADDING + contentInnerRef.current.offsetHeight;
    setPanelHeight(next);
  }, [view, isMinimized]);

  // Cross-fade content out → swap view → measure new height → fade in.
  // `postSwap` runs at the swap boundary so caller-side state (e.g. clearing
  // selectedResponse) doesn't blank the outgoing view mid-fade.
  const transitionToView = (nextView, postSwap) => {
    setIsVisible(false);
    setTimeout(() => {
      setView(nextView);
      if (postSwap) postSwap();
      // useLayoutEffect measures the new view and updates panelHeight → height transitions
      // rAF delays fade-in one frame so the height transition and opacity fade-in run together
      requestAnimationFrame(() => setIsVisible(true));
    }, 300);
  };

  const handleMinimize = () => {
    clearAutoClose();
    setIsAnimatingOut(true);
    setTimeout(() => {
      minimizeCheckIn();
      // Reset local state so next expansion is fresh
      setIsAnimatingOut(false);
      setView('selection');
      setSelectedResponse(null);
      setPanelHeight(null);
      setIsVisible(true);
    }, 350);
  };

  const handleSelect = (value) => {
    setSelectedResponse(value);

    // If "fully arrived" and less than 20 minutes, ask for confirmation
    if (value === 'fully-arrived' && minutesSinceIngestion < 20) {
      transitionToView('confirmation');
      return;
    }

    // Record response and cross-fade to reassurance
    recordCheckInResponse(value);
    transitionToView('reassurance');
    if (value !== 'fully-arrived') {
      scheduleAutoClose(30000);
    }
  };

  const handleConfirmFullyArrived = (confirmed) => {
    if (!confirmed) {
      // Clear selection at the swap boundary so the confirmation view stays intact during fade-out
      transitionToView('selection', () => setSelectedResponse(null));
      return;
    }
    recordCheckInResponse('fully-arrived');
    transitionToView('reassurance');
  };

  const handleChangeResponse = () => {
    clearAutoClose();
    // Clear selection at the swap boundary so the reassurance view stays intact during fade-out
    transitionToView('selection', () => setSelectedResponse(null));
  };

  const handleMinimizedClick = () => {
    maximizeCheckIn();
  };

  // ============================================
  // VIEW RENDERERS
  // ============================================

  const renderSelection = () => (
    <>
      <div className="mb-6">
        <h3
          className="mb-1 text-2xl text-[var(--color-text-primary)]"
          style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
        >
          How are you feeling?
        </h3>
        <p className="text-[var(--color-text-tertiary)] text-sm mb-0">
          {minutesSinceIngestion} minutes since ingestion
        </p>
      </div>

      <div className="space-y-3">
        {CHECK_IN_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`w-full py-4 px-4 border text-left transition-colors ${
              currentResponse === option.value
                ? 'border-[var(--accent)] bg-[var(--accent-bg)]'
                : 'border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p
                  className="text-[var(--color-text-primary)] text-lg"
                  style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                >
                  {option.label}
                </p>
                <p className="text-[var(--color-text-tertiary)] text-sm">{option.description}</p>
              </div>
              <StatusIndicator status={option.value} size={24} />
            </div>
          </button>
        ))}
      </div>

      <p className="text-[var(--color-text-tertiary)] text-sm mt-6 text-center">
        You can change your response anytime during the come-up phase.
      </p>
    </>
  );

  const renderConfirmation = () => (
    <>
      <p
        className="mb-3 text-xl text-[var(--color-text-primary)]"
        style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
      >
        Are you sure?
      </p>
      <p className="text-[var(--color-text-secondary)] mb-4 leading-relaxed">
        It's only been {minutesSinceIngestion} minute{minutesSinceIngestion !== 1 ? 's' : ''} since
        you took your substance. Usually the onset happens between the 20-45 minute mark.
      </p>
      <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">
        If you're certain you're feeling the full effects, we'll move to the next phase.
      </p>
      <div className="space-y-3">
        <button
          onClick={() => handleConfirmFullyArrived(true)}
          className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
        >
          Yes, I'm fully arrived
        </button>
        <button
          onClick={() => handleConfirmFullyArrived(false)}
          className="w-full py-3 text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs hover:text-[var(--color-text-secondary)] transition-colors"
        >
          Actually, let me continue the come-up
        </button>
      </div>
    </>
  );

  const renderReassurance = () => {
    const isFullyArrived = selectedResponse === 'fully-arrived';
    const subheader = isFullyArrived
      ? 'Ready for the Peak'
      : REASSURANCE_MESSAGES[selectedResponse]?.subheader;
    const description = isFullyArrived
      ? "You've indicated you're fully arrived. Would you like to continue to the peak phase?"
      : REASSURANCE_MESSAGES[selectedResponse]?.description;

    return (
      <div className="flex flex-col items-center">
        {/* Subheader above the indicator */}
        <p
          className="text-[var(--color-text-primary)] leading-relaxed mb-4 text-center"
          style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none', fontSize: '20px' }}
        >
          {subheader}
        </p>

        {/* Halo + status indicator */}
        <div className="mb-6 relative flex items-center justify-center">
          <div
            className="absolute rounded-full animate-halo-pulse"
            style={{ width: 120, height: 120, backgroundColor: 'var(--accent)', filter: 'blur(32px)' }}
          />
          <StatusIndicator status={selectedResponse} size={120} />
        </div>

        {/* Primary description text */}
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-6 text-center">
          {description}
        </p>

        {/* Peak-phase CTAs (fully-arrived only) */}
        {isFullyArrived && (
          <div className="w-full space-y-3 mb-4">
            <button
              onClick={() => beginPeakTransition()}
              className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
            >
              Continue to the Peak Phase
            </button>
            <button
              onClick={handleMinimize}
              className="w-full py-4 border border-[var(--color-text-primary)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
            >
              Remain Here – Snooze
            </button>
          </div>
        )}

        <button
          onClick={handleChangeResponse}
          className="text-[var(--color-text-tertiary)] text-sm hover:text-[var(--color-text-secondary)] transition-colors"
        >
          ← Change my response
        </button>
      </div>
    );
  };

  const renderView = () => {
    switch (view) {
      case 'selection': return renderSelection();
      case 'confirmation': return renderConfirmation();
      case 'reassurance': return renderReassurance();
      default: return null;
    }
  };

  // ============================================
  // RENDER
  // ============================================

  // Minimized bar directly above control bar
  if (isMinimized) {
    return (
      <button
        onClick={handleMinimizedClick}
        className="fixed left-0 right-0 w-full bg-[var(--color-bg-secondary)] border-t border-b border-[var(--color-border)] py-3 px-4 flex items-center justify-between z-40 animate-slideUpSmall"
        style={{ bottom: 'var(--bottom-chrome)' }}
      >
        <div className="flex items-center space-x-3">
          <StatusIndicator status={currentResponse} />
          <span
            className="text-[var(--color-text-secondary)] text-base"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            How are you feeling?
          </span>
        </div>
        <CirclePlusIcon size={20} className="text-[var(--color-text-tertiary)]" />
      </button>
    );
  }

  // Full modal — single panel that morphs between short/tall heights with cross-fading content
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/25 ${isAnimatingOut ? 'animate-fadeOut' : 'animate-fadeIn'}`}
        onClick={handleMinimize}
      />

      {/* Panel */}
      <div
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[var(--color-bg)] rounded-t-2xl flex flex-col overflow-hidden ${isAnimatingOut ? 'animate-slideDownOut' : 'animate-slideUp'}`}
        style={{
          height: panelHeight != null ? `${panelHeight}px` : 'auto',
          maxHeight: '90vh',
          transition: 'height 300ms ease-out',
        }}
      >
        {/* Close button — absolute so it overlays the header */}
        <button
          onClick={handleMinimize}
          className="absolute top-4 right-4 z-10 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors p-2 -m-2"
          aria-label="Minimize"
        >
          <CircleSkipIcon size={22} />
        </button>

        {/* Content area — cross-fades on view change; inner wrapper is measured for natural fit */}
        <div
          className="flex-1 overflow-y-auto px-6 py-6 transition-opacity duration-300"
          style={{ opacity: isVisible ? 1 : 0 }}
        >
          <div ref={contentInnerRef}>
            {renderView()}
          </div>
        </div>
      </div>
    </div>
  );
}
