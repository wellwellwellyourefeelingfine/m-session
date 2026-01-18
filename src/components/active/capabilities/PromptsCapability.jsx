/**
 * PromptsCapability Component
 *
 * Renders prompts/instructions based on configuration:
 * - 'static': Shows all prompts at once
 * - 'sequential': User navigates through prompts
 * - 'timed': Prompts fade in/out based on elapsed time
 */

import { useState, useEffect, useMemo } from 'react';

/**
 * @param {object} props
 * @param {object} props.config - Prompts capability config
 * @param {string} props.config.type - 'static' | 'sequential' | 'timed'
 * @param {boolean} props.config.fadeTransition - Fade between prompts
 * @param {boolean} props.config.showProgress - Show dot progress indicator
 * @param {string} props.title - Module title
 * @param {string} props.instructions - Module instructions
 * @param {Array} props.prompts - Array of prompt strings or timed prompt objects
 * @param {number} props.currentIndex - Current prompt index (for sequential)
 * @param {number} props.elapsedTime - Elapsed time in seconds (for timed)
 * @param {Array} props.timedSequence - Array of { text, startTime, endTime } (for timed)
 */
export default function PromptsCapability({
  config,
  title,
  instructions,
  prompts = [],
  currentIndex = 0,
  elapsedTime = 0,
  timedSequence = [],
}) {
  if (!config) return null;

  const { type, fadeTransition, showProgress } = config;

  switch (type) {
    case 'static':
      return (
        <StaticPrompts
          title={title}
          instructions={instructions}
          prompts={prompts}
        />
      );

    case 'sequential':
      return (
        <SequentialPrompts
          title={title}
          instructions={instructions}
          prompts={prompts}
          currentIndex={currentIndex}
          showProgress={showProgress}
          fadeTransition={fadeTransition}
        />
      );

    case 'timed':
      return (
        <TimedPrompts
          timedSequence={timedSequence}
          elapsedTime={elapsedTime}
          fadeTransition={fadeTransition}
        />
      );

    default:
      return (
        <StaticPrompts
          title={title}
          instructions={instructions}
          prompts={prompts}
        />
      );
  }
}

/**
 * Static prompts - shows title, instructions, and all prompts at once
 */
function StaticPrompts({ title, instructions, prompts }) {
  return (
    <div className="text-center space-y-6">
      {title && (
        <h2 className="text-[var(--color-text-primary)]">
          {title}
        </h2>
      )}

      {instructions && (
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          {instructions}
        </p>
      )}

      {prompts && prompts.length > 0 && (
        <div className="space-y-3 mt-6">
          {prompts.map((prompt, index) => (
            <p
              key={index}
              className="text-[var(--color-text-secondary)] italic"
              style={{ textTransform: 'none' }}
            >
              {typeof prompt === 'string' ? prompt : prompt.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Sequential prompts - user navigates through one at a time
 */
function SequentialPrompts({
  title,
  instructions,
  prompts,
  currentIndex,
  showProgress,
  fadeTransition,
}) {
  const [fadePhase, setFadePhase] = useState('visible');
  const [displayIndex, setDisplayIndex] = useState(currentIndex);

  // Handle fade transitions when index changes
  useEffect(() => {
    if (fadeTransition && displayIndex !== currentIndex) {
      setFadePhase('fading-out');
      const timer = setTimeout(() => {
        setDisplayIndex(currentIndex);
        setFadePhase('visible');
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDisplayIndex(currentIndex);
    }
  }, [currentIndex, displayIndex, fadeTransition]);

  const currentPrompt = prompts[displayIndex];
  const promptText = typeof currentPrompt === 'string' ? currentPrompt : currentPrompt?.text;
  const promptTitle = typeof currentPrompt === 'object' ? currentPrompt?.title : null;

  return (
    <div className="text-center space-y-6">
      <h2
        className={`text-[var(--color-text-primary)] transition-opacity duration-300 ${
          fadePhase === 'visible' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {promptTitle || title}
      </h2>

      <p
        className={`text-[var(--color-text-secondary)] leading-relaxed transition-opacity duration-300 ${
          fadePhase === 'visible' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {promptText || instructions}
      </p>

      {/* Progress dots */}
      {showProgress && prompts.length > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          {prompts.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index === displayIndex
                  ? 'bg-[var(--color-text-primary)]'
                  : index < displayIndex
                    ? 'bg-[var(--color-text-secondary)]'
                    : 'bg-[var(--color-border)]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Timed prompts - prompts fade in/out based on elapsed time
 */
function TimedPrompts({ timedSequence, elapsedTime, fadeTransition }) {
  const [fadePhase, setFadePhase] = useState('visible');
  const [displayedIndex, setDisplayedIndex] = useState(0);

  // Find current prompt based on elapsed time
  const currentPromptIndex = useMemo(() => {
    if (!timedSequence || timedSequence.length === 0) return 0;

    let targetIndex = 0;
    for (let i = 0; i < timedSequence.length; i++) {
      if (elapsedTime >= timedSequence[i].startTime) {
        targetIndex = i;
      }
    }
    return targetIndex;
  }, [timedSequence, elapsedTime]);

  // Handle fade transition when prompt changes
  useEffect(() => {
    if (currentPromptIndex !== displayedIndex) {
      if (fadeTransition) {
        setFadePhase('fading-out');
        const timer = setTimeout(() => {
          setDisplayedIndex(currentPromptIndex);
          setFadePhase('visible');
        }, 300);
        return () => clearTimeout(timer);
      } else {
        setDisplayedIndex(currentPromptIndex);
      }
    }
  }, [currentPromptIndex, displayedIndex, fadeTransition]);

  const currentPrompt = timedSequence[displayedIndex];

  if (!currentPrompt) {
    return null;
  }

  return (
    <p
      className={`uppercase tracking-wider text-xs leading-loose text-center transition-opacity duration-300 ${
        fadePhase === 'visible' ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {currentPrompt.text}
    </p>
  );
}

/**
 * Standalone prompt display for simple use cases
 */
export function SimplePrompt({ text, className = '' }) {
  return (
    <p className={`text-[var(--color-text-secondary)] leading-relaxed ${className}`}>
      {text}
    </p>
  );
}

/**
 * Progress dots component for reuse
 */
export function ProgressDots({ total, current, className = '' }) {
  return (
    <div className={`flex justify-center space-x-2 ${className}`}>
      {Array.from({ length: total }, (_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            index === current
              ? 'bg-[var(--color-text-primary)]'
              : index < current
                ? 'bg-[var(--color-text-secondary)]'
                : 'bg-[var(--color-border)]'
          }`}
        />
      ))}
    </div>
  );
}
