/**
 * MasterModule — Universal content-driven module component
 *
 * A generalized module framework that renders any module from a content config.
 * Supports four section types (screens, meditation, timer, generate) and seven
 * screen types (text, prompt, selector, choice, animation, alarm, review).
 *
 * Content is fully separated from rendering — new modules are built by writing
 * a content config file alone, with no custom component code.
 *
 * Props: { module, onComplete, onSkip, onProgressUpdate }
 */

import { useState, useCallback, useEffect } from 'react';
import { getModuleById } from '../../../../content/modules';
import useMasterModuleState from './useMasterModuleState';
import { ScreensSection, MeditationSection, TimerSection, GenerateSection } from './sectionRenderers';
import useProgressReporter from '../../../../hooks/useProgressReporter';
import ModuleLayout, { CompletionScreen, IdleScreen } from '../../capabilities/ModuleLayout';
import ModuleControlBar from '../../capabilities/ModuleControlBar';
import RevealOverlay from '../../capabilities/animations/RevealOverlay';
import ImageViewerModal from '../../capabilities/ImageViewerModal';
import { ANIMATION_MAP } from './blockRenderers/HeaderBlock';

export default function MasterModule({ module, onComplete, onSkip, onProgressUpdate }) {
  const libraryModule = getModuleById(module.libraryId);
  const content = module.content?.masterModuleContent;

  const state = useMasterModuleState(content, module);

  const accentTerms = content?.accentTerms || {};

  // ── Progress reporting (screen-level granularity) ─────────────────────────

  const report = useProgressReporter(onProgressUpdate);
  const sections = content?.sections || [];

  // Screen-level progress reported by ScreensSection
  const [screenProgress, setScreenProgress] = useState({ position: 0, total: 0 });
  const handleScreenChange = useCallback((position, total) => {
    setScreenProgress({ position, total });
  }, []);

  // Reset screen progress when section changes
  useEffect(() => {
    setScreenProgress({ position: 0, total: 0 });
  }, [state.currentSectionIndex]);

  // Cumulative progress: based on visited sections, not absolute index position.
  // expectedTotal = visited + 1 (current) + all other unvisited sections.
  // Uses the full section list (not just "ahead") because routing can visit
  // sections out of array order (e.g., jump to index 5, then bookmark back to 4).
  //
  // Tail-detour sections (placed after a `terminal: true` section in the
  // config array) are only reachable via bookmark routing from earlier in
  // the flow. Once the user has passed the routing gate they can't be
  // reached sequentially, so they must not inflate the progress denominator.
  // We slice `sections` at the first terminal entry for unvisitedRemaining.
  // Detours the user HAS visited are still counted via `visitedSections` →
  // `visitedCount`, so taking a detour doesn't penalize progress.
  useEffect(() => {
    if (state.modulePhase === 'idle') {
      report.idle();
      return;
    }
    if (state.modulePhase === 'complete') {
      report.raw(100);
      return;
    }
    if (state.modulePhase !== 'active') return;

    const sectionType = state.currentSection?.type;

    // Meditation/timer sections report their own progress — don't override
    if (sectionType === 'meditation' || sectionType === 'timer') return;

    const currentId = state.currentSection?.id;
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

    if (sectionType === 'screens' && screenProgress.total > 0) {
      const screenFraction = screenProgress.position / screenProgress.total;
      report.raw((sectionBase + sectionWeight * screenFraction) * 100);
    } else {
      // generate sections or screens before first onScreenChange fires
      report.raw(sectionBase * 100);
    }
  }, [state.modulePhase, state.currentSectionIndex, state.currentSection?.type, state.visitedSections, sections, screenProgress, report]);

  // ── Skip handler (context-aware) ──────────────────────────────────────────
  // Mirrors TransitionModule's handleSkip:
  //   - In a bookmark-routed detour (routeStack has entries): advance the
  //     section so the bookmark pops and the user returns to the gate. Skip
  //     means "abandon this detour activity," not "abandon the whole module."
  //   - In main flow (no bookmark): save partial data and fire onSkip to
  //     abandon the entire module.
  const handleSkip = useCallback(() => {
    if (state.routeStack.length > 0) {
      state.advanceSection();
      return;
    }
    state.handleSkip(onSkip);
  }, [state, onSkip]);

  // ── Complete handler ──────────────────────────────────────────────────────

  const handleComplete = useCallback(() => {
    state.complete();
    onComplete();
  }, [state, onComplete]);

  // ── RevealOverlay done handler ────────────────────────────────────────────

  const handleRevealDone = useCallback(() => {
    state.stopRevealOverlay();
  }, [state]);

  // ── ImageViewer close handler ─────────────────────────────────────────────
  // Advance to next section immediately (renders behind fading viewer)

  const handleViewerClose = useCallback(() => {
    // If we're in a generate section, advance before unmounting
    const section = state.currentSection;
    if (section?.type === 'generate') {
      state.advanceSection();
    }
    state.closeViewer();
  }, [state]);

  // ── No content fallback ───────────────────────────────────────────────────

  if (!content || !content.sections || content.sections.length === 0) {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)] text-center">
            Module content not found.
          </p>
        </ModuleLayout>
        <ModuleControlBar
          phase="completed"
          primary={{ label: 'Continue', onClick: onComplete }}
          showSkip={false}
        />
      </>
    );
  }

  // ── Idle Phase ────────────────────────────────────────────────────────────

  if (state.modulePhase === 'idle') {
    const IdleAnimation = content?.idleAnimation ? ANIMATION_MAP[content.idleAnimation] : null;
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <div className={state.isLeaving ? 'animate-fadeOut' : 'animate-fadeIn'}>
            <IdleScreen
              title={module.title}
              description={libraryModule?.description}
              duration={module.duration}
              animation={IdleAnimation ? <IdleAnimation /> : null}
            />
          </div>
        </ModuleLayout>
        <ModuleControlBar
          phase="idle"
          primary={{ label: 'Begin', onClick: state.begin }}
          showSkip={true}
          onSkip={handleSkip}
          skipConfirmMessage="Skip this activity?"
        />
      </>
    );
  }

  // ── Completion Phase ──────────────────────────────────────────────────────

  if (state.modulePhase === 'complete') {
    const completionConfig = content.completion || {};
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <CompletionScreen
            title={completionConfig.title}
            message={completionConfig.message}
          />
        </ModuleLayout>
        <ModuleControlBar
          phase="completed"
          primary={{ label: 'Continue', onClick: handleComplete }}
          showSkip={false}
        />
      </>
    );
  }

  // ── Active Phase — render current section ─────────────────────────────────

  const section = state.currentSection;

  if (!section) {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <CompletionScreen />
        </ModuleLayout>
        <ModuleControlBar
          phase="completed"
          primary={{ label: 'Continue', onClick: handleComplete }}
          showSkip={false}
        />
      </>
    );
  }

  // Get current generated image info for the viewer
  const viewerImage = state.viewerState.generatorId
    ? state.generatedImages[state.viewerState.generatorId]
    : null;

  // Find section config for imageName (from the generate section that created it)
  const viewerSection = state.viewerState.generatorId
    ? content.sections.find((s) => s.type === 'generate' && s.generatorId === state.viewerState.generatorId)
    : null;

  // Render the appropriate section renderer + root-level overlays
  let sectionContent;

  switch (section.type) {
    case 'screens':
      sectionContent = (
        <ScreensSection
          key={section.id}
          section={{ ...section, screens: state.currentSectionScreens }}
          accentTerms={accentTerms}
          moduleTitle={module.title}
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
          onSkip={handleSkip}
          canGoBackToPreviewSection={state.canGoBackToPreviousSection}
          onBackToPreviousSection={state.goBackToPreviousSection}
          generatedImages={state.generatedImages}
          onOpenViewer={state.openViewer}
          onRouteToSection={state.routeToSection}
          onScreenChange={handleScreenChange}
        />
      );
      break;

    case 'meditation':
      sectionContent = (
        <MeditationSection
          key={section.id}
          section={section}
          module={module}
          onSectionComplete={state.advanceSection}
          onProgressUpdate={onProgressUpdate}
          canGoBackToPreviousSection={state.canGoBackToPreviousSection}
          onBackToPreviousSection={state.goBackToPreviousSection}
        />
      );
      break;

    case 'timer':
      sectionContent = (
        <TimerSection
          key={section.id}
          section={section}
          module={module}
          onSectionComplete={state.advanceSection}
          onSkip={handleSkip}
          onProgressUpdate={onProgressUpdate}
        />
      );
      break;

    case 'generate':
      sectionContent = (
        <GenerateSection
          key={section.id}
          section={section}
          accentTerms={accentTerms}
          responses={state.responses}
          selectorValues={state.selectorValues}
          selectorJournals={state.selectorJournals}
          choiceValues={state.choiceValues}
          onSetGeneratedImage={state.setGeneratedImage}
          onStartRevealOverlay={state.startRevealOverlay}
          onOpenViewer={state.openViewer}
          onSectionComplete={state.advanceSection}
          onSkip={handleSkip}
        />
      );
      break;

    default:
      state.advanceSection();
      sectionContent = null;
      break;
  }

  return (
    <>
      {sectionContent}

      {/* RevealOverlay — rendered at root so it persists across section transitions */}
      <RevealOverlay
        key={state.overlayState.key}
        isActive={state.overlayState.active}
        onDone={handleRevealDone}
      />

      {/* ImageViewerModal — rendered at root so it persists across section transitions */}
      <ImageViewerModal
        isOpen={state.viewerState.open}
        closing={state.viewerState.closing}
        onClose={handleViewerClose}
        imageUrl={viewerImage?.url}
        imageBlob={viewerImage?.blob}
        imageAlt={viewerSection?.imageName || 'Generated image'}
        imageName={viewerSection?.imageName || 'image'}
      />
    </>
  );
}
