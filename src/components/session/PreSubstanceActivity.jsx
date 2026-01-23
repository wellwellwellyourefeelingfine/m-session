/**
 * PreSubstanceActivity Component
 * Activity menu shown between SubstanceChecklist Part 1 and Part 2
 * Offers optional pre-substance activities before taking the substance
 */

import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import AsciiMoon from '../active/capabilities/animations/AsciiMoon';

export default function PreSubstanceActivity() {
  const [isVisible, setIsVisible] = useState(true);

  const completedActivities = useSessionStore(
    (state) => state.preSubstanceActivity.completedActivities
  );
  const setSubstanceChecklistSubPhase = useSessionStore(
    (state) => state.setSubstanceChecklistSubPhase
  );

  const fadeTransition = (callback) => {
    setIsVisible(false);
    setTimeout(() => {
      callback();
      setIsVisible(true);
    }, 300);
  };

  const handleIntention = () => {
    fadeTransition(() => setSubstanceChecklistSubPhase('intention'));
  };

  const handleSkip = () => {
    fadeTransition(() => setSubstanceChecklistSubPhase('part2'));
  };

  const isIntentionCompleted = completedActivities.includes('intention');
  const isBreathCompleted = completedActivities.includes('centering-breath');

  return (
    <div className="max-w-md mx-auto px-6 py-8">
      <div
        className="transition-opacity duration-300"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        {/* Header */}
        <div className="mb-6">
          <p className="uppercase tracking-wider text-[var(--color-text-tertiary)] text-xs">
            Before You Begin
          </p>
        </div>

        {/* ASCII Moon */}
        <div className="flex justify-center mb-8">
          <AsciiMoon />
        </div>

        {/* Description */}
        <p className="text-[var(--color-text-secondary)] leading-relaxed mb-8">
          Would you like to take some time before you take your substance to further develop your intention with your session?
        </p>

        {/* Activity buttons */}
        <div className="space-y-3">
          {/* Option 1: Review My Intention (accent styled) */}
          <button
            onClick={handleIntention}
            disabled={isIntentionCompleted}
            className={`w-full py-4 border text-left px-4 transition-colors ${
              isIntentionCompleted
                ? 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] cursor-not-allowed'
                : 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)] hover:opacity-80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Review My Intention <span className="text-[var(--color-text-tertiary)]">(recommended)</span></span>
              {isIntentionCompleted && (
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase tracking-wider">Completed</span>
                  <span className="text-xs">+</span>
                </div>
              )}
            </div>
          </button>

          {/* Option 2: Brief Centering Breath (accent styled, disabled placeholder) */}
          <button
            disabled
            className={`w-full py-4 border text-left px-4 transition-colors ${
              isBreathCompleted
                ? 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] cursor-not-allowed'
                : 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-tertiary)] cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Brief Centering Breath</span>
              {isBreathCompleted ? (
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase tracking-wider">Completed</span>
                  <span className="text-xs">+</span>
                </div>
              ) : (
                <span className="text-[10px] uppercase tracking-wider">Coming Soon</span>
              )}
            </div>
          </button>

          {/* Option 3: Skip (normal style) */}
          <button
            onClick={handleSkip}
            className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left px-4 text-[var(--color-text-primary)]"
          >
            Skip to Taking Substance
          </button>
        </div>
      </div>
    </div>
  );
}
