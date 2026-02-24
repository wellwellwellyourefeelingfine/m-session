/**
 * ProtectorDialoguePart2Module Component
 *
 * "Understanding Your Protector" — 16-step IFS integration activity.
 * Steps: reconnection → education text → re-settling → age/version reflections →
 * origins → fear beneath → what it guards → dialogue loop (question/listen/response) →
 * what it needs → what might replace → intention → closing.
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
  STARTER_QUESTIONS,
  getProtectorName,
} from '../../../content/modules/protectorDialogueContent';

// Shared UI components
import ModuleLayout from '../capabilities/ModuleLayout';
import ModuleControlBar from '../capabilities/ModuleControlBar';
import ModuleProgressBar from '../capabilities/ModuleProgressBar';
import AsciiDiamond from '../capabilities/animations/AsciiDiamond';
import AsciiMoon from '../capabilities/animations/AsciiMoon';

export default function ProtectorDialoguePart2Module({ module, onComplete, onSkip }) {
  // ── Stores ──
  const protectorData = useSessionStore((s) => s.transitionCaptures?.protectorDialogue);
  const updateProtectorCapture = useSessionStore((s) => s.updateProtectorCapture);
  const addEntry = useJournalStore((s) => s.addEntry);
  const sessionId = useSessionStore((s) => s.sessionId);

  // ── Part 1 data (for personalization) ──
  const protectorNameFromP1 = protectorData?.protectorName || '';
  const protectorDescriptionFromP1 = protectorData?.protectorDescription || '';
  const bodyLocationFromP1 = protectorData?.bodyLocation || '';
  const messageFromP1 = protectorData?.protectorMessage || '';
  const hasPart1Data = !!protectorNameFromP1;

  // ── Inline naming for fallback (no Part 1 data) ──
  const [fallbackName, setFallbackName] = useState('');
  const [fallbackDescription, setFallbackDescription] = useState('');

  // Effective protector label (from Part 1 or fallback)
  const protectorLabel = getProtectorName(hasPart1Data ? protectorNameFromP1 : fallbackName);

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
  const [protectorAge, setProtectorAge] = useState('');
  const [respondingToVersion, setRespondingToVersion] = useState('');
  const [origins, setOrigins] = useState('');
  const [fear, setFear] = useState('');
  const [whatItNeeds, setWhatItNeeds] = useState('');
  const [whatMightReplace, setWhatMightReplace] = useState('');
  const [intention, setIntention] = useState('');

  // ── Dialogue loop state ──
  const [dialogueExchanges, setDialogueExchanges] = useState([]); // [{question, response}]
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [dialogueSubPhase, setDialogueSubPhase] = useState('question'); // 'question' | 'listening' | 'response'
  const [showStarterQuestions, setShowStarterQuestions] = useState(false);

  // Field value/setter lookup (for simple text input steps)
  const fieldMap = {
    protectorAge: [protectorAge, setProtectorAge],
    respondingToVersion: [respondingToVersion, setRespondingToVersion],
    origins: [origins, setOrigins],
    fear: [fear, setFear],
    whatItNeeds: [whatItNeeds, setWhatItNeeds],
    whatMightReplace: [whatMightReplace, setWhatMightReplace],
    intention: [intention, setIntention],
  };

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

    journalContent += `Protector: ${protectorLabel}\n\n`;

    if (protectorAge.trim()) {
      journalContent += `Age of Pattern: ${protectorAge.trim()}\n\n`;
      hasContent = true;
    }
    if (respondingToVersion.trim()) {
      journalContent += `Version It Responds To: ${respondingToVersion.trim()}\n\n`;
      hasContent = true;
    }
    if (origins.trim()) {
      journalContent += `Origins:\n${origins.trim()}\n\n`;
      hasContent = true;
    }
    if (fear.trim()) {
      journalContent += `The Fear Beneath:\n${fear.trim()}\n\n`;
      hasContent = true;
    }
    const allExchanges = currentResponse.trim()
      ? [...dialogueExchanges, { question: currentQuestion, response: currentResponse }]
      : dialogueExchanges;
    const dialogueText = allExchanges
      .filter((e) => e.question.trim() || e.response.trim())
      .map((e) => `Me: ${e.question.trim()}\n${protectorLabel}: ${e.response.trim()}`)
      .join('\n\n');
    if (dialogueText) {
      journalContent += `Dialogue:\n${dialogueText}\n\n`;
      hasContent = true;
    }
    if (whatItNeeds.trim()) {
      journalContent += `What It Needs:\n${whatItNeeds.trim()}\n\n`;
      hasContent = true;
    }
    if (whatMightReplace.trim()) {
      journalContent += `What Might Take Its Place:\n${whatMightReplace.trim()}\n\n`;
      hasContent = true;
    }
    if (intention.trim()) {
      journalContent += `Intention:\n${intention.trim()}\n`;
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
    protectorLabel, protectorAge, respondingToVersion, origins, fear,
    dialogueExchanges, currentQuestion, currentResponse,
    whatItNeeds, whatMightReplace, intention, addEntry, sessionId, onComplete,
  ]);

  // ── Handle back with step-specific logic ──
  const handleBack = useCallback(() => {
    const step = PART2_STEPS[currentStepIndex];

    // Dialogue loop: navigate within sub-phases first
    if (step.type === 'dialogueLoop') {
      if (dialogueSubPhase === 'response') {
        setIsVisible(false);
        setTimeout(() => {
          setDialogueSubPhase('listening');
          setIsVisible(true);
        }, 400);
        return;
      }
      if (dialogueSubPhase === 'listening') {
        setIsVisible(false);
        setTimeout(() => {
          setDialogueSubPhase('question');
          setIsVisible(true);
        }, 400);
        return;
      }
      // 'question' with exchanges — fall through to module goBack
    }

    goBack();
  }, [currentStepIndex, dialogueSubPhase, goBack]);

  // ── Dialogue loop helpers ──
  const handleAskAnother = useCallback(() => {
    if (currentResponse.trim()) {
      setDialogueExchanges((prev) => [...prev, { question: currentQuestion, response: currentResponse.trim() }]);
    }
    setCurrentQuestion('');
    setCurrentResponse('');
    setIsVisible(false);
    setTimeout(() => {
      setDialogueSubPhase('question');
      setIsVisible(true);
    }, 400);
  }, [currentQuestion, currentResponse]);

  // ── Primary button handler ──
  const handlePrimary = useCallback(() => {
    const step = PART2_STEPS[currentStepIndex];

    switch (step.type) {
      case 'dialogueLoop':
        if (dialogueSubPhase === 'question') {
          if (currentQuestion.trim()) {
            setIsVisible(false);
            setTimeout(() => {
              setDialogueSubPhase('listening');
              setIsVisible(true);
            }, 400);
          }
        } else if (dialogueSubPhase === 'listening') {
          setIsVisible(false);
          setTimeout(() => {
            setDialogueSubPhase('response');
            setIsVisible(true);
          }, 400);
        } else if (dialogueSubPhase === 'response') {
          // Save current exchange and advance
          if (currentResponse.trim()) {
            setDialogueExchanges((prev) => [...prev, { question: currentQuestion, response: currentResponse.trim() }]);
          }
          advanceStep();
        }
        break;

      case 'reconnection':
        // If fallback: save the inline naming to store
        if (!hasPart1Data && fallbackName.trim()) {
          updateProtectorCapture('protectorName', fallbackName.trim());
          if (fallbackDescription.trim()) {
            updateProtectorCapture('protectorDescription', fallbackDescription.trim());
          }
        }
        advanceStep();
        break;

      default:
        if (isLastStep) {
          setIsVisible(false);
          setTimeout(() => handleModuleComplete(), 400);
        } else {
          advanceStep();
        }
    }
  }, [
    currentStepIndex, isLastStep, dialogueSubPhase, currentQuestion, currentResponse,
    hasPart1Data, fallbackName, fallbackDescription, updateProtectorCapture,
    advanceStep, handleModuleComplete,
  ]);

  // ── Render helpers ──

  /** Render lines with empty-line spacers, replacing {protector_name} and {body_location} with accent-colored spans */
  const renderLines = (lines) => (
    <div className="space-y-0">
      {lines.map((line, i) => {
        if (line === '') return <div key={i} className="h-4" />;
        if (line === '§') return (
          <div key={i} className="flex justify-center my-4">
            <div className="circle-spacer" />
          </div>
        );
        // Replace placeholders with accent-colored spans
        let processedLine = line;
        const hasProtector = processedLine.includes('{protector_name}');
        const hasBody = processedLine.includes('{body_location}');

        if (hasProtector || hasBody) {
          // Split and rebuild with React elements
          const segments = [];
          let remaining = processedLine;
          let segKey = 0;

          while (remaining.length > 0) {
            const pIdx = remaining.indexOf('{protector_name}');
            const bIdx = remaining.indexOf('{body_location}');

            // Find nearest placeholder
            let nearest = -1;
            let nearestType = null;
            if (pIdx >= 0 && (bIdx < 0 || pIdx <= bIdx)) { nearest = pIdx; nearestType = 'protector'; }
            else if (bIdx >= 0) { nearest = bIdx; nearestType = 'body'; }

            if (nearest < 0) {
              segments.push(<span key={segKey++}>{remaining}</span>);
              break;
            }

            if (nearest > 0) {
              segments.push(<span key={segKey++}>{remaining.slice(0, nearest)}</span>);
            }

            if (nearestType === 'protector') {
              segments.push(
                <span key={segKey++} className="text-[var(--accent)]">{protectorLabel}</span>
              );
              remaining = remaining.slice(nearest + '{protector_name}'.length);
            } else {
              segments.push(
                <span key={segKey++} className="text-[var(--accent)]">{bodyLocationFromP1 || 'your body'}</span>
              );
              remaining = remaining.slice(nearest + '{body_location}'.length);
            }
          }

          return (
            <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {segments}
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
            Welcome back.
          </h2>

          {/* Protector name */}
          <div>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              Earlier, you met a protector. You called it:
            </p>
            <p className="text-[var(--accent)] text-sm leading-relaxed">
              {protectorNameFromP1}
            </p>
          </div>

          {/* Description */}
          {protectorDescriptionFromP1 && (
            <div>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                You described it as:
              </p>
              <p className="text-[var(--accent)] text-sm leading-relaxed italic">
                {protectorDescriptionFromP1}
              </p>
            </div>
          )}

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
            Now we're going to go deeper. Not to fix anything, just to understand where it came from, what it's protecting, and what it might need from you.
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
          'Everyone carries protectors. Patterns that formed to keep you safe. An inner critic, a need for control, a habit of shutting down, a reflex to reach for distraction.',
          '',
          'We\'re going to explore one of yours. Not to fix it. Just to understand it.',
        ])}

        {/* Inline naming for standalone Part 2 */}
        <div className="space-y-4 mt-4">
          <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">
            Name your protector
          </p>
          <input
            type="text"
            value={fallbackName}
            onChange={(e) => setFallbackName(e.target.value)}
            placeholder="e.g., The Critic, The Wall, The Fixer..."
            maxLength={80}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] text-sm text-center
              placeholder:text-[var(--color-text-tertiary)]"
          />
          <textarea
            value={fallbackDescription}
            onChange={(e) => setFallbackDescription(e.target.value)}
            placeholder="Briefly describe what it does..."
            rows={2}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] text-sm leading-relaxed
              placeholder:text-[var(--color-text-tertiary)] resize-none"
          />
        </div>
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

  const renderSettlingStep = (step) => {
    const lines = bodyLocationFromP1 ? step.content.lines : step.content.fallbackLines;
    return renderLines(lines);
  };

  const renderFearBeneathStep = (step) => (
    <div className="space-y-6">
      {step.content.header && (
        <h2
          className="text-[var(--color-text-primary)] text-lg"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          {step.content.header}
        </h2>
      )}
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

  const renderDialogueLoop = (step) => {
    // Sub-phase: question
    if (dialogueSubPhase === 'question') {
      return (
        <div className="space-y-6" style={{ paddingBottom: '8rem' }}>
          {/* Show intro text only on first question */}
          {dialogueExchanges.length === 0 ? (
            <>
              <h2
                className="text-[var(--color-text-primary)] text-lg"
                style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
              >
                {step.content.header.replace('{protector_name}', protectorLabel)}
              </h2>
              {renderTextBlock(step.content.preText.replaceAll('{protector_name}', protectorLabel))}
            </>
          ) : (
            <>
              {/* Accumulated transcript */}
              <div className="space-y-4">
                {dialogueExchanges.map((exchange, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">Me</p>
                    <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">{exchange.question}</p>
                    <p className="text-[var(--accent)] text-xs uppercase tracking-wider mt-2">{protectorLabel}</p>
                    <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">{exchange.response}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <div className="circle-spacer" />
              </div>
            </>
          )}

          {/* Collapsible starter questions */}
          {dialogueExchanges.length === 0 && (
            <div>
              <button
                onClick={() => setShowStarterQuestions(!showStarterQuestions)}
                className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider"
              >
                {step.content.starterLabel}
                <span className="text-[10px] leading-none">{showStarterQuestions ? '−' : '+'}</span>
              </button>
              {showStarterQuestions && (
                <div className="mt-3 space-y-2 animate-fadeIn">
                  {STARTER_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setCurrentQuestion(q);
                        setShowStarterQuestions(false);
                      }}
                      className="block w-full text-left py-2 px-3 border border-[var(--color-border)] bg-transparent
                        text-[var(--color-text-secondary)] text-sm leading-relaxed
                        hover:bg-[var(--color-bg-secondary)] transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Question input */}
          <div>
            <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-2">Me</p>
            <input
              type="text"
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder={step.content.questionPlaceholder.replace('{protector_name}', protectorLabel)}
              className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                focus:outline-none focus:border-[var(--accent)]
                text-[var(--color-text-primary)] text-sm
                placeholder:text-[var(--color-text-tertiary)]"
            />
          </div>
        </div>
      );
    }

    // Sub-phase: listening (moon animation)
    if (dialogueSubPhase === 'listening') {
      return (
        <div className="flex flex-col items-center text-center" style={{ minHeight: '50vh' }}>
          {/* User's question */}
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed italic max-w-xs mb-6">
            "{currentQuestion}"
          </p>

          {/* Moon animation */}
          <div className="flex justify-center mb-6">
            <AsciiMoon />
          </div>

          {/* Instruction */}
          {renderTextBlock(step.content.listeningInstruction.replaceAll('{protector_name}', protectorLabel))}
        </div>
      );
    }

    // Sub-phase: response (transcript + input)
    return (
      <div className="space-y-6" style={{ paddingBottom: '8rem' }}>
        {/* Accumulated transcript */}
        {dialogueExchanges.length > 0 && (
          <div className="space-y-4">
            {dialogueExchanges.map((exchange, i) => (
              <div key={i} className="space-y-1">
                <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">Me</p>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">{exchange.question}</p>
                <p className="text-[var(--accent)] text-xs uppercase tracking-wider mt-2">{protectorLabel}</p>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">{exchange.response}</p>
              </div>
            ))}
            <div className="flex justify-center">
              <div className="circle-spacer" />
            </div>
          </div>
        )}

        {/* Current exchange — question + response input */}
        <div className="space-y-2">
          <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">Me</p>
          <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">{currentQuestion}</p>
        </div>

        <div>
          <p className="text-[var(--accent)] text-xs uppercase tracking-wider mb-2">{protectorLabel}</p>
          <textarea
            value={currentResponse}
            onChange={(e) => setCurrentResponse(e.target.value)}
            placeholder={step.content.responsePlaceholder}
            rows={3}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] text-sm leading-relaxed
              placeholder:text-[var(--color-text-tertiary)] resize-none"
          />
        </div>

        {/* Ask another question button */}
        <button
          onClick={handleAskAnother}
          className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider"
        >
          <span className="text-sm leading-none">+</span>
          Ask another question
        </button>
      </div>
    );
  };

  const renderTextInputStep = (step) => {
    const { field, placeholder, prompt, preText, header, multiline, rows } = step.content;
    const [value, setValue] = fieldMap[field] || ['', () => {}];

    return (
      <div className="space-y-6">
        {header && (
          <h2
            className="text-[var(--color-text-primary)] text-lg"
            style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
          >
            {header}
          </h2>
        )}
        {renderTextBlock(preText || prompt)}

        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            rows={rows || 4}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] text-sm leading-relaxed
              placeholder:text-[var(--color-text-tertiary)] resize-none"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] text-sm text-center
              placeholder:text-[var(--color-text-tertiary)]"
          />
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep.type) {
      case 'reconnection': return renderReconnectionStep();
      case 'text': return renderTextStep(currentStep);
      case 'settling': return renderSettlingStep(currentStep);
      case 'fearBeneath': return renderFearBeneathStep(currentStep);
      case 'dialogueLoop': return renderDialogueLoop(currentStep);
      case 'textInput': return renderTextInputStep(currentStep);
      default: return null;
    }
  };

  // ── Control bar configuration ──

  const getPrimaryConfig = () => {
    // Dialogue loop sub-phases
    if (currentStep.type === 'dialogueLoop') {
      if (dialogueSubPhase === 'question') {
        return {
          label: 'Ask',
          onClick: handlePrimary,
          disabled: !currentQuestion.trim(),
        };
      }
      if (dialogueSubPhase === 'listening') {
        return { label: 'Continue', onClick: handlePrimary };
      }
      if (dialogueSubPhase === 'response') {
        // Require at least one complete exchange to advance
        const hasExchanges = dialogueExchanges.length > 0 || currentResponse.trim();
        return {
          label: 'Continue',
          onClick: handlePrimary,
          disabled: !hasExchanges,
        };
      }
    }

    // Reconnection fallback: require name
    if (currentStep.type === 'reconnection' && !hasPart1Data && !fallbackName.trim()) {
      return { label: 'Continue', onClick: handlePrimary, disabled: true };
    }

    // Last step
    if (isLastStep) return { label: 'Complete', onClick: handlePrimary };

    // Default
    return { label: 'Continue', onClick: handlePrimary };
  };

  const getShowBack = () => {
    if (currentStepIndex === 0 && dialogueSubPhase === 'question') return false;
    if (currentStepIndex === 0) return false;
    return true;
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
      <ModuleProgressBar progress={progress} visible={isVisible} showTime={false} />

      <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
        <div className={`pt-6 transition-opacity duration-[400ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div key={`${currentStepIndex}-${dialogueSubPhase}`} className="animate-fadeIn">
            {renderStepContent()}
          </div>
        </div>
      </ModuleLayout>

      <ModuleControlBar
        phase={isLastStep ? 'completed' : 'active'}
        primary={getPrimaryConfig()}
        showBack={getShowBack()}
        onBack={handleBack}
        backConfirmMessage={null}
        showSkip={!isLastStep}
        onSkip={onSkip}
        skipConfirmMessage="Skip this activity?"
      />
    </>
  );
}
