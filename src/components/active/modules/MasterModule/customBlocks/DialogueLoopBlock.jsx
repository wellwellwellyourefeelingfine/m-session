/**
 * DialogueLoopBlock — Single-page written conversation with a named part.
 *
 * Flow (one continuous page, no sub-phases):
 *   1. Intro + optional starter-questions expandable + question input
 *   2. Continue → question becomes static, response input fades in below
 *   3. Continue → exchange committed; next question input fades in below
 *      (auto-reveal for the first cycle so the user gets through 2 exchanges)
 *   4. After 2 completed exchanges → no auto-reveal. Show an "Ask more" link
 *      and let the section's Continue advance to the next section. If "Ask
 *      more" is clicked, another question input fades in and the cycle resumes.
 *
 * Smooth-scroll-to-newest-input on each phase change so the user's eye
 * follows the reveal — same easing curve as the master-module progressive-
 * reveal pattern (smoothScrollToElement defaults).
 *
 * The accumulated transcript mirrors to responses[block.responsesKey] as a
 * JSON-encoded blob so the journal assembler emits it as a single labeled
 * "Dialogue:" section.
 *
 * Continue button label is always "Continue" — the block intercepts via
 * setPrimaryOverride. The handler routes by internal phase, not by the
 * label, so the user never sees an "Ask" or phase-specific button text.
 *
 * Config:
 *   {
 *     type: 'dialogue-loop',
 *     responsesKey: 'protector-dialogue-exchanges', // unique per module
 *     journalLabel: 'Dialogue',
 *     starterQuestions: STARTER_QUESTIONS,
 *     starterToggleLabel: 'Example Questions',
 *     introLines: [...],          // shown above the first-question input
 *     questionPrompt: "What would you ask {protectorName}?",   // optional, DM Serif
 *     questionPlaceholder: 'Write a question for {protectorName}...',
 *     responsePrompt: 'What came back?',                        // optional, DM Serif
 *     responsePlaceholder: 'Write what came back...',
 *     defaultQuestion: 'What do you want me to understand about you?',
 *       // optional. Substituted into the question slot when the user
 *       // advances past an empty question input. Keeps the conversation
 *       // and the journal entry readable for paper-journal users.
 *   }
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSessionStore } from '../../../../../stores/useSessionStore';
import renderContentLines, { renderLineWithMarkup, substituteTokensPlain } from '../utils/renderContentLines';
import { CirclePlusIcon, CircleSkipIcon } from '../../../../shared/Icons';
import { smoothScrollToElement } from '../../../../../utils/smoothScroll';

const FORCED_AUTO_REVEAL_COUNT = 2; // first N completed exchanges auto-reveal next Q

function assembleTranscript(exchanges, protectorLabel) {
  return JSON.stringify({
    protectorLabel,
    exchanges: exchanges.map((e) => ({ question: e.question, response: e.response })),
  });
}

export default function DialogueLoopBlock({ block, context }) {
  const protectorName = useSessionStore((s) => s.sessionProfile?.protector?.name);
  const protectorLabel = protectorName?.trim() || 'your protector';
  const accentTerms = context?.accentTerms || {};
  const responsesKey = block.responsesKey || 'dialogue-exchanges';

  // Destructure stable callbacks ONCE — `context` itself is recreated on every
  // parent render, so depending on `context` in an effect's deps causes the
  // effect to run every render. The functions below are useCallback'd in
  // ScreensSection / useMasterModuleState with stable identities.
  const setPromptResponse = context?.setPromptResponse;
  const setPrimaryOverride = context?.setPrimaryOverride;
  const advanceSection = context?.advanceSection;

  // Phase = which input is visible.
  //   'question'  → Q input shown
  //   'response'  → Q (static) + R input shown
  //   'done'      → transcript + "Ask more" link; Continue advances section
  const [phase, setPhase] = useState('question');
  const [draftQ, setDraftQ] = useState('');
  const [draftR, setDraftR] = useState('');
  const [exchanges, setExchanges] = useState([]); // [{ question, response }]
  const [showStarter, setShowStarter] = useState(false);

  // Refs for smooth-scroll-to-newly-revealed-input on phase change.
  const questionInputRef = useRef(null);
  const responseInputRef = useRef(null);

  // ── Mirror the transcript to the journal-readable blob ──
  useEffect(() => {
    if (!setPromptResponse) return;
    const inProgress = phase === 'response' && draftR.trim()
      ? [...exchanges, { question: draftQ, response: draftR.trim() }]
      : exchanges;
    setPromptResponse(responsesKey, assembleTranscript(inProgress, protectorLabel));
  }, [exchanges, phase, draftQ, draftR, protectorLabel, responsesKey, setPromptResponse]);

  // Default question used when the user advances past an empty question
  // input — keeps the conversation readable in the response phase + the
  // journal even if the user is writing in a paper journal alongside.
  // Override at the block-config level (`defaultQuestion: '...'`).
  const defaultQuestion = block.defaultQuestion ?? 'What do you want me to understand about you?';

  // ── Continue handler — routes by phase. Never gated on input text:
  // the journal assembler emits "[no entry — HH:MM]" for any empty turn,
  // so a physical-journal user can press through and still capture timing.
  const handleContinue = useCallback(() => {
    if (phase === 'question') {
      // Empty Q? Substitute the default so the response phase renders a
      // coherent "Me: …" line and the committed exchange has a real
      // question rather than a blank.
      if (!draftQ.trim() && defaultQuestion) {
        setDraftQ(defaultQuestion);
      }
      setPhase('response');
      // Scroll to the newly-revealed response input after it mounts.
      requestAnimationFrame(() => {
        if (responseInputRef.current) smoothScrollToElement(responseInputRef.current);
      });
      return;
    }
    if (phase === 'response') {
      // Commit the exchange even if Q or R is empty — the journal assembler
      // records empty turns as "[no entry — HH:MM]" so paper-journal users
      // can still map timestamps back to prompts.
      const committed = [...exchanges, { question: draftQ.trim(), response: draftR.trim() }];
      setExchanges(committed);
      setDraftQ('');
      setDraftR('');
      if (committed.length < FORCED_AUTO_REVEAL_COUNT) {
        // Still inside the auto-reveal range → reveal the next question.
        setPhase('question');
        requestAnimationFrame(() => {
          if (questionInputRef.current) smoothScrollToElement(questionInputRef.current);
        });
      } else {
        // Reached the threshold — stop auto-revealing. User can either
        // press Continue to advance the section, or click "Ask more" to
        // resume the loop with another question.
        setPhase('done');
      }
      return;
    }
    if (phase === 'done') {
      advanceSection?.();
    }
  }, [phase, draftQ, draftR, exchanges, advanceSection, defaultQuestion]);

  // ── Override the section's Continue button — label always 'Continue' ──
  // We intercept onClick so the handler routes by phase. The label stays
  // constant so the user never sees an "Ask" or phase-specific button.
  useEffect(() => {
    if (!setPrimaryOverride) return undefined;
    setPrimaryOverride({ label: 'Continue', onClick: handleContinue });
    return () => setPrimaryOverride(null);
  }, [handleContinue, setPrimaryOverride]);

  // ── "Ask more" handler ──
  const handleAskMore = useCallback(() => {
    setPhase('question');
    requestAnimationFrame(() => {
      if (questionInputRef.current) smoothScrollToElement(questionInputRef.current);
    });
  }, []);

  // ── Rendered prompts (DM Serif text-base) — token-substituted ──
  const questionPromptText = block.questionPrompt
    ?? `What would you like to ask ${protectorLabel}?`;
  const responsePromptText = block.responsePrompt ?? 'What came back?';

  const resolvedQuestionPlaceholder = substituteTokensPlain(
    block.questionPlaceholder || `Write a question for ${protectorLabel}...`,
    accentTerms
  );
  const resolvedResponsePlaceholder = substituteTokensPlain(
    block.responsePlaceholder || 'Write what came back...',
    accentTerms
  );

  return (
    <div className="space-y-4" style={{ paddingBottom: '4rem' }}>
      {/* Intro lines — only above the very first question. renderContentLines
          handles `§` line spacers + `{token}` accent substitution. */}
      {exchanges.length === 0 && phase === 'question' && Array.isArray(block.introLines) && (
        renderContentLines(block.introLines, accentTerms)
      )}

      {/* Completed exchanges — static transcript above the active inputs */}
      {exchanges.length > 0 && (
        <div className="space-y-4">
          {exchanges.map((exchange, i) => (
            <div key={i} className="space-y-1">
              <p className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider">Me</p>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">{exchange.question}</p>
              <p className="text-[var(--accent)] text-[10px] uppercase tracking-wider mt-2">{protectorLabel}</p>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">{exchange.response}</p>
            </div>
          ))}
        </div>
      )}

      {/* Active question input — DM Serif prompt above */}
      {phase === 'question' && (
        <div ref={questionInputRef} className="space-y-3 animate-fade-in">
          <p
            className="text-base text-[var(--color-text-primary)]"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {renderLineWithMarkup(questionPromptText, accentTerms)}
          </p>
          <input
            type="text"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder={resolvedQuestionPlaceholder}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] text-sm
              placeholder:text-[var(--color-text-tertiary)]"
            style={{ textTransform: 'none' }}
          />
        </div>
      )}

      {/* Starter-questions expandable — only on the very first question, and
          positioned BELOW the input so it reads as a "stuck for ideas?" hint
          rather than a prompt to look at first. */}
      {exchanges.length === 0
        && phase === 'question'
        && Array.isArray(block.starterQuestions)
        && block.starterQuestions.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowStarter(!showStarter)}
            className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]
              hover:text-[var(--color-text-secondary)] transition-colors
              inline-flex items-center gap-2"
          >
            {block.starterToggleLabel || 'Example Questions'}
            {showStarter
              ? <CircleSkipIcon size={14} className="text-[var(--color-text-tertiary)]" />
              : <CirclePlusIcon size={14} className="text-[var(--color-text-tertiary)]" />}
          </button>
          <div
            className="overflow-hidden transition-all duration-300 ease-out"
            style={{ maxHeight: showStarter ? '600px' : '0', opacity: showStarter ? 1 : 0 }}
          >
            <div className="pt-3 space-y-2">
              {block.starterQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setDraftQ(q);
                    setShowStarter(false);
                  }}
                  className="block w-full text-left py-2 px-3 border border-[var(--color-border)] bg-transparent
                    text-[var(--color-text-secondary)] text-sm leading-relaxed
                    hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active response phase — current Q (static) + R input */}
      {phase === 'response' && (
        <>
          <div className="space-y-1">
            <p className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider">Me</p>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">{draftQ}</p>
          </div>
          <div ref={responseInputRef} className="space-y-3 animate-fade-in">
            <p
              className="text-base text-[var(--color-text-primary)]"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {renderLineWithMarkup(responsePromptText, accentTerms)}
            </p>
            <textarea
              value={draftR}
              onChange={(e) => setDraftR(e.target.value)}
              placeholder={resolvedResponsePlaceholder}
              rows={3}
              className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                focus:outline-none focus:border-[var(--accent)]
                text-[var(--color-text-primary)] text-sm leading-relaxed
                placeholder:text-[var(--color-text-tertiary)] resize-none"
              style={{ textTransform: 'none' }}
            />
          </div>
        </>
      )}

      {/* Ask more — only in 'done' phase. Click resumes the loop with another Q. */}
      {phase === 'done' && (
        <div className="animate-fade-in">
          <button
            type="button"
            onClick={handleAskMore}
            className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]
              hover:text-[var(--color-text-secondary)] transition-colors
              inline-flex items-center gap-2"
          >
            <CirclePlusIcon size={14} className="text-[var(--color-text-tertiary)]" />
            Ask more
          </button>
        </div>
      )}
    </div>
  );
}
