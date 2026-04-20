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
import { useAppStore } from '../../../stores/useAppStore';

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
  const {
    flushCaptures,
    clearActiveNavigation,
    handleScreenChange: stateHandleScreenChange,
    routeStack,
    advanceSection,
  } = state;

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
  // Context-aware:
  //   - In a bookmark-routed detour (routeStack has entries): advance the
  //     section so the bookmark pops and the user returns to the gate. Skip
  //     means "abandon this detour activity," not "abandon the whole transition."
  //   - In main flow (no bookmark): end the entire transition — this is the
  //     "skip the whole ritual" escape hatch for users who want to jump ahead.
  //     Gated by `config.skip.requireVisited` if set.
  const skipRequireVisited = config.skip?.requireVisited;
  const skipRequirementMet = !skipRequireVisited
    || state.visitedSections.includes(skipRequireVisited);

  const handleSkip = useCallback(() => {
    flushCaptures();

    if (routeStack.length > 0) {
      advanceSection();
      return;
    }

    // Defense in depth: if a gate is configured but unmet, block silently.
    // The UI should already hide Skip in this case (see skipEnabled below).
    if (skipRequireVisited && !skipRequirementMet) {
      return;
    }

    // Route Skip through the same ritual exit overlay as natural completion.
    // handleExitComplete will fire config.onComplete + clearActiveNavigation
    // after the ritual fade finishes — no need to call them here.
    setOverlayPhase('exiting');
  }, [flushCaptures, routeStack, advanceSection, skipRequireVisited, skipRequirementMet]);

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

  // Cumulative visited-section progress (identical formula to MasterModule).
  //
  // Tail-detour sections (placed after a `terminal: true` section in the
  // config array) are only reachable via bookmark routing from earlier in
  // the flow. Once the user has passed the routing gate, they can't be
  // reached sequentially, so they must not inflate the progress denominator.
  // We slice `sections` at the first terminal entry for unvisitedRemaining.
  // Detours the user HAS visited are still counted via `visitedSections` →
  // `visitedCount`, so taking a detour doesn't penalize progress.
  const progressPercent = (() => {
    if (state.modulePhase === 'complete') return 100;
    if (!currentSection) return 0;
    const currentId = currentSection.id;
    const visitedCount = state.visitedSections.length;
    const firstTerminalIdx = sections.findIndex((s) => s.terminal === true);
    const mainFlowSections = firstTerminalIdx >= 0
      ? sections.slice(0, firstTerminalIdx + 1)
      : sections;
    const unvisitedRemaining = mainFlowSections
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
    // Do NOT early-return when modulePhase === 'complete'. The last section
    // must keep rendering through the exit sequence so the ModuleControlBar
    // stays visible while the exit overlay fades in to cover it. Otherwise
    // the section (and its MCB) unmounts a frame before the overlay begins
    // its fade-in, producing a visible "button vanishes then overlay appears"
    // gap. The whole section unmounts cleanly when TransitionModule itself
    // unmounts at the end of the exit sequence.
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
            skipEnabled={
              // Detour skip is always enabled — it pops the bookmark and
              // returns the user to the gate, which is always a valid action.
              // Main-flow skip respects both `skip.allowed` and any
              // `skip.requireVisited` gate.
              routeStack.length > 0
              || ((config.skip?.allowed !== false) && skipRequirementMet)
            }
            skipConfirmMessage={
              routeStack.length > 0
                ? 'Skip this activity?'
                : (config.skip?.confirmMessage || 'Skip the transition?')
            }
          />
        );

      case 'meditation':
        return (
          <MeditationSection
            key={currentSection.id}
            section={currentSection}
            module={{ instanceId: `transition-${config.id}-${currentSection.id}`, title: currentSection.title }}
            onSectionComplete={state.advanceSection}
            onProgressUpdate={(mode, elapsed, total) => {
              if (mode === 'timer') setTimerProgress({ elapsed, total });
            }}
            canGoBackToPreviousSection={state.canGoBackToPreviousSection}
            onBackToPreviousSection={state.goBackToPreviousSection}
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

      {/* Exit overlay — mounts when state machine completes.
          `onCovered` fires when the overlay has fully faded in, which is the
          safe moment to switch the active tab (if `config.landingTab` is set):
          the user is fully covered so the tab swap is invisible, and when the
          overlay fades out at the end they land directly on the new tab. */}
      {overlayPhase === 'exiting' && (
        <TransitionOverlay
          animation={config.animation}
          phase="exiting"
          onCovered={() => {
            if (config.landingTab) {
              useAppStore.getState().setCurrentTab(config.landingTab);
            }
          }}
          onComplete={handleExitComplete}
        />
      )}

      {/* Main content — status bar + current section.
          Opacity is driven by BOTH contentVisible (entrance reveal) and
          overlayPhase (exit). During exit the bars fade out in parallel
          with the TransitionOverlay fading in — duration-700 matches the
          overlay's 700ms fade-in so the two animations finish together,
          giving a clean dissolve instead of a "bars hang around while the
          overlay slowly covers them" effect. The background beneath the
          bars is the same color as the overlay, so there's no visible gap
          even in the few frames where both are partly transparent. */}
      <div
        className="transition-opacity duration-700"
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
          {/* Keyed wrapper — remounts on section change so ScreensSection /
              MeditationSection get a fresh state instance. No animate-fadeIn
              here: the wrapper contains the ModuleControlBar (via ScreensSection's
              fragment return), and a wrapper-level fade would ramp the Continue
              button from opacity 0→1 on every section transition, producing
              a visible flash. Content inside ScreensSection handles its own
              fade-in via isBodyVisible / isTitleVisible / isAnimationVisible. */}
          <div
            key={currentSection?.id || 'empty'}
            className="flex-1 overflow-auto"
          >
            {renderCurrentSection()}
          </div>
        </div>
      </div>
    </>
  );
}
