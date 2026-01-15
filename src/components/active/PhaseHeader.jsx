/**
 * PhaseHeader Component
 * Shows the current phase name and elapsed time at the top of the active view
 */

import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';

const PHASE_NAMES = {
  'come-up': 'Come-Up',
  peak: 'Peak',
  integration: 'Integration',
};

export default function PhaseHeader({ phase }) {
  const [elapsedDisplay, setElapsedDisplay] = useState('0:00');

  const getElapsedMinutes = useSessionStore((state) => state.getElapsedMinutes);
  const getMinutesSinceIngestion = useSessionStore((state) => state.getMinutesSinceIngestion);
  const timeline = useSessionStore((state) => state.timeline);

  // Update elapsed time display every second
  useEffect(() => {
    const updateElapsed = () => {
      const minutes = getElapsedMinutes();
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours > 0) {
        setElapsedDisplay(`${hours}:${mins.toString().padStart(2, '0')}`);
      } else {
        setElapsedDisplay(`${mins}m`);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [getElapsedMinutes]);

  const phaseName = PHASE_NAMES[phase] || phase;

  return (
    <div className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-3">
          <span className="uppercase tracking-widest text-[var(--color-text-tertiary)] text-sm">
            {phaseName}
          </span>
          <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
          <span className="text-[var(--color-text-tertiary)] text-sm">
            {elapsedDisplay}
          </span>
        </div>

        {/* Phase indicator dots */}
        <div className="flex items-center space-x-2">
          <PhaseIndicator active={phase === 'come-up'} completed={phase !== 'come-up'} />
          <PhaseIndicator active={phase === 'peak'} completed={phase === 'integration'} />
          <PhaseIndicator active={phase === 'integration'} />
        </div>
      </div>
    </div>
  );
}

function PhaseIndicator({ active, completed }) {
  return (
    <div
      className={`w-2 h-2 rounded-full transition-colors ${
        active
          ? 'bg-[var(--color-text-primary)]'
          : completed
          ? 'bg-[var(--color-text-secondary)]'
          : 'bg-[var(--color-border)]'
      }`}
    />
  );
}
