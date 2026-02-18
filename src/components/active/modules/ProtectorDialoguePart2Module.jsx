/**
 * ProtectorDialoguePart2Module Component
 *
 * "Understanding Your Protector" — 13-step IFS integration activity.
 * Steps: reconnection → education text → guided reflection → journaling
 * prompts (origins, fear, dialogue, needs, commitment) → closing.
 *
 * Reads Part 1 data from transitionCaptures.protectorDialogue for personalization.
 * Creates a structured journal entry on completion.
 */

import { useState, useCallback } from 'react';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useJournalStore } from '../../../stores/useJournalStore';
import {
  PART2_STEPS,
  PART2_LANDING,
  getProtectorLabel,
} from '../../../content/modules/protectorDialogueContent';

// Shared UI components
import ModuleLayout from '../capabilities/ModuleLayout';
import ModuleControlBar from '../capabilities/ModuleControlBar';
import ModuleProgressBar from '../capabilities/ModuleProgressBar';
import AsciiDiamond from '../capabilities/animations/AsciiDiamond';

export default function ProtectorDialoguePart2Module({ module, onComplete, onSkip }) {
  // ── Stores ──
  const protectorData = useSessionStore((s) => s.transitionCaptures?.protectorDialogue);
  const addEntry = useJournalStore((s) => s.addEntry);
  const sessionId = useSessionStore((s) => s.sessionId);

  // ── Part 1 data (for personalization) ──
  const protectorType = protectorData?.protectorType || null;
  const customName = protectorData?.customProtectorName || '';
  const protectorLabel = getProtectorLabel(protectorType, customName);
  const bodyLocationFromP1 = protectorData?.bodyLocation || '';
  const messageFromP1 = protectorData?.protectorMessage || '';
  const hasPart1Data = !!protectorType;

  // ── Idle / landing page ──
  const [hasStarted, setHasStarted] = useState(false);
  const [showIfsInfo, setShowIfsInfo] = useState(false);
  const [isLandingVisible, setIsLandingVisible] = useState(true);

  const handleBegin = useCallback(() => {
    setIsLandingVisible(false);
    setTimeout(() => {
      setHasStarted(true);
    }, 400);
  }, []);

  // ── Step navigation ──
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [stepHistory, setStepHistory] = useState([0]);

  // ── Journaling captures ──
  const [origins, setOrigins] = useState('');
  const [fear, setFear] = useState('');
  const [dialoguePairs, setDialoguePairs] = useState([
    { me: '', protector: '' },
    { me: '', protector: '' },
  ]);
  const [showDialogueExample, setShowDialogueExample] = useState(false);
  const [whatItNeeds, setWhatItNeeds] = useState('');
  const [commitment, setCommitment] = useState('');

  // Field value/setter lookup (for simple text input steps)
  const fieldMap = {
    origins: [origins, setOrigins],
    fear: [fear, setFear],
    whatItNeeds: [whatItNeeds, setWhatItNeeds],
    commitment: [commitment, setCommitment],
  };

  // Dialogue pair handlers
  const updateDialoguePair = useCallback((index, field, value) => {
    setDialoguePairs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const addDialoguePair = useCallback(() => {
    setDialoguePairs(prev => [...prev, { me: '', protector: '' }]);
  }, []);

  // ── Derived values ──
  const currentStep = PART2_STEPS[currentStepIndex];
  const totalSteps = PART2_STEPS.length;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  // ── Step navigation ──
  const advanceStep = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentStepIndex((prev) => {
        const nextIndex = prev + 1;
        setStepHistory((h) => [...h, nextIndex]);
        return nextIndex;
      });
      setIsVisible(true);
    }, 400);
  }, []);

  const goBack = useCallback(() => {
    if (currentStepIndex === 0) return;
    setIsVisible(false);
    setTimeout(() => {
      setStepHistory((h) => (h.length <= 1 ? h : h.slice(0, -1)));
      setCurrentStepIndex((prev) => Math.max(0, prev - 1));
      setIsVisible(true);
    }, 400);
  }, [currentStepIndex]);

  // ── Module completion ──
  const handleModuleComplete = useCallback(() => {
    // Build structured journal entry
    let journalContent = 'PROTECTOR DIALOGUE — PART 2\n\n';
    let hasContent = false;

    if (hasPart1Data) {
      journalContent += `Protector: ${protectorLabel}\n\n`;
    }
    if (origins.trim()) {
      journalContent += `Origins:\n${origins.trim()}\n\n`;
      hasContent = true;
    }
    if (fear.trim()) {
      journalContent += `The Fear Beneath:\n${fear.trim()}\n\n`;
      hasContent = true;
    }
    const dialogueText = dialoguePairs
      .filter(pair => pair.me.trim() || pair.protector.trim())
      .flatMap(pair => {
        const lines = [];
        if (pair.me.trim()) lines.push(`Me: ${pair.me.trim()}`);
        if (pair.protector.trim()) lines.push(`${protectorLabel}: ${pair.protector.trim()}`);
        return lines;
      })
      .join('\n');
    if (dialogueText) {
      journalContent += `Dialogue:\n${dialogueText}\n\n`;
      hasContent = true;
    }
    if (whatItNeeds.trim()) {
      journalContent += `What It Needs:\n${whatItNeeds.trim()}\n\n`;
      hasContent = true;
    }
    if (commitment.trim()) {
      journalContent += `Commitment:\n${commitment.trim()}\n`;
      hasContent = true;
    }

    if (hasContent) {
      addEntry({
        content: journalContent.trim(),
        source: 'session',
        sessionId,
        moduleTitle: 'Dialogue with a Protector (Part 2)',
      });
    }

    onComplete();
  }, [
    hasPart1Data, protectorLabel, origins, fear, dialoguePairs, whatItNeeds,
    commitment, addEntry, sessionId, onComplete,
  ]);

  // ── Primary button handler ──
  const handlePrimary = useCallback(() => {
    if (isLastStep) {
      setIsVisible(false);
      setTimeout(() => handleModuleComplete(), 400);
    } else {
      advanceStep();
    }
  }, [isLastStep, advanceStep, handleModuleComplete]);

  // ── Render helpers ──

  /** Render lines with empty-line spacers, replacing {protector_label} with accent-colored span */
  const renderLines = (lines) => (
    <div className="space-y-0">
      {lines.map((line, i) => {
        if (line === '') return <div key={i} className="h-4" />;
        if (line === '§') return (
          <div key={i} className="flex justify-center my-4">
            <div className="circle-spacer" />
          </div>
        );
        // Split on {protector_label} and render as accent-colored spans
        if (line.includes('{protector_label}')) {
          const parts = line.split('{protector_label}');
          return (
            <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {parts.map((part, j) => (
                <span key={j}>
                  {part}
                  {j < parts.length - 1 && (
                    <span className="text-[var(--accent)]">{protectorLabel}</span>
                  )}
                </span>
              ))}
            </p>
          );
        }
        return (
          <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );

  /** Render multi-line text from a string */
  const renderTextBlock = (text) => renderLines(text.split('\n'));

  // ── Step renderers ──

  const renderReconnectionStep = () => {
    if (hasPart1Data) {
      return (
        <div className="space-y-4">
          <h2
            className="text-[var(--color-text-primary)] text-xl"
            style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
          >
            Understanding Your Protector
          </h2>

          {/* Protector name */}
          <div>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              Earlier, you met a protector. You called it:
            </p>
            <p className="text-[var(--accent)] text-sm leading-relaxed">
              {protectorLabel}
            </p>
          </div>

          {/* Body location */}
          {bodyLocationFromP1 && (
            <div>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                You felt it in your body:
              </p>
              <p className="text-[var(--accent)] text-sm leading-relaxed">
                {bodyLocationFromP1}
              </p>
            </div>
          )}

          {/* Message to protector */}
          {messageFromP1 && (
            <div>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                You said to it:
              </p>
              <p className="text-[var(--accent)] text-sm leading-relaxed">
                {messageFromP1}
              </p>
            </div>
          )}

          {/* Closing */}
          <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            Now we're going to go a little deeper. Not to fix anything, just to understand where it came from, what it's protecting, and what it might need from you.
          </p>
        </div>
      );
    }

    // Fallback — no Part 1 data
    return (
      <div className="space-y-4">
        <h2
          className="text-[var(--color-text-primary)] text-xl"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          Understanding Your Protector
        </h2>
        {renderLines([
          'This activity is about understanding a protective part of yourself.',
          '',
          'Everyone carries protectors. Patterns that formed to keep you safe. An inner critic, a need for control, a habit of shutting down.',
          '',
          'We\'re going to explore one of yours. Not to fix it. Just to understand it.',
        ])}
      </div>
    );
  };

  const renderTextStep = (step) => {
    // Last step: add AsciiDiamond animation for finality
    if (isLastStep) {
      return (
        <div className="space-y-4">
          {renderLines(step.content.lines)}
          <div className="flex justify-center pt-2">
            <AsciiDiamond />
          </div>
        </div>
      );
    }
    return renderLines(step.content.lines);
  };

  const renderGuidedReflectionStep = (step) => renderLines(step.content.lines);

  const renderFearBeneathStep = (step) => (
    <div className="space-y-6">
      {renderLines(step.content.preLines)}
      <div className="space-y-2 max-w-xs mx-auto">
        {step.content.suggestions.map((s, i) => (
          <p
            key={i}
            className="text-[var(--color-text-tertiary)] text-xs leading-relaxed text-center italic"
          >
            {s}
          </p>
        ))}
      </div>
      <p className="text-[var(--color-text-tertiary)] text-xs text-center italic">
        {step.content.postLine}
      </p>
    </div>
  );

  const renderDialogueStep = (step) => (
    <div className="space-y-6" style={{ paddingBottom: '16rem' }}>
      {/* Intro text */}
      {renderTextBlock(step.content.preText)}

      {/* Collapsible example */}
      <div>
        <button
          onClick={() => setShowDialogueExample(!showDialogueExample)}
          className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider"
        >
          Example
          <span className="text-[10px] leading-none">{showDialogueExample ? '−' : '+'}</span>
        </button>
        {showDialogueExample && (
          <div className="border border-[var(--color-border)] px-4 py-3 mt-3 animate-fadeIn">
            {step.content.example.split('\n').map((line, i) => (
              <p key={i} className="text-[var(--color-text-tertiary)] text-xs leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Structured dialogue pairs */}
      <div className="space-y-4">
        {dialoguePairs.map((pair, i) => (
          <div key={i} className="space-y-2">
            <div>
              <p className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider mb-1">Me</p>
              <input
                type="text"
                value={pair.me}
                onChange={(e) => updateDialoguePair(i, 'me', e.target.value)}
                className="w-full py-2 px-3 border border-[var(--color-border)] bg-transparent
                  focus:outline-none focus:border-[var(--accent)]
                  text-[var(--color-text-primary)] text-sm
                  placeholder:text-[var(--color-text-tertiary)]"
                placeholder="..."
              />
            </div>
            <div>
              <p className="text-[var(--accent)] text-[10px] uppercase tracking-wider mb-1">{protectorLabel}</p>
              <input
                type="text"
                value={pair.protector}
                onChange={(e) => updateDialoguePair(i, 'protector', e.target.value)}
                className="w-full py-2 px-3 border border-[var(--color-border)] bg-transparent
                  focus:outline-none focus:border-[var(--accent)]
                  text-[var(--color-text-primary)] text-sm
                  placeholder:text-[var(--color-text-tertiary)]"
                placeholder="..."
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add more pairs */}
      <button
        onClick={addDialoguePair}
        className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider"
      >
        <span className="text-sm leading-none">+</span>
        Add more
      </button>
    </div>
  );

  const renderTextInputStep = (step) => {
    const { field, placeholder, multiline, rows } = step.content;
    const [value, setValue] = fieldMap[field] || ['', () => {}];
    const hasPreText = !!step.content.preText;
    const prompt = step.content.prompt;

    return (
      <div className="space-y-6">
        {hasPreText ? renderTextBlock(step.content.preText) : renderTextBlock(prompt)}

        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            rows={rows || 4}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] text-sm leading-relaxed              placeholder:text-[var(--color-text-tertiary)] resize-none"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] text-sm text-center              placeholder:text-[var(--color-text-tertiary)]"
          />
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep.type) {
      case 'reconnection': return renderReconnectionStep();
      case 'text': return renderTextStep(currentStep);
      case 'guidedReflection': return renderGuidedReflectionStep(currentStep);
      case 'fearBeneath': return renderFearBeneathStep(currentStep);
      case 'dialogue': return renderDialogueStep(currentStep);
      case 'textInput': return renderTextInputStep(currentStep);
      default: return null;
    }
  };

  // ── Landing page (idle) ──
  if (!hasStarted) {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <div className={`flex flex-col items-center px-4 transition-opacity duration-[400ms] ${isLandingVisible ? 'opacity-100' : 'opacity-0'}`}>
            <h2
              className="text-2xl text-[var(--color-text-primary)] mb-2"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              Dialogue with a Protector
            </h2>
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] mb-6">
              Part II
            </p>

            <div className="flex justify-center mb-4">
              <div className="circle-spacer" />
            </div>

            <button
              onClick={() => setShowIfsInfo(!showIfsInfo)}
              className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-4"
            >
              {PART2_LANDING.subtitle}
              <span className="text-[10px] leading-none">{showIfsInfo ? '−' : '+'}</span>
            </button>
            {showIfsInfo && (
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4 max-w-sm text-center animate-fadeIn">
                {PART2_LANDING.description}
              </p>
            )}

            <div className="flex justify-center mb-4">
              <div className="circle-spacer" />
            </div>

            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed max-w-sm text-center">
              {PART2_LANDING.goals}
            </p>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="idle"
          primary={{ label: 'Begin', onClick: handleBegin }}
          showBack={false}
          showSkip={true}
          onSkip={onSkip}
          skipConfirmMessage="Skip this activity?"
        />
      </>
    );
  }

  return (
    <>
      <ModuleProgressBar progress={progress} visible={true} showTime={false} />

      <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
        <div className={`pt-6 transition-opacity duration-[400ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div key={currentStepIndex} className="animate-fadeIn">
            {renderStepContent()}
          </div>
        </div>
      </ModuleLayout>

      <ModuleControlBar
        phase={isLastStep ? 'completed' : 'active'}
        primary={{ label: isLastStep ? 'Complete' : 'Continue', onClick: handlePrimary }}
        showBack={currentStepIndex > 0}
        onBack={goBack}
        backConfirmMessage={null}
        showSkip={!isLastStep}
        onSkip={onSkip}
        skipConfirmMessage="Skip this activity?"
      />
    </>
  );
}
