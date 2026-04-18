/**
 * TransitionModule — Orchestrator for the four session transitions.
 *
 * Lifecycle:
 *  1. Mount → TransitionOverlay in `entering` phase (content mounts beneath)
 *  2. Overlay clears → content visible, user on first section
 *  3. Active → renders current section via ScreensSection or MeditationSection
 *  4. Last section's advanceSection fires → flushCaptures → exit overlay
 *  5. Exit overlay completes → config.onComplete(store) fires, module unmounts
 *
 * Props:
 *   config: TransitionContentConfig — content config with its own onComplete
 */

import { useState, useCallback, useEffect } from 'react';
import { useSessionStore } from '../../../stores/useSessionStore';

import ModuleStatusBar, { formatTime } from '../../active/ModuleStatusBar';
import { ScreensSection, MeditationSection } from '../../active/modules/MasterModule/sectionRenderers';

import TransitionOverlay from './TransitionOverlay';
import useTransitionModuleState from './useTransitionModuleState';
import TRANSITION_CUSTOM_BLOCKS from './customBlocks';

export default function TransitionModule({ config }) {
  const state = useTransitionModuleState(config);

  // ── Overlay lifecycle: 'entering' | null | 'exiting' ─────────────────────
  const [overlayPhase, setOverlayPhase] = useState('entering');
  const [contentVisible, setContentVisible] = useState(false);

  const handleEntranceComplete = useCallback(() => {
    setOverlayPhase(null);
    setContentVisible(true);
  }, []);

  // Pull specific stable members out of state so deps don't include the whole
  // state object (which is a new reference every render and would thrash every
  // downstream useCallback/useEffect that depended on it).
  const { flushCaptures, clearActiveNavigation, handleScreenChange: stateHandleScreenChange } = state;

  const handleExitComplete = useCallback(() => {
    // Clear activeNavigation before firing completion — prevents a stale
    // resume on the next transition.
    clearActiveNavigation();
    const store = useSessionStore.getState();
    config.onComplete?.(store);
  }, [config, clearActiveNavigation]);

  // ── Auto-trigger exit overlay when the state machine completes ───────────
  useEffect(() => {
    if (state.modulePhase === 'complete' && overlayPhase !== 'exiting') {
      flushCaptures();
      setOverlayPhase('exiting');
    }
  }, [state.modulePhase, overlayPhase, flushCaptures]);

  // ── Skip handler ─────────────────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    flushCaptures();
    clearActiveNavigation();
    const store = useSessionStore.getState();
    config.onComplete?.(store);
  }, [config, flushCaptures, clearActiveNavigation]);

  // ── Progress reporting ───────────────────────────────────────────────────
  // Progress is computed by ScreensSection internally for screens sections.
  // MeditationSection reports its own timer progress. For the status bar
  // we combine visited-section progress with screen fraction.
  const [screenProgress, setScreenProgress] = useState({ position: 0, total: 0 });
  const [timerProgress, setTimerProgress] = useState(null);   // only for meditation sections

  const handleScreenChange = useCallback((position, total) => {
    // Guard against same-value updates — ScreensSection's onScreenChange effect
    // fires on every render, not just real screen changes. Without this guard,
    // a new object literal every call would cause infinite re-renders.
    setScreenProgress((prev) =>
      prev.position === position && prev.total === total ? prev : { position, total }
    );
    stateHandleScreenChange(position, total);
  }, [stateHandleScreenChange]);

  const sections = config.sections || [];
  const currentSection = state.currentSection;

  // Cumulative visited-section progress (identical formula to MasterModule)
  const progressPercent = (() => {
    if (state.modulePhase === 'complete') return 100;
    if (!currentSection) return 0;
    const currentId = currentSection.id;
    const visitedCount = state.visitedSections.length;
    const unvisitedRemaining = sections
      .filter((s) => s.id !== currentId && !state.visitedSections.includes(s.id)).length;
    const expectedTotal = visitedCount + 1 + unvisitedRemaining;
    const sectionBase = visitedCount / expectedTotal;
    const sectionWeight = 1 / expectedTotal;

    if (currentSection.type === 'screens' && screenProgress.total > 0) {
      const screenFraction = screenProgress.position / screenProgress.total;
      return (sectionBase + sectionWeight * screenFraction) * 100;
    }
    if (currentSection.type === 'meditation' && timerProgress) {
      const frac = timerProgress.elapsed / (timerProgress.total || 1);
      return (sectionBase + sectionWeight * Math.min(1, frac)) * 100;
    }
    return sectionBase * 100;
  })();

  // ── Session elapsed time ─────────────────────────────────────────────────
  const ingestionTime = useSessionStore((s) => s.substanceChecklist.ingestionTime);
  const [sessionElapsed, setSessionElapsed] = useState('0:00');
  useEffect(() => {
    if (!ingestionTime) return;
    const update = () => {
      const secs = Math.floor((Date.now() - ingestionTime) / 1000);
      setSessionElapsed(formatTime(secs));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [ingestionTime]);

  // ── Status bar configuration from config ─────────────────────────────────
  const statusBarCfg = config.statusBar || {};
  const perSectionLabel = currentSection?.statusLabel;
  const leftLabel = perSectionLabel || statusBarCfg.leftLabel || 'Transition';
  const showSessionElapsed = statusBarCfg.showSessionElapsed !== false;

  // ── Render ───────────────────────────────────────────────────────────────
  const renderCurrentSection = () => {
    if (!currentSection) return null;
    if (state.modulePhase === 'complete') return null;

    switch (currentSection.type) {
      case 'screens':
        return (
          <ScreensSection
            key={currentSection.id}
            section={{ ...currentSection, screens: state.currentSectionScreens }}
            accentTerms={config.accentTerms || {}}
            moduleTitle={config.id}
            responses={state.responses}
            selectorValues={state.selectorValues}
            selectorJournals={state.selectorJournals}
            choiceValues={state.choiceValues}
            visitedSections={state.visitedSections}
            allBlocksWithPromptIndex={state.allBlocksWithPromptIndex}
            onSetPromptResponse={state.setPromptResponse}
            onToggleSelector={state.toggleSelector}
            onSetSelectorJournal={state.setSelectorJournal}
            onChoiceSelect={state.setChoiceValue}
            onSectionComplete={state.advanceSection}
            onSkip={config.skip?.allowed !== false ? handleSkip : undefined}
            canGoBackToPreviewSection={state.canGoBackToPreviousSection}
            onBackToPreviousSection={state.goBackToPreviousSection}
            onRouteToSection={state.routeToSection}
            onScreenChange={handleScreenChange}
            // Transition-module extensions
            customBlockRegistry={TRANSITION_CUSTOM_BLOCKS}
            sessionData={state.sessionData}
            storeState={state.storeState}
            skipEnabled={config.skip?.allowed !== false}
            skipConfirmMessage={config.skip?.confirmMessage || 'Skip the transition?'}
          />
        );

      case 'meditation':
        return (
          <MeditationSection
            key={currentSection.id}
            section={currentSection}
            module={{ instanceId: `transition-${config.id}-${currentSection.id}`, title: currentSection.title }}
            onSectionComplete={state.advanceSection}
            onSkip={state.advanceSection}
            onProgressUpdate={(mode, elapsed, total) => {
              if (mode === 'timer') setTimerProgress({ elapsed, total });
            }}
          />
        );

      default:
        // Unknown section type — skip past it
        state.advanceSection();
        return null;
    }
  };

  return (
    <>
      {/* Entrance overlay — mounts first, then content fades in beneath */}
      {overlayPhase === 'entering' && (
        <TransitionOverlay
          animation={config.animation}
          phase="entering"
          onComplete={handleEntranceComplete}
        />
      )}

      {/* Exit overlay — mounts when state machine completes */}
      {overlayPhase === 'exiting' && (
        <TransitionOverlay
          animation={config.animation}
          phase="exiting"
          onComplete={handleExitComplete}
        />
      )}

      {/* Main content — status bar + current section */}
      <div
        className="transition-opacity duration-500"
        style={{ opacity: contentVisible && overlayPhase !== 'exiting' ? 1 : 0 }}
      >
        <ModuleStatusBar
          progress={progressPercent}
          leftLabel={leftLabel}
          centerContent={
            showSessionElapsed && ingestionTime ? (
              <span className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider whitespace-nowrap">
                {sessionElapsed}
              </span>
            ) : null
          }
        />

        <div
          className="fixed left-0 right-0 flex flex-col overflow-hidden"
          style={{ top: 'var(--header-plus-status)', bottom: 'var(--tabbar-height)' }}
        >
          {/* Keyed wrapper — remounts on section change, triggering the
              animate-fadeIn CSS keyframe. Gives each section a smooth entrance
              regardless of whether we're going screens→meditation or vice versa. */}
          <div
            key={currentSection?.id || 'empty'}
            className="flex-1 overflow-auto animate-fadeIn"
          >
            {renderCurrentSection()}
          </div>
        </div>
      </div>
    </>
  );
}
