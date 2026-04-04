/**
 * FollowUpValuesCompass Component
 * Values Compass follow-up module — revisit ACT Matrix with fresh eyes
 *
 * Flow (9 screens):
 * 1. Welcome — intro text
 * 2. Matrix Revisit — view/edit matrix, textarea reflection
 * 3. Noticing Away — FocusedMatrixSchematic left, textarea
 * 4. Noticing Toward — FocusedMatrixSchematic right, textarea
 * 5. Stuck Loop Check-In — FocusedMatrixSchematic left + LoopArrowAnimation, textarea
 * 6. Toward Move Status — display journal-e, single-select status, conditional textarea
 * 7. Time Spent — MatrixSchematic, selector + optional textarea
 * 8. Message Resurface — display journal-h, textarea (skip if empty)
 * 9. Closing — CompassAnimation, complete
 */

import { useState, useCallback } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';

import ModuleControlBar, { SlotButton } from '../active/capabilities/ModuleControlBar';
import ModuleStatusBar from '../active/ModuleStatusBar';
import CompassAnimation from '../active/capabilities/animations/CompassV2';
import { TransitionTextarea } from '../session/transitions/shared';

import MatrixModal, { ViewMatrixIcon } from '../active/modules/shared/matrix/MatrixModal';
import { MatrixSchematic, FocusedMatrixSchematic } from '../active/modules/shared/matrix/MatrixSchematics';
import LoopArrowAnimation from '../active/modules/shared/matrix/LoopArrowAnimation';
import { exportMatrixAsPNG } from '../active/modules/shared/matrix/exportMatrixAsPNG';
import { saveImage } from '../../utils/imageStorage';

import {
  VALUES_COMPASS_FOLLOWUP_STEPS,
  TOWARD_MOVE_STATUSES,
  TOWARD_MOVE_RESPONSES,
  TIME_SPENT_OPTIONS,
  TIME_SPENT_RESPONSES,
} from './content/followUpContent';

const FADE_MS = 400;

// Steps where the compass animation appears
const COMPASS_STEPS = new Set(['welcome', 'closing']);

export default function FollowUpValuesCompass() {
  // Determine if message screen should be skipped
  const transitionCaptures = useSessionStore((state) => state.transitionCaptures);
  const journalMessageFromHere = transitionCaptures?.valuesCompass?.journalMessageFromHere || '';
  const journalTowardMove = transitionCaptures?.valuesCompass?.journalTowardMove || '';
  const sessionQuadrants = transitionCaptures?.valuesCompass?.quadrants || { q1: [], q2: [], q3: [], q4: [] };

  const hasMessage = !!journalMessageFromHere.trim();

  // Build the active steps list (skip message-resurface if no message)
  const steps = hasMessage
    ? VALUES_COMPASS_FOLLOWUP_STEPS
    : VALUES_COMPASS_FOLLOWUP_STEPS.filter((s) => s.id !== 'message-resurface');

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [_stepHistory, setStepHistory] = useState([0]);

  // Local state for captures
  const [matrixRevisit, setMatrixRevisit] = useState('');
  const [noticingAway, setNoticingAway] = useState('');
  const [noticingToward, setNoticingToward] = useState('');
  const [stuckLoopCheckin, setStuckLoopCheckin] = useState('');
  const [towardMoveSelection, setTowardMoveSelection] = useState(null);
  const [towardMoveResponse, setTowardMoveResponse] = useState('');
  const [timeSpentSelection, setTimeSpentSelection] = useState(null);
  const [timeSpentResponse, setTimeSpentResponse] = useState('');
  const [messageResponse, setMessageResponse] = useState('');

  // Matrix state
  const [editedQuadrants, setEditedQuadrants] = useState(null);
  const [showMatrix, setShowMatrix] = useState(false);
  const [matrixClosing, setMatrixClosing] = useState(false);

  // Stuck loop animation toggle
  const [showLoopAnimation, setShowLoopAnimation] = useState(true);

  // Store selectors
  const completeFollowUpModule = useSessionStore((state) => state.completeFollowUpModule);
  const exitFollowUpModule = useSessionStore((state) => state.exitFollowUpModule);
  const updateFollowUpModule = useSessionStore((state) => state.updateFollowUpModule);
  const addEntry = useJournalStore((state) => state.addEntry);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const totalSteps = steps.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  // The quadrants to display — edited version if user modified, otherwise session original
  const displayQuadrants = editedQuadrants || sessionQuadrants;

  // Matrix modal handlers
  const handleOpenMatrix = useCallback(() => {
    setShowMatrix(true);
  }, []);

  const handleCloseMatrix = useCallback(() => {
    setMatrixClosing(true);
    setTimeout(() => {
      setShowMatrix(false);
      setMatrixClosing(false);
    }, FADE_MS);
  }, []);

  const handleUpdateChipPosition = useCallback((quadrantId, chipId, x, y) => {
    setEditedQuadrants((prev) => {
      const base = prev || { ...sessionQuadrants };
      const quadrant = base[quadrantId] || [];
      return {
        ...base,
        [quadrantId]: quadrant.map((chip) =>
          chip.id === chipId ? { ...chip, x, y } : chip
        ),
      };
    });
  }, [sessionQuadrants]);

  // Fade to a specific step
  const fadeToStep = useCallback((targetIndex) => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentStepIndex(targetIndex);
      setStepHistory((history) => [...history, targetIndex]);
      setIsVisible(true);
    }, FADE_MS);
  }, []);

  // Save captures and create journal entry
  const saveCaptures = useCallback(async () => {
    const towardLabel = TOWARD_MOVE_STATUSES.find((s) => s.value === towardMoveSelection)?.label || towardMoveSelection;
    const timeLabel = TIME_SPENT_OPTIONS.find((s) => s.value === timeSpentSelection)?.label || timeSpentSelection;

    let journalContent = 'FOLLOW-UP: VALUES COMPASS\n';

    if (matrixRevisit.trim()) {
      journalContent += `\nMatrix revisit:\n${matrixRevisit}\n`;
    }
    if (noticingAway.trim()) {
      journalContent += `\nAway move noticed:\n${noticingAway}\n`;
    }
    if (noticingToward.trim()) {
      journalContent += `\nToward move noticed:\n${noticingToward}\n`;
    }
    if (stuckLoopCheckin.trim()) {
      journalContent += `\nThe loop:\n${stuckLoopCheckin}\n`;
    }
    if (towardMoveSelection) {
      journalContent += `\nToward move status: ${towardLabel}\n`;
      if (towardMoveResponse.trim()) {
        journalContent += `${towardMoveResponse}\n`;
      }
    }
    if (timeSpentSelection) {
      journalContent += `\nTime balance: ${timeLabel}\n`;
      if (timeSpentResponse.trim()) {
        journalContent += `${timeSpentResponse}\n`;
      }
    }
    if (messageResponse.trim()) {
      journalContent += `\nReading my message:\n${messageResponse}\n`;
    }

    const entryConfig = {
      content: journalContent.trim(),
      source: 'session',
      moduleTitle: 'Follow-Up Values Compass',
      tags: ['followup-values-compass'],
    };

    // If user edited the matrix, export as PNG and save image
    if (editedQuadrants) {
      try {
        const blob = await exportMatrixAsPNG(editedQuadrants);
        const entryId = addEntry({ ...entryConfig, hasImage: true });
        if (entryId && blob) {
          await saveImage(entryId, blob);
        }
      } catch {
        // If PNG export fails, still save text entry
        addEntry(entryConfig);
      }
    } else {
      addEntry(entryConfig);
    }

    // Complete the module
    completeFollowUpModule('valuesCompassFollowUp', {
      matrixEdited: !!editedQuadrants,
      editedQuadrants: editedQuadrants || null,
      matrixRevisit: matrixRevisit.trim() || null,
      noticingAway: noticingAway.trim() || null,
      noticingToward: noticingToward.trim() || null,
      stuckLoopCheckin: stuckLoopCheckin.trim() || null,
      towardMoveStatus: { selection: towardMoveSelection, response: towardMoveResponse.trim() || null },
      timeSpent: { selection: timeSpentSelection, response: timeSpentResponse.trim() || null },
      messageResponse: messageResponse.trim() || null,
    });
  }, [
    matrixRevisit, noticingAway, noticingToward, stuckLoopCheckin,
    towardMoveSelection, towardMoveResponse, timeSpentSelection, timeSpentResponse,
    messageResponse, editedQuadrants, addEntry, completeFollowUpModule,
  ]);

  // Persist progress for resume
  const persistProgress = useCallback((stepIndex) => {
    updateFollowUpModule('valuesCompassFollowUp', {
      currentScreen: stepIndex,
      matrixRevisit: matrixRevisit.trim() || null,
      noticingAway: noticingAway.trim() || null,
      noticingToward: noticingToward.trim() || null,
      stuckLoopCheckin: stuckLoopCheckin.trim() || null,
      towardMoveStatus: { selection: towardMoveSelection, response: towardMoveResponse.trim() || null },
      timeSpent: { selection: timeSpentSelection, response: timeSpentResponse.trim() || null },
      messageResponse: messageResponse.trim() || null,
      matrixEdited: !!editedQuadrants,
      editedQuadrants: editedQuadrants || null,
    });
  }, [
    updateFollowUpModule, matrixRevisit, noticingAway, noticingToward, stuckLoopCheckin,
    towardMoveSelection, towardMoveResponse, timeSpentSelection, timeSpentResponse,
    messageResponse, editedQuadrants,
  ]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      saveCaptures();
      return;
    }

    const nextIndex = currentStepIndex + 1;
    persistProgress(nextIndex);
    fadeToStep(nextIndex);
  }, [isLastStep, currentStepIndex, saveCaptures, persistProgress, fadeToStep]);

  const handleBack = useCallback(() => {
    if (currentStepIndex === 0) {
      exitFollowUpModule();
      return;
    }

    setIsVisible(false);
    setTimeout(() => {
      setStepHistory((history) => {
        if (history.length <= 1) return history;
        const newHistory = history.slice(0, -1);
        setCurrentStepIndex(newHistory[newHistory.length - 1]);
        return newHistory;
      });
      setIsVisible(true);
    }, FADE_MS);
  }, [currentStepIndex, exitFollowUpModule]);

  // Render content based on step
  const renderContent = () => {
    const { content } = currentStep;

    // Screen 1: Welcome
    if (currentStep.id === 'welcome') {
      return (
        <div className="text-center space-y-4 animate-fadeIn">
          <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
            {content.title}
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {content.body}
          </p>
        </div>
      );
    }

    // Screen 2: Matrix Revisit
    if (currentStep.id === 'matrix-revisit') {
      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
          </div>

          {/* Tap to view matrix */}
          <button
            type="button"
            onClick={handleOpenMatrix}
            className="w-full py-4 border border-[var(--color-border)] rounded text-center hover:border-[var(--color-text-tertiary)] transition-colors"
          >
            <span className="text-[var(--color-text-secondary)] text-sm">
              View Your Matrix
            </span>
            {editedQuadrants && (
              <span className="block text-[var(--color-text-tertiary)] text-xs mt-1">
                (edited)
              </span>
            )}
          </button>

          <TransitionTextarea
            value={matrixRevisit}
            onChange={setMatrixRevisit}
            placeholder={content.placeholder}
            large
          />
        </div>
      );
    }

    // Screen 3: Noticing Away
    if (currentStep.id === 'noticing-away') {
      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
          </div>

          <div className="flex justify-center py-2">
            <FocusedMatrixSchematic side="left" quadrants={displayQuadrants} />
          </div>

          <TransitionTextarea
            value={noticingAway}
            onChange={setNoticingAway}
            placeholder={content.placeholder}
          />
        </div>
      );
    }

    // Screen 4: Noticing Toward
    if (currentStep.id === 'noticing-toward') {
      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
          </div>

          <div className="flex justify-center py-2">
            <FocusedMatrixSchematic side="right" quadrants={displayQuadrants} />
          </div>

          <TransitionTextarea
            value={noticingToward}
            onChange={setNoticingToward}
            placeholder={content.placeholder}
          />
        </div>
      );
    }

    // Screen 5: Stuck Loop Check-In
    if (currentStep.id === 'stuck-loop-checkin') {
      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
          </div>

          <div className="relative flex justify-center py-2">
            <FocusedMatrixSchematic side="left" quadrants={displayQuadrants} />
            <LoopArrowAnimation side="left" visible={showLoopAnimation} />
          </div>

          <TransitionTextarea
            value={stuckLoopCheckin}
            onChange={setStuckLoopCheckin}
            placeholder={content.placeholder}
          />
        </div>
      );
    }

    // Screen 6: Toward Move Status
    if (currentStep.id === 'toward-move-status') {
      const response = towardMoveSelection ? TOWARD_MOVE_RESPONSES[towardMoveSelection] : null;

      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
          </div>

          {journalTowardMove && (
            <blockquote className="text-[var(--color-text-primary)] text-sm leading-relaxed italic border-l-2 border-[var(--color-text-tertiary)] pl-4">
              &ldquo;{journalTowardMove}&rdquo;
            </blockquote>
          )}

          <div className="space-y-2">
            {TOWARD_MOVE_STATUSES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setTowardMoveSelection(option.value);
                  setTowardMoveResponse('');
                }}
                className={`w-full py-3 px-4 border text-left text-sm transition-colors ${
                  towardMoveSelection === option.value
                    ? 'border-[var(--color-text-primary)] text-[var(--color-text-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {response && (
            <div className="space-y-4">
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed text-center">
                {response.text}
              </p>
              {response.hasInput && (
                <TransitionTextarea
                  value={towardMoveResponse}
                  onChange={setTowardMoveResponse}
                  placeholder={response.placeholder}
                />
              )}
            </div>
          )}
        </div>
      );
    }

    // Screen 7: Time Spent
    if (currentStep.id === 'time-spent') {
      const response = timeSpentSelection ? TIME_SPENT_RESPONSES[timeSpentSelection] : null;

      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
          </div>

          <div className="flex justify-center py-4">
            <MatrixSchematic maxWidth="max-w-[200px]" />
          </div>

          <div className="space-y-2">
            {TIME_SPENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setTimeSpentSelection(option.value);
                  setTimeSpentResponse('');
                }}
                className={`w-full py-3 px-4 border text-left text-sm transition-colors ${
                  timeSpentSelection === option.value
                    ? 'border-[var(--color-text-primary)] text-[var(--color-text-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {response && (
            <div className="space-y-4">
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed text-center">
                {response.text}
              </p>
              {response.hasInput && (
                <TransitionTextarea
                  value={timeSpentResponse}
                  onChange={setTimeSpentResponse}
                  placeholder={response.placeholder}
                />
              )}
            </div>
          )}
        </div>
      );
    }

    // Screen 8: Message Resurface
    if (currentStep.id === 'message-resurface') {
      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
          </div>

          <blockquote className="text-[var(--color-text-primary)] text-sm leading-relaxed italic border-l-2 border-[var(--accent)] pl-4 py-2">
            &ldquo;{journalMessageFromHere}&rdquo;
          </blockquote>

          <TransitionTextarea
            value={messageResponse}
            onChange={setMessageResponse}
            placeholder={content.placeholder}
          />
        </div>
      );
    }

    // Screen 9: Closing
    if (currentStep.id === 'closing') {
      return (
        <div className="text-center space-y-6 animate-fadeIn">
          <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {content.body}
          </p>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {content.bodySecondary}
          </p>
        </div>
      );
    }

    return null;
  };

  // Primary button config
  const getPrimaryButton = () => {
    if (isLastStep) {
      return { label: 'Complete', onClick: handleNext };
    }
    return { label: 'Continue', onClick: handleNext };
  };

  // Determine which screens get skip buttons
  const hasTextInput = ['matrix-revisit', 'noticing-away', 'noticing-toward', 'stuck-loop-checkin', 'message-resurface'].includes(currentStep.id);
  const hasSelector = ['toward-move-status', 'time-spent'].includes(currentStep.id);
  const showSkip = hasTextInput || hasSelector;

  // Loop animation toggle for stuck-loop screen
  const getLeftSlot = () => {
    if (currentStep.id === 'stuck-loop-checkin') {
      return (
        <SlotButton
          icon={
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 8 C4 5, 8 3, 11 5 M11 5 L9 4 M11 5 L10 7" />
              <path d="M12 8 C12 11, 8 13, 5 11 M5 11 L7 12 M5 11 L6 9" />
            </svg>
          }
          label="Loop"
          onClick={() => setShowLoopAnimation((v) => !v)}
          active={showLoopAnimation}
        />
      );
    }
    return null;
  };

  // Matrix view button for matrix-revisit screen
  const getRightSlot = () => {
    if (currentStep.id === 'matrix-revisit') {
      return (
        <SlotButton
          icon={<ViewMatrixIcon />}
          label="Matrix"
          onClick={handleOpenMatrix}
        />
      );
    }
    return null;
  };

  return (
    <>
      <ModuleStatusBar
        progress={progress}
        leftLabel={currentStep.content.label}
      />

      <div className="fixed left-0 right-0 flex flex-col overflow-hidden" style={{ top: 'var(--header-plus-status)', bottom: 'var(--tabbar-height)' }}>
        {COMPASS_STEPS.has(currentStep.id) && (
          <div className="flex-shrink-0 pt-2 pb-1">
            <div className="flex justify-center">
              <CompassAnimation size={80} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto px-6">
          <div
            className={`w-full max-w-md mx-auto transition-opacity duration-[400ms] pb-24 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {renderContent()}
          </div>
        </div>
      </div>

      <ModuleControlBar
        phase={isLastStep ? 'completed' : 'active'}
        primary={getPrimaryButton()}
        showBack={true}
        onBack={handleBack}
        backConfirmMessage={currentStepIndex === 0 ? 'Exit the Values Compass follow-up?' : null}
        showSkip={showSkip}
        onSkip={handleNext}
        skipConfirmMessage={null}
        leftSlot={getLeftSlot()}
        rightSlot={getRightSlot()}
      />

      {/* Matrix modal for view/edit */}
      <MatrixModal
        isOpen={showMatrix}
        closing={matrixClosing}
        onClose={handleCloseMatrix}
        quadrants={displayQuadrants}
        onUpdateChipPosition={handleUpdateChipPosition}
      />
    </>
  );
}
