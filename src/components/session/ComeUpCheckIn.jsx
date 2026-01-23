/**
 * ComeUpCheckIn Component
 * Modal that checks in with the user during the come-up phase
 * Can be minimized to an anchored position above the tab bar
 * Maximizes automatically between modules and when user clicks
 */

import { useState, useEffect, useRef } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';

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
  waiting: 'That\'s completely normal. Most people feel the first effects between 20-45 minutes after taking MDMA. Continue to relax and let the experience unfold.',
  starting: 'Good. The experience is beginning to open. Stay relaxed and continue to breathe gently. The effects will continue to build over the next little while.',
};

/**
 * Status indicator circle for minimized bar
 * - No response: empty circle with accent stroke
 * - 'waiting': empty circle with accent stroke (same as no response)
 * - 'starting': half-filled circle
 * - 'fully-arrived': fully filled circle
 */
function StatusIndicator({ status }) {
  const size = 14;
  const strokeWidth = 1.5;
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
          r={radius - strokeWidth / 2}
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
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const prevMinimizedRef = useRef(null);
  const reassuranceTimerRef = useRef(null);

  const comeUpCheckIn = useSessionStore((state) => state.comeUpCheckIn);
  const recordCheckInResponse = useSessionStore((state) => state.recordCheckInResponse);
  const minimizeCheckIn = useSessionStore((state) => state.minimizeCheckIn);
  const maximizeCheckIn = useSessionStore((state) => state.maximizeCheckIn);
  const getMinutesSinceIngestion = useSessionStore((state) => state.getMinutesSinceIngestion);

  const minutesSinceIngestion = getMinutesSinceIngestion();
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
    setIsAnimatingOut(true);
    setTimeout(() => {
      minimizeCheckIn();
      setIsAnimatingOut(false);
    }, 300);
  };

  const handleSelect = (value) => {
    setSelectedResponse(value);

    // If "fully arrived" and less than 20 minutes, show confirmation
    if (value === 'fully-arrived' && minutesSinceIngestion < 20) {
      setShowConfirmation(true);
      return;
    }

    // If waiting or starting, record response immediately then show reassurance
    if (value === 'waiting' || value === 'starting') {
      recordCheckInResponse(value); // Record immediately so module can start
      setShowReassurance(true);
      // Clear any existing timer
      if (reassuranceTimerRef.current) {
        clearTimeout(reassuranceTimerRef.current);
      }
      // Auto-close after 8 seconds if user doesn't dismiss manually
      reassuranceTimerRef.current = setTimeout(() => {
        setShowReassurance(false);
        setSelectedResponse(null);
        minimizeCheckIn();
        reassuranceTimerRef.current = null;
      }, 8000);
      return;
    }

    // Fully arrived after 20+ minutes - proceed directly
    recordCheckInResponse(value);
    setSelectedResponse(null);
  };

  const handleConfirmFullyArrived = (confirmed) => {
    setShowConfirmation(false);
    if (confirmed) {
      recordCheckInResponse('fully-arrived');
    }
    setSelectedResponse(null);
  };

  const handleMinimizedClick = () => {
    maximizeCheckIn();
  };

  // IMPORTANT: Check local UI states FIRST, before store-driven states
  // This prevents the modal from disappearing when store updates

  // Confirmation dialog for early "fully arrived"
  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fadeIn">
        <div className="bg-[var(--color-bg)] w-full max-w-md rounded-t-2xl p-6 pb-8 animate-slideUp">
          <h3 className="mb-4">Are you sure?</h3>
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

  // Reassurance message
  if (showReassurance && selectedResponse) {
    const handleDismissReassurance = () => {
      if (reassuranceTimerRef.current) {
        clearTimeout(reassuranceTimerRef.current);
        reassuranceTimerRef.current = null;
      }
      setShowReassurance(false);
      setSelectedResponse(null);
      minimizeCheckIn();
    };

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fadeIn"
        onClick={handleDismissReassurance}
      >
        <div
          className="bg-[var(--color-bg)] w-full max-w-md rounded-t-2xl p-6 pb-8 animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-end mb-4">
            <button
              onClick={handleDismissReassurance}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors p-2 -m-2"
            >
              <span className="text-xl">−</span>
            </button>
          </div>
          <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
            {REASSURANCE_MESSAGES[selectedResponse]}
          </p>
          <p className="text-[var(--color-text-tertiary)] text-sm">
            You can change your response anytime by tapping the check-in bar.
          </p>
        </div>
      </div>
    );
  }

  // Minimized state - small bar directly above control bar (flush, no gap)
  // Control bar is at bottom-16 (64px) with h-14 (56px), so check-in bar is at bottom-[120px]
  // NOTE: This check comes AFTER local UI state checks (confirmation, reassurance)
  if (isMinimized) {
    return (
      <button
        onClick={handleMinimizedClick}
        className="fixed bottom-[120px] left-0 right-0 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)] py-3 px-4 flex items-center justify-between z-40 animate-slideUpSmall"
      >
        <div className="flex items-center space-x-3">
          <StatusIndicator status={currentResponse} />
          <span className="text-[var(--color-text-secondary)]">
            How are you feeling?
          </span>
        </div>
      </button>
    );
  }

  // Full modal state
  return (
    <div className={`fixed inset-0 bg-black/50 flex items-end justify-center z-50 ${isAnimatingOut ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
      <div className={`bg-[var(--color-bg)] w-full max-w-md rounded-t-2xl p-6 pb-8 ${isAnimatingOut ? 'animate-slideDownOut' : 'animate-slideUp'}`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="mb-1">How are you feeling?</h3>
            <p className="text-[var(--color-text-tertiary)] text-sm">
              {minutesSinceIngestion} minutes since ingestion
            </p>
          </div>
          <button
            onClick={handleMinimize}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors p-2 -m-2"
          >
            <span className="text-xl">−</span>
          </button>
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
              <p className="text-[var(--color-text-primary)]">{option.label}</p>
              <p className="text-[var(--color-text-tertiary)] text-sm">{option.description}</p>
            </button>
          ))}
        </div>

        <p className="text-[var(--color-text-tertiary)] text-sm mt-6 text-center">
          You can change your response anytime during the come-up phase.
        </p>
      </div>
    </div>
  );
}
