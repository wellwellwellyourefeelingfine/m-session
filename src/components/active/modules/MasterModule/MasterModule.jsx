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
 * 4. Header + animation continuity ACROSS SCREENS (within OR across sections):
 *    The persistent header (title + animation) is OWNED BY MasterModule, not
 *    ScreensSection. ScreensSection reports its current screen's header via
 *    `onHeaderChange`; MasterModule independently crossfades title and
 *    animation when each changes. Title and animation persist independently
 *    — sharing a `leaf` animation across consecutive sections keeps the leaf
 *    anchored even when titles differ; sharing a title across screens keeps
 *    the title anchored even when animations differ.
 *
 *    Cross-section transitions: ScreensSection unmounts/remounts on section
 *    change, but MasterModule's persistent header survives. The new section's
 *    first-screen header is reported on mount → MasterModule decides whether
 *    to fade based on what changed. No restructuring of sections needed to
 *    get cross-section anchoring.
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

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSessionStore } from '../../../../stores/useSessionStore';
import useMasterModuleState from './useMasterModuleState';
import { ScreensSection, MeditationSection, TimerSection, GenerateSection } from './sectionRenderers';
import useProgressReporter from '../../../../hooks/useProgressReporter';
import ModuleLayout, { CompletionScreen, IdleScreen } from '../../capabilities/ModuleLayout';
import ModuleControlBar from '../../capabilities/ModuleControlBar';
import RevealOverlay from '../../capabilities/animations/RevealOverlay';
import ImageViewerModal from '../../capabilities/ImageViewerModal';
import { ANIMATION_MAP } from './blockRenderers/HeaderBlock';
import { renderLineWithMarkup } from './utils/renderContentLines';
import resolveAnimationKey from './utils/resolveAnimationKey';
import MASTER_CUSTOM_BLOCKS from './customBlocks';
import { CirclePlusIcon, CircleSkipIcon } from '../../../shared/Icons';

// Persistent-header crossfade duration FALLBACK. ScreensSection passes its
// own FADE_MS in the `onHeaderChange({..., durationMs})` payload so ritualFade
// sections (700ms body fade) get a 700ms header crossfade and standard
// sections (400ms) get 400ms. This fallback only kicks in if a caller
// forgets to pass durationMs (e.g. the section-type-change effect that
// clears the header when entering a meditation section).
const HEADER_FADE_FALLBACK_MS = 400;

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
  const content = module.content?.masterModuleContent;

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

  // ── Persistent header (title + animation) ─────────────────────────────────
  //
  // Lifted up out of ScreensSection so the header survives section unmounts.
  // ScreensSection reports its current screen's header via `onHeaderChange`;
  // title and animation crossfade INDEPENDENTLY so two consecutive screens
  // (within OR across sections) sharing a `leaf` animation stay anchored
  // even when the title differs.
  //
  //   renderedHeader — what's currently mounted in the DOM (lags during fade)
  //   isTitleVisible / isAnimationVisible — opacity controls per slot
  //
  // Why imperative (setState in the callback) and NOT a useEffect:
  // ScreensSection's eager `onHeaderChange` call sits in the SAME React batch
  // as its own `setIsBodyVisible(false)`. If the header fade-out went through
  // a useEffect it would land one render cycle later — visible as the title
  // and animation lagging the body fade by ~one paint frame. By calling
  // setIsTitleVisible(false) / setIsAnimationVisible(false) synchronously
  // here, all three opacity flips commit in the same render and start their
  // CSS transitions in the same paint frame. The renderedHeader swap +
  // fade-IN runs on a setTimeout(HEADER_FADE_MS) so the new content appears
  // exactly when the body's fade-in begins.
  const [renderedHeader, setRenderedHeader] = useState({ title: null, animationKey: null });
  const [isTitleVisible, setIsTitleVisible] = useState(false);
  const [isAnimationVisible, setIsAnimationVisible] = useState(false);
  const renderedHeaderRef = useRef({ title: null, animationKey: null });
  const swapTimerRef = useRef(null);

  const [headerFadeMs, setHeaderFadeMs] = useState(HEADER_FADE_FALLBACK_MS);

  const handleHeaderChange = useCallback((next) => {
    const nextTitle = next?.title || null;
    const nextAnim = next?.animationKey || null;
    const durationMs = next?.durationMs || HEADER_FADE_FALLBACK_MS;
    const current = renderedHeaderRef.current;

    // Dedupe — if what's already rendered (or pending swap) matches, no-op.
    if (current.title === nextTitle && current.animationKey === nextAnim) return;

    // Track the duration so the rendered slots' CSS transition matches the
    // current section's fade speed (ritualFade=700ms vs default=400ms).
    setHeaderFadeMs(durationMs);

    const titleChanged = current.title !== nextTitle;
    const animationChanged = current.animationKey !== nextAnim;

    // Cancel any in-flight swap from a prior transition (rapid sequential
    // header changes — e.g. user clicks Continue twice quickly).
    if (swapTimerRef.current) {
      clearTimeout(swapTimerRef.current);
      swapTimerRef.current = null;
    }

    // Initial mount path (nothing to fade out): set rendered + RAF the
    // visibility flip so the new content fades IN via CSS transition.
    const isInitialMount = current.title == null && current.animationKey == null;
    if (isInitialMount) {
      setRenderedHeader({ title: nextTitle, animationKey: nextAnim });
      renderedHeaderRef.current = { title: nextTitle, animationKey: nextAnim };
      requestAnimationFrame(() => {
        if (nextTitle != null) setIsTitleVisible(true);
        if (nextAnim != null) setIsAnimationVisible(true);
      });
      return;
    }

    // Synchronously trigger fade-out for changed fields. Same React batch as
    // ScreensSection's setIsBodyVisible(false) → all three start fading in
    // the SAME paint frame. (This is the fix for the "header lags body"
    // visual stagger.)
    if (titleChanged && current.title != null) setIsTitleVisible(false);
    if (animationChanged && current.animationKey != null) setIsAnimationVisible(false);

    // Schedule swap + fade-in to land exactly when the body fade-in begins.
    swapTimerRef.current = setTimeout(() => {
      setRenderedHeader({ title: nextTitle, animationKey: nextAnim });
      renderedHeaderRef.current = { title: nextTitle, animationKey: nextAnim };
      if (titleChanged && nextTitle != null) setIsTitleVisible(true);
      if (animationChanged && nextAnim != null) setIsAnimationVisible(true);
      swapTimerRef.current = null;
    }, durationMs);
  }, []);

  // When the section is non-screens (meditation/timer/generate), those
  // sections render their own UI; clear the persistent header so it fades
  // out cleanly. ScreensSection reasserts its own header on remount.
  useEffect(() => {
    if (state.currentSection?.type && state.currentSection.type !== 'screens') {
      handleHeaderChange({ title: null, animationKey: null });
    }
  }, [state.currentSection?.id, state.currentSection?.type, handleHeaderChange]);

  // Cleanup pending swap on unmount.
  useEffect(() => {
    return () => {
      if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    };
  }, []);

  // Resolve the first-screen header of the section that the next transition
  // would land on (sequential advance, or a route). ScreensSection calls this
  // BEFORE its body-fade timeout so the persistent header crossfade kicks off
  // in the same paint frame as the body fade — keeping cross-section
  // transitions visually in sync (instead of header lagging by FADE_MS while
  // the new section mounts and reasserts its header on its own).
  //
  // Returns `null` if the transition would end the module (terminal /
  // off-the-end / non-screens section), which signals "fade the persistent
  // header out entirely."
  const peekNextSectionHeader = useCallback((routeConfig = null) => {
    const sectionList = content?.sections || [];
    const nextIdx = state.peekNextSectionIndex(routeConfig);
    if (nextIdx == null) return null;
    const nextSection = sectionList[nextIdx];
    if (!nextSection || nextSection.type !== 'screens') return null;
    const firstScreen = nextSection.screens?.[0];
    if (!firstScreen?.blocks) return null;
    const headerBlock = firstScreen.blocks[0]?.type === 'header' ? firstScreen.blocks[0] : null;
    return {
      title: headerBlock?.title || null,
      animationKey: resolveAnimationKey(headerBlock),
    };
  }, [content, state.peekNextSectionIndex]);

  const PersistentHeaderAnim = renderedHeader.animationKey
    ? ANIMATION_MAP[renderedHeader.animationKey]
    : null;

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

    // Timer sections report their own progress — don't override.
    //
    // Meditation sections also report progress (timer-based, from
    // useMeditationPlayback) BUT only after the user presses Begin and
    // playback starts. While the meditation is on its idle screen the
    // hook stays silent, so we still compute and emit a section-based
    // value here. Once playback fires its first timer update, that
    // higher-frequency report overrides ours and the bar tracks the
    // meditation's elapsed time. This avoids the "progress snaps to 0%
    // on meditation idle" regression that would otherwise happen when
    // routing into a meditation section.
    if (sectionType === 'timer') return;

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
      // generate / meditation sections, or screens before first onScreenChange fires
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
          onHeaderChange={handleHeaderChange}
          peekNextSectionHeader={peekNextSectionHeader}
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
      {/*
        Persistent header — title + animation, lifted up out of ScreensSection
        so they SURVIVE section unmounts. ScreensSection reports its current
        screen's header via `onHeaderChange`; the crossfade effect above
        independently fades title vs animation when each changes. The leaf
        animation (or any other) stays anchored across consecutive sections
        that share it; title fades when titles differ.
      */}
      {(renderedHeader.title || PersistentHeaderAnim) && (
        <div className="px-6 pt-2">
          <div className="max-w-sm mx-auto w-full">
            {renderedHeader.title && (
              <div
                className={`transition-opacity ${isTitleVisible ? 'opacity-100' : 'opacity-0'}`}
                style={{ transitionDuration: `${headerFadeMs}ms` }}
              >
                <h2
                  className="text-xl font-light mb-2 text-center"
                  style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                >
                  {renderLineWithMarkup(renderedHeader.title, accentTerms)}
                </h2>
              </div>
            )}
            {PersistentHeaderAnim && (
              <div
                className={`transition-opacity ${isAnimationVisible ? 'opacity-100' : 'opacity-0'}`}
                style={{ transitionDuration: `${headerFadeMs}ms` }}
              >
                <div className="flex justify-center mb-4">
                  <PersistentHeaderAnim />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
