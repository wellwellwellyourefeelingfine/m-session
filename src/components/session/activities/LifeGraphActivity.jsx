/**
 * LifeGraphActivity Component
 *
 * A pre-session flow where users chart life milestones against a
 * 0-10 well-being scale and see the results visualized as a life graph PNG.
 *
 * Base flow: welcome → guided entry → open entry → review & generate →
 * reflection → check-in → closing.
 *
 * Optional "go deeper" branch (from check-in): 3 guided journaling pages
 * inserted before closing. Responses saved as a single combined journal entry.
 *
 * Follows IntentionSettingActivity pattern for step navigation.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useJournalStore } from '../../../stores/useJournalStore';
import {
  BASE_STEP_COUNT,
  LIFE_GRAPH_STEPS,
  JOURNAL_BRANCH_STEPS,
  RATING_ANCHORS,
  MILESTONE_SOFT_MAX,
} from './lifeGraphContent';
import { exportLifeGraphAsPNG } from './exportLifeGraphAsPNG';
import { saveImage } from '../../../utils/imageStorage';

import ModuleLayout from '../../active/capabilities/ModuleLayout';
import ModuleControlBar, { SlotButton } from '../../active/capabilities/ModuleControlBar';
import useProgressReporter from '../../../hooks/useProgressReporter';
import RevealOverlay from '../../active/capabilities/animations/RevealOverlay';
import LeafDrawV2 from '../../active/capabilities/animations/LeafDrawV2';
import LifeGraphModal from './LifeGraphModal';

const FADE_MS = 400;

// ─── ViewGraphIcon ──────────────────────────────────────────────────────────

function ViewGraphIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="1" y1="14" x2="1" y2="2" />
      <line x1="1" y1="14" x2="14" y2="14" />
      <polyline points="3,10 6,5 9,8 12,3" />
    </svg>
  );
}

// ─── RatingDots ─────────────────────────────────────────────────────────────

function RatingDots({ value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-1">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(value === i ? null : i)}
            className={`w-8 h-8 rounded-full border-2 transition-colors flex items-center justify-center text-[10px] ${
              value === i
                ? 'bg-[var(--color-text-primary)] border-[var(--color-text-primary)] text-[var(--color-bg)]'
                : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-tertiary)]'
            }`}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
          {RATING_ANCHORS.low}
        </span>
        <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
          {RATING_ANCHORS.high}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function LifeGraphActivity({ _module, onComplete, onSkip, onProgressUpdate }) {
  // ── Stores ──
  const milestones = useSessionStore((s) => s.lifeGraph.milestones);
  const addLifeGraphMilestone = useSessionStore((s) => s.addLifeGraphMilestone);
  const updateLifeGraphMilestone = useSessionStore((s) => s.updateLifeGraphMilestone);
  const removeLifeGraphMilestone = useSessionStore((s) => s.removeLifeGraphMilestone);
  const setLifeGraphGenerated = useSessionStore((s) => s.setLifeGraphGenerated);
  const completePreSubstanceActivity = useSessionStore((s) => s.completePreSubstanceActivity);
  const sessionId = useSessionStore((s) => s.sessionId);
  const addEntry = useJournalStore((s) => s.addEntry);

  // ── Progress reporting ──
  const report = useProgressReporter(onProgressUpdate);

  // ── Step navigation ──
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // ── Guided entry form state ──
  const [guidedLabel, setGuidedLabel] = useState('');
  const [guidedRating, setGuidedRating] = useState(null);
  const [guidedNote, setGuidedNote] = useState('');

  // ── Cycling placeholder for guided entry ──
  const [exampleIndex, setExampleIndex] = useState(0);
  const [exampleVisible, setExampleVisible] = useState(true);

  // ── Open entry form state ──
  const [entryLabel, setEntryLabel] = useState('');
  const [entryRating, setEntryRating] = useState(null);
  const [entryNote, setEntryNote] = useState('');

  // ── Editing ──
  const [editingMilestoneId, setEditingMilestoneId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editRating, setEditRating] = useState(null);
  const [editNote, setEditNote] = useState('');

  // ── Graph ──
  const [graphBlob, setGraphBlob] = useState(null);
  const [graphUrl, setGraphUrl] = useState(null);
  const [showRevealOverlay, setShowRevealOverlay] = useState(false);
  const [revealKey, setRevealKey] = useState(0);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [graphModalClosing, setGraphModalClosing] = useState(false);

  // ── Journal branch state ──
  const [deepenBranch, setDeepenBranch] = useState(false);
  const [journalResponses, setJournalResponses] = useState({});

  // ── Combined open entry + generate state ──
  const [isDone, setIsDone] = useState(false);
  const [showGenerateButton, setShowGenerateButton] = useState(false);

  // Delayed reveal of generate button after isDone transition
  useEffect(() => {
    if (isDone) {
      const timer = setTimeout(() => setShowGenerateButton(true), 800);
      return () => clearTimeout(timer);
    } else {
      setShowGenerateButton(false);
    }
  }, [isDone]);

  const graphModalTimerRef = useRef(null);
  const advanceTimerRef = useRef(null);

  // Clean up object URL when it changes or on unmount
  useEffect(() => {
    return () => {
      if (graphUrl) URL.revokeObjectURL(graphUrl);
    };
  }, [graphUrl]);

  // Clean up timers on unmount only
  useEffect(() => {
    return () => {
      if (graphModalTimerRef.current) clearTimeout(graphModalTimerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  // ── Cycling placeholder effect ──
  useEffect(() => {
    const step = LIFE_GRAPH_STEPS[currentStepIndex];
    if (step?.type !== 'guidedEntry') return;
    if (guidedLabel) return; // stop cycling once user types

    const examples = step.content.examples || [];
    if (examples.length === 0) return;

    setExampleIndex(0);
    setExampleVisible(true);

    const timer = setInterval(() => {
      setExampleVisible(false);
      setTimeout(() => {
        setExampleIndex((prev) => (prev + 1) % examples.length);
        setExampleVisible(true);
      }, 400);
    }, 3000);

    return () => clearInterval(timer);
  }, [currentStepIndex, guidedLabel]);

  // ── Dynamic step assembly ──
  const steps = useMemo(() => {
    if (deepenBranch) {
      const closingIndex = LIFE_GRAPH_STEPS.findIndex((s) => s.id === 'closing');
      return [
        ...LIFE_GRAPH_STEPS.slice(0, closingIndex),
        ...JOURNAL_BRANCH_STEPS,
        LIFE_GRAPH_STEPS[closingIndex],
      ];
    }
    return LIFE_GRAPH_STEPS;
  }, [deepenBranch]);

  const totalSteps = steps.length;

  // ── Derived ──
  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === totalSteps - 1;
  const progressSteps = deepenBranch ? totalSteps : BASE_STEP_COUNT;
  const progress = ((currentStepIndex + 1) / progressSteps) * 100;

  // ── Report step progress to parent status bar ──
  useEffect(() => {
    report.step(currentStepIndex + 1, progressSteps);
  }, [currentStepIndex, progressSteps, report]);

  // ── Step navigation helpers ──
  const advanceStep = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
      setIsVisible(true);
      document.querySelector('main')?.scrollTo(0, 0);
    }, FADE_MS);
  }, []);

  const goBack = useCallback(() => {
    if (currentStepIndex === 0) return;
    setIsVisible(false);
    setTimeout(() => {
      setCurrentStepIndex((prev) => Math.max(0, prev - 1));
      setIsVisible(true);
      document.querySelector('main')?.scrollTo(0, 0);
    }, FADE_MS);
  }, [currentStepIndex]);

  // ── Guided entry continue ──
  const handleGuidedContinue = useCallback(() => {
    if (!guidedLabel.trim() || guidedRating === null) return;
    addLifeGraphMilestone({
      label: guidedLabel.trim(),
      rating: guidedRating,
      note: guidedNote.trim(),
    });
    setGuidedLabel('');
    setGuidedRating(null);
    setGuidedNote('');
    advanceStep();
  }, [guidedLabel, guidedRating, guidedNote, addLifeGraphMilestone, advanceStep]);

  // ── Open entry: add another ──
  const handleAddEntry = useCallback(() => {
    if (!entryLabel.trim() || entryRating === null) return;
    addLifeGraphMilestone({
      label: entryLabel.trim(),
      rating: entryRating,
      note: entryNote.trim(),
    });
    setEntryLabel('');
    setEntryRating(null);
    setEntryNote('');
  }, [entryLabel, entryRating, entryNote, addLifeGraphMilestone]);

  // ── Open entry: done → show generate button ──
  const handleOpenEntryDone = useCallback(() => {
    // If there's a partially filled form, save it first
    if (entryLabel.trim() && entryRating !== null) {
      addLifeGraphMilestone({
        label: entryLabel.trim(),
        rating: entryRating,
        note: entryNote.trim(),
      });
      setEntryLabel('');
      setEntryRating(null);
      setEntryNote('');
    }
    setIsDone(true);
  }, [entryLabel, entryRating, entryNote, addLifeGraphMilestone]);

  // ── Edit milestone ──
  const startEditing = useCallback((milestone) => {
    setEditingMilestoneId(milestone.id);
    setEditLabel(milestone.label);
    setEditRating(milestone.rating);
    setEditNote(milestone.note || '');
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingMilestoneId) return;
    updateLifeGraphMilestone(editingMilestoneId, {
      label: editLabel.trim() || 'Untitled',
      rating: editRating ?? 5,
      note: editNote.trim(),
    });
    setEditingMilestoneId(null);
  }, [editingMilestoneId, editLabel, editRating, editNote, updateLifeGraphMilestone]);

  const cancelEdit = useCallback(() => {
    setEditingMilestoneId(null);
  }, []);

  const handleDeleteMilestone = useCallback((id) => {
    removeLifeGraphMilestone(id);
    if (editingMilestoneId === id) setEditingMilestoneId(null);
  }, [removeLifeGraphMilestone, editingMilestoneId]);

  // ── Generate graph + reveal sequence + save to journal ──
  const handleGenerate = useCallback(async () => {
    setRevealKey((k) => k + 1);
    setShowRevealOverlay(true);

    const startTime = Date.now();

    let blob;
    try {
      blob = await exportLifeGraphAsPNG(milestones);
      setGraphBlob(blob);
      const url = URL.createObjectURL(blob);
      if (graphUrl) URL.revokeObjectURL(graphUrl);
      setGraphUrl(url);
    } catch (err) {
      setShowRevealOverlay(false);
      console.warn('Life graph generation failed:', err);
      return;
    }

    // Save to journal immediately on generation
    const lines = ['LIFE GRAPH\n'];
    for (const m of milestones) {
      lines.push(`${m.label}: ${m.rating}/10${m.note ? ` — ${m.note}` : ''}`);
    }
    const journalContent = lines.join('\n');

    const entry = addEntry({
      content: journalContent,
      source: 'session',
      sessionId,
      moduleTitle: 'Life Graph',
      isEdited: false,
      hasImage: true,
    });

    if (entry?.id && blob) {
      try {
        await saveImage(entry.id, blob);
      } catch (err) {
        console.warn('Failed to save life graph image:', err);
      }
      setLifeGraphGenerated(entry.id);
    }

    // Wait until overlay is solidly opaque (~1800ms from start) before
    // advancing to the next page and showing the modal behind the overlay.
    // RevealOverlay fade-in takes ~830ms; 1800ms ensures ~1s of full opacity buffer.
    const elapsed = Date.now() - startTime;
    const delay = Math.max(0, 1800 - elapsed);

    advanceTimerRef.current = setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
      document.querySelector('main')?.scrollTo(0, 0);
      setShowGraphModal(true);
    }, delay);
  }, [milestones, graphUrl, addEntry, sessionId, setLifeGraphGenerated]);

  const handleRevealDone = useCallback(() => {
    setShowRevealOverlay(false);
  }, []);

  // ── Close graph modal ──
  const handleCloseGraphModal = useCallback(() => {
    setGraphModalClosing(true);
    if (graphModalTimerRef.current) clearTimeout(graphModalTimerRef.current);
    graphModalTimerRef.current = setTimeout(() => {
      setShowGraphModal(false);
      setGraphModalClosing(false);
    }, FADE_MS + 50); // small buffer to let CSS transition complete
  }, []);

  // ── Open graph modal (from SlotButton) ──
  const handleViewGraph = useCallback(() => {
    if (graphUrl) {
      setShowGraphModal(true);
      setGraphModalClosing(false);
    }
  }, [graphUrl]);

  // ── Journal branch handlers ──
  const handleDeepen = useCallback(() => {
    setDeepenBranch(true);
    advanceStep();
  }, [advanceStep]);

  const handleWrapUp = useCallback(() => {
    advanceStep();
  }, [advanceStep]);

  const updateJournalResponse = useCallback((stepId, text) => {
    setJournalResponses((prev) => ({ ...prev, [stepId]: text }));
  }, []);

  // ── Module completion ──
  const handleModuleComplete = useCallback(() => {
    // Save combined journal entry if user went through the branch
    if (deepenBranch) {
      const sections = JOURNAL_BRANCH_STEPS
        .filter((step) => journalResponses[step.id]?.trim())
        .map((step) => `${step.content.prompt}\n${journalResponses[step.id].trim()}`);

      if (sections.length > 0) {
        addEntry({
          content: `LIFE GRAPH REFLECTIONS\n\n${sections.join('\n\n')}`,
          source: 'session',
          sessionId,
          moduleTitle: 'Life Graph',
          isEdited: false,
        });
      }
    }

    completePreSubstanceActivity('life-graph');
    onComplete();
  }, [deepenBranch, journalResponses, addEntry, sessionId, completePreSubstanceActivity, onComplete]);

  // ── Skip handler (exits module) ──
  const handleModuleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  // ── Step renderers ──

  const renderWelcomeStep = () => {
    const { content } = currentStep;
    return (
      <div className="space-y-6 pb-24">
        <h2
          className="text-[var(--color-text-primary)] text-xl text-center"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          {content.title}
        </h2>
        <div className="flex justify-center">
          <LeafDrawV2 />
        </div>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.body}
        </p>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.bodySecondary}
        </p>
      </div>
    );
  };

  const renderGuidedEntryStep = () => {
    const { content } = currentStep;
    const examples = content.examples || [];
    return (
      <div className="space-y-6 pb-24">
        <h2
          className="text-[var(--color-text-primary)] text-xl text-center"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          {content.title}
        </h2>
        <div className="flex justify-center">
          <LeafDrawV2 />
        </div>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.body}
        </p>

        {/* Label input with cycling placeholder overlay */}
        <div className="relative">
          <input
            type="text"
            value={guidedLabel}
            onChange={(e) => setGuidedLabel(e.target.value)}
            maxLength={60}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)] text-[var(--color-text-primary)]
              text-sm"
            style={{ textTransform: 'none' }}
          />
          {!guidedLabel && examples.length > 0 && (
            <div className="absolute inset-0 flex items-center px-4 pointer-events-none">
              <span
                className={`text-sm transition-opacity duration-[400ms]
                  ${exampleVisible ? 'opacity-40' : 'opacity-0'}`}
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {examples[exampleIndex % examples.length]}
              </span>
            </div>
          )}
        </div>

        <RatingDots value={guidedRating} onChange={setGuidedRating} />

        <input
          type="text"
          value={guidedNote}
          onChange={(e) => setGuidedNote(e.target.value)}
          placeholder={content.notePrompt}
          maxLength={120}
          className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
            focus:outline-none focus:border-[var(--accent)] text-[var(--color-text-primary)]
            text-sm placeholder:text-[var(--color-text-tertiary)]"
          style={{ textTransform: 'none' }}
        />
      </div>
    );
  };

  const renderOpenEntryStep = () => {
    const { content } = currentStep;
    const atSoftMax = milestones.length >= MILESTONE_SOFT_MAX;

    return (
      <div className="space-y-6 pb-24">
        <h2
          className="text-[var(--color-text-primary)] text-xl text-center"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          {content.title}
        </h2>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.body}
        </p>

        {/* Existing milestones */}
        {milestones.length > 0 && (
          <div className="space-y-2">
            {milestones.map((m) => (
              <div key={m.id}>
                {editingMilestoneId === m.id ? (
                  // Edit mode
                  <div className="space-y-3 p-3 border border-[var(--accent)] bg-[var(--accent-bg)]">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      maxLength={60}
                      className="w-full py-2 px-3 border border-[var(--color-border)] bg-transparent
                        focus:outline-none focus:border-[var(--accent)] text-[var(--color-text-primary)]
                        text-sm"
                      style={{ textTransform: 'none' }}
                    />
                    <RatingDots value={editRating} onChange={setEditRating} />
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="A few words (optional)"
                      maxLength={120}
                      className="w-full py-2 px-3 border border-[var(--color-border)] bg-transparent
                        focus:outline-none focus:border-[var(--accent)] text-[var(--color-text-primary)]
                        text-sm placeholder:text-[var(--color-text-tertiary)]"
                      style={{ textTransform: 'none' }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="flex-1 py-2 text-[10px] uppercase tracking-wider
                          bg-[var(--color-text-primary)] text-[var(--color-bg)]"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 py-2 text-[10px] uppercase tracking-wider
                          border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteMilestone(m.id)}
                        className="w-8 h-8 flex items-center justify-center shrink-0
                          border border-[var(--color-border)] text-[var(--color-text-tertiary)]"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <line x1="1" y1="1" x2="9" y2="9" />
                          <line x1="9" y1="1" x2="1" y2="9" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display mode — tappable
                  <button
                    onClick={() => startEditing(m)}
                    className="w-full text-left py-3 px-4 border border-[var(--color-border)]
                      hover:border-[var(--accent)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-text-primary)] text-sm" style={{ textTransform: 'none' }}>
                        {m.label}
                      </span>
                      <span className="text-[var(--color-text-tertiary)] text-xs">
                        {m.rating}/10
                      </span>
                    </div>
                    {m.note && (
                      <p className="text-[var(--color-text-tertiary)] text-xs mt-1" style={{ textTransform: 'none' }}>
                        {m.note}
                      </p>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        {!atSoftMax && (
          <div className="space-y-4 pt-2">
            <input
              type="text"
              value={entryLabel}
              onChange={(e) => setEntryLabel(e.target.value)}
              placeholder={content.placeholder}
              maxLength={60}
              className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                focus:outline-none focus:border-[var(--accent)] text-[var(--color-text-primary)]
                text-sm placeholder:text-[var(--color-text-tertiary)]"
              style={{ textTransform: 'none' }}
            />

            {entryLabel.trim() && (
              <>
                <RatingDots value={entryRating} onChange={setEntryRating} />
                <input
                  type="text"
                  value={entryNote}
                  onChange={(e) => setEntryNote(e.target.value)}
                  placeholder={content.notePrompt}
                  maxLength={120}
                  className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                    focus:outline-none focus:border-[var(--accent)] text-[var(--color-text-primary)]
                    text-sm placeholder:text-[var(--color-text-tertiary)]"
                  style={{ textTransform: 'none' }}
                />
              </>
            )}
          </div>
        )}

        {atSoftMax && (
          <p className="text-[var(--color-text-tertiary)] text-xs text-center">
            {content.softMaxMessage}
          </p>
        )}

        {/* Inline action buttons */}
        <div className="flex flex-col gap-3 items-center pt-2">
          {!atSoftMax && entryLabel.trim() && entryRating !== null && (
            <button
              onClick={handleAddEntry}
              className={`w-full py-4 uppercase tracking-wider text-xs hover:opacity-80 transition-opacity duration-300
                ${isDone ? 'border' : ''}`}
              style={isDone ? {
                borderColor: 'var(--text-primary)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              } : {
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-primary)',
              }}
            >
              {content.addButton}
            </button>
          )}

          {/* I'm Done → Create My Life Graph cross-fade */}
          <div className="relative w-full">
            {/* I'm Done — fades out when isDone */}
            <button
              onClick={!isDone ? handleOpenEntryDone : undefined}
              className={`w-full py-4 border uppercase tracking-wider text-xs
                transition-opacity duration-[600ms] ease-in-out
                ${isDone ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              style={{
                borderColor: 'var(--text-primary)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            >
              {content.doneButton}
            </button>

            {/* Create My Life Graph — fades in after delay, accent color */}
            {isDone && milestones.length > 0 && (
              <button
                onClick={showGenerateButton ? handleGenerate : undefined}
                className={`w-full py-4 uppercase tracking-wider text-xs absolute inset-0
                  transition-opacity duration-[800ms] ease-in-out
                  ${showGenerateButton ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                }}
              >
                {content.generateButton}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderReflectionStep = () => {
    const { content } = currentStep;
    return (
      <div className="space-y-6 pb-24">
        <h2
          className="text-[var(--color-text-primary)] text-xl text-center"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          {content.title}
        </h2>
        <div className="flex justify-center">
          <LeafDrawV2 />
        </div>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.body}
        </p>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.bodySecondary}
        </p>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.bodyTertiary}
        </p>
        <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed text-center">
          (Tap the{' '}
          <svg
            width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
            className="inline-block align-[-2px]"
          >
            <line x1="1" y1="14" x2="1" y2="2" />
            <line x1="1" y1="14" x2="14" y2="14" />
            <polyline points="3,10 6,5 9,8 12,3" />
          </svg>
          {' '}icon at the bottom right to view your life graph anytime.)
        </p>
      </div>
    );
  };

  const renderCheckInStep = () => {
    const { content } = currentStep;
    return (
      <div className="space-y-6 pb-24">
        <h2
          className="text-[var(--color-text-primary)] text-xl text-center"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          {content.title}
        </h2>
        <div className="flex justify-center">
          <LeafDrawV2 />
        </div>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.body}
        </p>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.bodySecondary}
        </p>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.bodyTertiary}
        </p>
        {/* Branching buttons */}
        <div className="flex flex-col gap-3 items-center pt-2">
          <button
            onClick={handleDeepen}
            className="w-full py-4 uppercase tracking-wider text-xs"
            style={{
              backgroundColor: 'var(--color-text-primary)',
              color: 'var(--color-bg)',
            }}
          >
            {content.deepenButton}
          </button>
          <button
            onClick={handleWrapUp}
            className="w-full py-4 border uppercase tracking-wider text-xs"
            style={{
              borderColor: 'var(--color-text-primary)',
              color: 'var(--color-text-primary)',
            }}
          >
            {content.closeButton}
          </button>
        </div>
      </div>
    );
  };

  const renderJournalStep = () => {
    const { content } = currentStep;
    const stepId = currentStep.id;
    return (
      <div className="space-y-6 pb-24">
        <h2
          className="text-[var(--color-text-primary)] text-xl text-center"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          {content.title}
        </h2>
        <div className="flex justify-center">
          <LeafDrawV2 />
        </div>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.body}
        </p>
        {content.bodySecondary && (
          <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {content.bodySecondary}
          </p>
        )}
        {content.bodyTertiary && (
          <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {content.bodyTertiary}
          </p>
        )}

        {/* Journal prompt + textarea */}
        <div>
          <h3
            className="text-[var(--color-text-primary)] text-lg mb-1.5"
            style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
          >
            {content.prompt}
          </h3>
          <textarea
            value={journalResponses[stepId] || ''}
            onChange={(e) => updateJournalResponse(stepId, e.target.value)}
            placeholder={content.placeholder}
            rows={5}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)] text-[var(--color-text-primary)]
              text-sm placeholder:text-[var(--color-text-tertiary)] resize-none leading-relaxed"
            style={{ textTransform: 'none' }}
          />
        </div>
      </div>
    );
  };

  const renderClosingStep = () => {
    const { content } = currentStep;
    return (
      <div className="space-y-6 pb-24">
        <h2
          className="text-[var(--color-text-primary)] text-xl text-center"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          {content.title}
        </h2>
        <div className="flex justify-center">
          <LeafDrawV2 />
        </div>
        {deepenBranch ? (
          <>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {content.bodyDeepened}
            </p>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {content.bodyDeepenedSecondary}
            </p>
          </>
        ) : (
          <>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {content.body}
            </p>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {content.bodySecondary}
            </p>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {content.bodyTertiary}
            </p>
          </>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep.type) {
      case 'welcome': return renderWelcomeStep();
      case 'guidedEntry': return renderGuidedEntryStep();
      case 'openEntry': return renderOpenEntryStep();
      case 'reflection': return renderReflectionStep();
      case 'checkIn': return renderCheckInStep();
      case 'journal': return renderJournalStep();
      case 'closing': return renderClosingStep();
      default: return null;
    }
  };

  // ── Control bar configuration ──

  const getPrimaryConfig = () => {
    switch (currentStep.type) {
      case 'welcome':
        return { label: 'Continue', onClick: advanceStep };

      case 'guidedEntry':
        return (guidedLabel.trim() && guidedRating !== null)
          ? { label: 'Continue', onClick: handleGuidedContinue }
          : null;

      case 'openEntry':
        // Inline buttons handle this
        return null;

      case 'reflection':
        return { label: 'Continue', onClick: advanceStep };

      case 'checkIn':
        // Inline buttons handle this
        return null;

      case 'journal':
        return { label: 'Continue', onClick: advanceStep };

      case 'closing':
        return {
          label: 'Complete',
          onClick: () => {
            setIsVisible(false);
            setTimeout(() => handleModuleComplete(), FADE_MS);
          },
        };

      default:
        return { label: 'Continue', onClick: advanceStep };
    }
  };

  const getShowBack = () => {
    return currentStepIndex > 0;
  };

  const handleBack = useCallback(() => {
    // If editing, cancel edit first
    if (editingMilestoneId) {
      cancelEdit();
      return;
    }
    goBack();
  }, [editingMilestoneId, cancelEdit, goBack]);

  const getShowSkip = () => {
    if (isLastStep) return false;
    return true;
  };

  // Contextual skip: guided entries advance, others exit module
  const getSkipHandler = () => {
    switch (currentStep.type) {
      case 'guidedEntry':
        return advanceStep;
      default:
        return handleModuleSkip;
    }
  };

  const getSkipConfirmMessage = () => {
    switch (currentStep.type) {
      case 'guidedEntry':
        return null; // no confirmation for skipping forward
      default:
        return 'Exit life graph?';
    }
  };

  const getRightSlot = () => {
    if (graphUrl) {
      return (
        <SlotButton
          icon={<ViewGraphIcon />}
          label="View graph"
          onClick={handleViewGraph}
        />
      );
    }
    return null;
  };

  // ── Render ──

  return (
    <>
      <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
        <div className={`pt-6 transition-opacity duration-[400ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div key={currentStepIndex} className="animate-fadeIn">
            {renderStepContent()}
          </div>
        </div>
      </ModuleLayout>

      <ModuleControlBar
        phase={isLastStep ? 'completed' : 'active'}
        primary={getPrimaryConfig()}
        showBack={getShowBack()}
        onBack={handleBack}
        backConfirmMessage={currentStepIndex === 0 ? "Exit life graph? Your progress won't be saved." : null}
        showSkip={getShowSkip()}
        onSkip={getSkipHandler()}
        skipConfirmMessage={getSkipConfirmMessage()}
        rightSlot={getRightSlot()}
      />

      {/* Reveal overlay */}
      <RevealOverlay
        key={revealKey}
        isActive={showRevealOverlay}
        onDone={handleRevealDone}
      />

      {/* Graph modal */}
      <LifeGraphModal
        isOpen={showGraphModal}
        closing={graphModalClosing}
        onClose={handleCloseGraphModal}
        graphUrl={graphUrl}
        graphBlob={graphBlob}
      />
    </>
  );
}
