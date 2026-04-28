/**
 * SEE FIRST: ./MasterModuleStyleSheet.md
 *   The single source of truth for design, UI, copy, and behavior conventions
 *   across the master-module system. Read it before authoring or modifying a
 *   master module — the conventions block below is a redundant safety net,
 *   not a substitute.
 *
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
 *
 * ────────────────────────────────────────────────────────────────────────────
 * UI / COPY CONVENTIONS — read before authoring a new module
 * ────────────────────────────────────────────────────────────────────────────
 *
 * 1. Module-level idle screen render order:
 *      title → subtitle (accent) → animation → description → time pill
 *    Voice selection, when applicable, lives on the embedded meditation's
 *    OWN idle (MeditationSection), not on the module-level idle.
 *
 * 2. Header copy: Title Case, no terminal punctuation.
 *      ✓  "What Surfaced", "Set This Aside", "Where In Your Body"
 *      ✗  "What showed up?", "Set this aside.", "Going deeper."
 *    The header is the section's *descriptor*, not the question being asked.
 *    Move the question into the prompt slot of the input/choice block — it
 *    renders in DM Serif at text-base via PromptBlock / ProtectorFieldBlock /
 *    ChoiceBlock and sits directly above the input.
 *
 * 3. Screen layout pattern when the section asks for input:
 *      header → animation → body text (orienting copy in mono/serif primary)
 *      → DM Serif prompt question → input/selector/choice
 *    The body text orients; the DM Serif prompt is the actual ask.
 *
 * 4. Header + animation continuity ACROSS SCREENS within a section:
 *    ScreensSection compares headerBlock.title and the resolved animation
 *    key between consecutive screens — when both match, neither fades on
 *    transition. The header stays anchored while only the body content fades.
 *
 *    To extend this across what feels like "two pages" of one experience,
 *    combine them into ONE section with multiple screens. Two SEPARATE
 *    sections always remount fresh DOM and re-fade everything, even if their
 *    headers happen to match — there's no cross-section persistence.
 *
 *    Optional `persistBlocks: true` on the section keeps body blocks at
 *    matching indexes mounted across screens (progressive-reveal pattern).
 *    Without it, each screen transition fades the full body in/out while the
 *    matching header/animation stay anchored.
 *
 * 5. Use the same JS reference for shared blocks across screens. Define a
 *    `const SECTION_HEADER = { type: 'header', title: 'X', animation: 'Y' }`
 *    at the top of the content file and spread the same reference into every
 *    screen that shares it. React's keyed reconciliation matches blocks by
 *    index, so a shared reference at the same index keeps its DOM and avoids
 *    re-running its mount animations.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSessionStore } from '../../../../stores/useSessionStore';
import useMasterModuleState from './useMasterModuleState';
import { ScreensSection, MeditationSection, TimerSection, GenerateSection } from './sectionRenderers';
import useProgressReporter from '../../../../hooks/useProgressReporter';
import ModuleLayout, { CompletionScreen, IdleScreen } from '../../capabilities/ModuleLayout';
import ModuleControlBar from '../../capabilities/ModuleControlBar';
import RevealOverlay from '../../capabilities/animations/RevealOverlay';
import ImageViewerModal from '../../capabilities/ImageViewerModal';
import { getModuleById } from '../../../../content/modules';
import { ANIMATION_MAP } from './blockRenderers/HeaderBlock';
import MASTER_CUSTOM_BLOCKS from './customBlocks';
import { CirclePlusIcon, CircleSkipIcon } from '../../../shared/Icons';

// Inline collapsible used by the idle landing for richer module layouts.
// Mirrors the ExpandableBlock visual but lives outside the section/blocks
// system because the idle screen doesn't render through ScreensSection.
function IdleExpandable({ title, body }) {
  const [open, setOpen] = useState(false);
  const Icon = open ? CircleSkipIcon : CirclePlusIcon;
  return (
    <div className="w-full">
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]
            hover:text-[var(--color-text-primary)] transition-colors
            inline-flex items-center gap-2"
        >
          {title}
          <Icon size={14} className="text-[var(--color-text-tertiary)]" />
        </button>
      </div>
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: open ? '600px' : '0', opacity: open ? 1 : 0 }}
      >
        <p className="pt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {body}
        </p>
      </div>
    </div>
  );
}

export default function MasterModule({ module, onComplete, onSkip, onProgressUpdate }) {
  const content = module.content?.masterModuleContent
    || getModuleById(module.libraryId)?.content?.masterModuleContent;

  // Hand the parent's onComplete down to the state hook so that the module's
  // final advance (sequential past last section, or terminal section, or
  // _complete route) finalizes the module DIRECTLY — saves the journal and
  // hands control back to the timeline. The legacy "Well Done" intermediate
  // page is no longer rendered.
  const state = useMasterModuleState(content, module, {
    onModuleComplete: onComplete,
    onModuleSkip: onSkip,
  });

  // Runtime tokens — merge config-time accentTerms with values resolved from
  // the session store at render time. The protector tokens are read here
  // because they're cross-module identity data on sessionProfile.protector;
  // a future module that wants different runtime tokens can extend this map.
  // Falling back to neutral generics ('your protector', 'in your body') keeps
  // text grammatical even before the user has entered anything.
  const protector = useSessionStore((s) => s.sessionProfile?.protector);
  const accentTerms = useMemo(() => ({
    ...(content?.accentTerms || {}),
    protectorName: protector?.name || 'your protector',
    bodyLocation: protector?.bodyLocation || 'in your body',
  }), [content?.accentTerms, protector?.name, protector?.bodyLocation]);

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
    const idleConfig = content?.idle;

    // Auto-derive idle screen duration pill from module.duration (the
    // activity's total estimate). Voice selection lives on the embedded
    // meditation's own idle screen — the module-level idle previews the time
    // commitment but not the voice, so the user picks their voice on the
    // meditation idle right before composition begins.
    const idleDurationMinutes = typeof idleConfig?.durationMinutes === 'number'
      ? idleConfig.durationMinutes
      : (typeof module.duration === 'number' ? module.duration : null);

    // Title — `idle.title` overrides `module.title` so linked parts can
    // share a unified title (e.g. "Dialogue with a Protector") above the
    // per-part subtitle (e.g. "Part 1: Meeting a Protector"), without
    // having to rename the underlying library entries.
    const idleTitle = idleConfig?.title ?? module.title;

    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <div className={state.isLeaving ? 'animate-fadeOut' : 'animate-fadeIn'}>
            {/*
              IdleScreen renders, in order:
                title → subtitle (accent) → animation → description → time pill
              The expandable disclosure (when configured) lives below the
              pill so the user sees their time commitment before the deeper
              info dive. Voice selection is deferred to the meditation
              section's own idle screen.
            */}
            <IdleScreen
              title={idleTitle}
              subtitle={idleConfig?.subtitle}
              description={idleConfig?.description}
              durationMinutes={idleDurationMinutes}
              animation={IdleAnimation ? <IdleAnimation /> : null}
            />

            {idleConfig?.expandable && (
              <div className="px-6 mt-6">
                <IdleExpandable
                  title={idleConfig.expandable.title}
                  body={idleConfig.expandable.body}
                />
              </div>
            )}
          </div>
        </ModuleLayout>
        <ModuleControlBar
          phase="idle"
          primary={{ label: 'Begin', onClick: state.begin }}
          showSkip={true}
          // Idle-phase Skip ALWAYS abandons the module — the user hasn't
          // started anything yet, so there's nothing to advance to. Bypass
          // the active-phase handleSkip (which would advance a section) and
          // call onSkip directly to move to the next module in the timeline.
          onSkip={onSkip}
          skipConfirmMessage="Skip this activity?"
        />
      </>
    );
  }

  // ── Completion Phase ──────────────────────────────────────────────────────
  // finalizeModule already saved the journal entry and called the parent
  // `onComplete` to advance the timeline. We render nothing here so the
  // user doesn't briefly see a "Well done" intermediate page during the
  // tick or two it takes the parent to unmount this module.

  if (state.modulePhase === 'complete') {
    return null;
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
          onBackToIdle={state.goBackToIdle}
          isLastSection={state.isLastSection}
          generatedImages={state.generatedImages}
          onOpenViewer={state.openViewer}
          onRouteToSection={state.routeToSection}
          onScreenChange={handleScreenChange}
          customBlockRegistry={MASTER_CUSTOM_BLOCKS}
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
