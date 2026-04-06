/**
 * ComeUpCheckIn Component
 * Modal that checks in with the user during the come-up phase
 * Can be minimized to an anchored position above the tab bar
 * Maximizes automatically between modules and when user clicks
 */

import { useState, useEffect, useRef } from 'react';
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
        {/* Background stroke circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
        />
        {/* Half fill using clip path */}
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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showReassurance, setShowReassurance] = useState(false);
  const [isContentFading, setIsContentFading] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const prevMinimizedRef = useRef(null);
  const reassuranceTimerRef = useRef(null);
  const modalCardRef = useRef(null);

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
    if (prevMinimizedRef.current === false && isMinimized === true) {
      // Just transitioned to minimized - animation already happened
    }
    prevMinimizedRef.current = isMinimized;
  }, [isMinimized]);

  const handleMinimize = () => {
    if (reassuranceTimerRef.current) {
      clearTimeout(reassuranceTimerRef.current);
      reassuranceTimerRef.current = null;
    }
    setIsAnimatingOut(true);
    setTimeout(() => {
      minimizeCheckIn();
      setIsAnimatingOut(false);
      setShowReassurance(false);
      setSelectedResponse(null);
      setIsContentFading(false);
      if (modalCardRef.current) modalCardRef.current.style.height = '';
    }, 300);
  };

  const handleSelect = (value) => {
    setSelectedResponse(value);

    // If "fully arrived" and less than 20 minutes, show confirmation
    if (value === 'fully-arrived' && minutesSinceIngestion < 20) {
      setShowConfirmation(true);
      return;
    }

    // Record response and cross-fade to inline content
    recordCheckInResponse(value);
    fadeToReassurance(value !== 'fully-arrived' ? 30000 : null);
  };

  // Cross-fade buttons to reassurance content, with optional auto-close
  const fadeToReassurance = (autoCloseMs = null) => {
    if (modalCardRef.current) {
      modalCardRef.current.style.height = modalCardRef.current.offsetHeight + 'px';
    }
    setIsContentFading(true);
    setTimeout(() => {
      setShowReassurance(true);
      requestAnimationFrame(() => setIsContentFading(false));
    }, 300);

    if (autoCloseMs) {
      if (reassuranceTimerRef.current) clearTimeout(reassuranceTimerRef.current);
      reassuranceTimerRef.current = setTimeout(() => {
        handleMinimize();
        reassuranceTimerRef.current = null;
      }, autoCloseMs);
    }
  };

  const handleConfirmFullyArrived = (confirmed) => {
    setShowConfirmation(false);
    if (!confirmed) { setSelectedResponse(null); return; }
    setSelectedResponse('fully-arrived');
    recordCheckInResponse('fully-arrived');
    fadeToReassurance();
  };

  const handleChangeResponse = () => {
    if (reassuranceTimerRef.current) {
      clearTimeout(reassuranceTimerRef.current);
      reassuranceTimerRef.current = null;
    }
    setIsContentFading(true);
    setTimeout(() => {
      setShowReassurance(false);
      setSelectedResponse(null);
      requestAnimationFrame(() => setIsContentFading(false));
    }, 300);
  };

  const handleMinimizedClick = () => {
    maximizeCheckIn();
  };

  // IMPORTANT: Check local UI states FIRST, before store-driven states
  // This prevents the modal from disappearing when store updates

  // Confirmation dialog for early "fully arrived"
  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-50 animate-fadeIn">
        <div className="bg-[var(--color-bg)] w-full max-w-md rounded-t-2xl p-6 pb-8 animate-slideUp">
          <h3 className="mb-4 text-lg" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>Are you sure?</h3>
          <p className="text-[var(--color-text-secondary)] mb-6">
            It's only been {minutesSinceIngestion} minutes since you took your substance.
            Usually the onset happens between the 20-45 minute mark.
          </p>
          <p className="text-[var(--color-text-secondary)] mb-8">
            If you're certain you're feeling the full effects, we'll move to the next phase.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => handleConfirmFullyArrived(true)}
              className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider"
            >
              Yes, I'm fully arrived
            </button>
            <button
              onClick={() => handleConfirmFullyArrived(false)}
              className="w-full py-3 text-[var(--color-text-tertiary)]"
            >
              Actually, let me continue the come-up
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Minimized state - small bar directly above control bar (flush, no gap)
  // Positioned at bottom: var(--bottom-chrome) = tabbar + control bar height
  if (isMinimized) {
    return (
      <button
        onClick={handleMinimizedClick}
        className="fixed left-0 right-0 w-full bg-[var(--color-bg-secondary)] border-t border-b border-[var(--color-border)] py-3 px-4 flex items-center justify-between z-40 animate-slideUpSmall"
        style={{ bottom: 'var(--bottom-chrome)' }}
      >
        <div className="flex items-center space-x-3">
          <StatusIndicator status={currentResponse} />
          <span className="text-[var(--color-text-secondary)] text-base" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
            How are you feeling?
          </span>
        </div>
        <CirclePlusIcon size={20} className="text-[var(--color-text-tertiary)]" />
      </button>
    );
  }

  // Full modal state
  return (
    <div
      className={`fixed inset-0 bg-black/30 flex items-end justify-center z-50 ${isAnimatingOut ? 'animate-fadeOut' : 'animate-fadeIn'}`}
      onClick={showReassurance ? handleMinimize : handleMinimize}
    >
      <div
        ref={modalCardRef}
        className={`bg-[var(--color-bg)] w-full max-w-md rounded-t-2xl p-6 pb-8 ${isAnimatingOut ? 'animate-slideDownOut' : 'animate-slideUp'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="mb-1 text-2xl" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>How are you feeling?</h3>
            <p className="text-[var(--color-text-tertiary)] text-sm">
              {minutesSinceIngestion} minutes since ingestion
            </p>
          </div>
          <button
            onClick={showReassurance ? handleMinimize : handleMinimize}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors p-2 -m-2"
          >
            <CircleSkipIcon size={22} />
          </button>
        </div>

        <div>
          {!showReassurance ? (
            <div
              style={{
                opacity: isContentFading ? 0 : 1,
                transition: 'opacity 300ms ease-out',
              }}
            >
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
                        <p className="text-[var(--color-text-primary)] text-lg" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>{option.label}</p>
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
            </div>
          ) : (
            <div
              className="flex flex-col items-center"
              style={{
                opacity: isContentFading ? 0 : 1,
                transition: 'opacity 300ms ease-out',
              }}
            >
              <div className="mb-6 relative flex items-center justify-center">
                <div
                  className="absolute rounded-full animate-halo-pulse"
                  style={{ width: 120, height: 120, backgroundColor: 'var(--accent)', filter: 'blur(32px)' }}
                />
                <StatusIndicator status={selectedResponse} size={120} />
              </div>
              {selectedResponse === 'fully-arrived' ? (
                <>
                  <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-2 text-center" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none', fontSize: '18px' }}>
                    Ready for the Peak
                  </p>
                  <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-6">
                    You've indicated you're fully arrived. Would you like to continue to the peak phase?
                  </p>
                  <div className="w-full space-y-3">
                    <button
                      onClick={() => beginPeakTransition()}
                      className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
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
                  <button
                    onClick={handleChangeResponse}
                    className="mt-4 text-[var(--color-text-tertiary)] text-sm hover:text-[var(--color-text-secondary)] transition-colors"
                  >
                    ← Change my response
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-2 text-center" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none', fontSize: '18px' }}>
                    {REASSURANCE_MESSAGES[selectedResponse]?.subheader}
                  </p>
                  <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-6">
                    {REASSURANCE_MESSAGES[selectedResponse]?.description}
                  </p>
                  <button
                    onClick={handleChangeResponse}
                    className="mt-2 text-[var(--color-text-tertiary)] text-sm hover:text-[var(--color-text-secondary)] transition-colors"
                  >
                    ← Change my response
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
