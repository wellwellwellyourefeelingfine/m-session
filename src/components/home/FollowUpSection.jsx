/**
 * FollowUpSection Component
 * Displays follow-up as Phase 4 on the home screen after session completion
 * Styled to match PhaseSection with vertical timeline bar and nodes
 * Shows three time-locked modules with countdown/status indicators
 */

import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { FOLLOW_UP_MODULES } from '../followup/content/followUpContent';
import FollowUpModuleModal from './FollowUpModuleModal';

/**
 * Format countdown time
 */
function formatCountdown(unlockTime) {
  if (!unlockTime) return '';

  const now = Date.now();
  const remaining = unlockTime - now;

  if (remaining <= 0) {
    return 'Available now';
  }

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `Available in ${hours}h ${minutes}m`;
  } else {
    return `Available in ${minutes}m`;
  }
}

export default function FollowUpSection() {
  const [selectedModule, setSelectedModule] = useState(null);
  const [countdown, setCountdown] = useState({});

  const followUp = useSessionStore((state) => state.followUp);
  const checkFollowUpAvailability = useSessionStore((state) => state.checkFollowUpAvailability);

  // Check availability and update countdowns every minute
  useEffect(() => {
    const updateCountdowns = () => {
      checkFollowUpAvailability();
      setCountdown({
        checkIn: formatCountdown(followUp.unlockTimes.checkIn),
        revisit: formatCountdown(followUp.unlockTimes.revisit),
        integration: formatCountdown(followUp.unlockTimes.integration),
      });
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 60000);
    return () => clearInterval(interval);
  }, [followUp.unlockTimes, checkFollowUpAvailability]);

  const handleModuleClick = (moduleId) => {
    setSelectedModule(moduleId);
  };

  const handleCloseModal = () => {
    setSelectedModule(null);
  };

  // Render a single module card - styled like ModuleCard with timeline nodes
  const renderModuleCard = (moduleId, isLast = false) => {
    const module = FOLLOW_UP_MODULES[moduleId];
    const moduleState = followUp.modules[moduleId];
    const status = moduleState.status;
    const isLocked = status === 'locked';
    const isCompleted = status === 'completed';
    const isAvailable = status === 'available';

    // Determine node fill state
    const isNodeFilled = isCompleted;

    return (
      <div key={moduleId} className="relative flex">
        {/* Timeline node and vertical bar segment */}
        <div className="flex flex-col items-center mr-4 flex-shrink-0" style={{ width: '12px' }}>
          {/* Node circle */}
          <div
            className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 mt-1 ${
              isNodeFilled
                ? 'bg-[var(--color-text-primary)] border-[var(--color-text-primary)]'
                : 'bg-[var(--color-bg)] border-[var(--color-text-primary)]'
            }`}
          />
          {/* Vertical bar extending down */}
          {!isLast && (
            <div className="w-0.5 flex-1 bg-[var(--color-text-primary)]" />
          )}
        </div>

        {/* Module content */}
        <button
          type="button"
          onClick={() => handleModuleClick(moduleId)}
          className={`flex-1 text-left pb-4 transition-opacity ${
            isCompleted ? 'opacity-50' : 'hover:opacity-80'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-text-primary)] text-sm">
              {module.title}
            </span>
            {isCompleted && (
              <span className="text-[var(--color-text-tertiary)] text-xs">✓</span>
            )}
          </div>
          <p className="text-[var(--color-text-tertiary)] text-xs mt-0.5">
            {isLocked && countdown[moduleId]}
            {isAvailable && 'Available now'}
            {isCompleted && 'Completed'}
          </p>
        </button>
      </div>
    );
  };

  return (
    <div className="relative flex mt-6">
      {/* Timeline node and vertical bar segment for Phase 4 header */}
      <div className="flex flex-col items-center mr-4 flex-shrink-0" style={{ width: '12px' }}>
        {/* Node circle - aligned with phase header */}
        <div className="w-3 h-3 rounded-full border-2 flex-shrink-0 bg-[var(--color-bg)] border-[var(--color-text-primary)]" />
        {/* Vertical bar extending down */}
        <div className="w-0.5 flex-1 bg-[var(--color-text-primary)]" />
      </div>

      {/* Phase content */}
      <div className="flex-1 pb-2">
        {/* Phase header - matching PhaseSection styling */}
        <div className="mb-4">
          <h3
            className="flex items-baseline gap-2"
            style={{ lineHeight: 1, marginBottom: '8px' }}
          >
            <span className="font-serif text-lg" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
              Phase 4
            </span>
            <span className="text-[var(--color-text-primary)]">-</span>
            <span className="text-[var(--color-text-primary)] text-[13px]">
              Follow-Up
            </span>
          </h3>

          {/* Timing info */}
          <p className="text-[var(--color-text-tertiary)] text-xs" style={{ lineHeight: 1, marginBottom: '6px' }}>
            Available 24-48 hours after session
          </p>

          {/* Phase description */}
          <p className="text-[var(--color-text-secondary)]" style={{ lineHeight: 1.3 }}>
            Short reflections to help you integrate what you experienced.
          </p>
        </div>

        {/* Module cards */}
        <div>
          {renderModuleCard('checkIn')}
          {renderModuleCard('revisit')}
          {renderModuleCard('integration', true)}
        </div>
      </div>

      {/* Module Modal */}
      {selectedModule && (
        <FollowUpModuleModal
          moduleId={selectedModule}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
