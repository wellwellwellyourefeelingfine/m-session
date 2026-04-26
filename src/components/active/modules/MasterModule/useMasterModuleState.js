/**
 * useMasterModuleState Hook
 *
 * Core state management for the MasterModule system.
 * Manages section navigation, screen indices, routing, data collection,
 * and transition animations.
 *
 * State shape:
 *   Navigation:   modulePhase, currentSectionIndex, routeStack[]
 *   Data:         responses{}, selectorValues{}, selectorJournals{}, choiceValues{}
 *   Transitions:  isLeaving
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useJournalStore } from '../../../../stores/useJournalStore';
import { useSessionStore } from '../../../../stores/useSessionStore';
import { assembleJournalEntry } from './utils/journalAssembler';
import expandScreenToBlocks from './utils/expandScreenToBlocks';

const FADE_MS = 400;
const VIEWER_CLOSE_BUFFER = 50;

export default function useMasterModuleState(content, module, callbacks = {}) {
  // Parent-supplied callbacks. `onModuleComplete` runs when the module ends
  // via sequential advance past the final section, a terminal section's
  // advance, or a `_complete` route — bypassing the legacy "Well Done"
  // completion screen so the timeline moves on directly. `onModuleSkip`
  // runs when Skip is pressed on the last section in main flow.
  const { onModuleComplete } = callbacks;
  // ── Navigation state ──────────────────────────────────────────────────────

  const [modulePhase, setModulePhase] = useState('idle'); // 'idle' | 'active' | 'complete'
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);

  // Route stack for choice-based branching.
  // When a choice routes to a non-sequential section, we push the "continuation index"
  // (the index after the choice's parent section) onto the stack.
  // When the routed section completes, we pop and resume from the continuation.
  const [routeStack, setRouteStack] = useState([]);

  // Back-navigation history — ordered list of section indexes the user came
  // through. Every section transition (advance or route) pushes the section
  // being left. `goBackToPreviousSection` pops from this stack, so Back traces
  // the user's actual visit path rather than walking backward by array index.
  const [sectionHistory, setSectionHistory] = useState([]);

  // ── Data collection state ─────────────────────────────────────────────────

  const [responses, setResponses] = useState({});           // { promptIndex: text }
  const [selectorValues, setSelectorValues] = useState({}); // { key: id | [ids] }
  const [selectorJournals, setSelectorJournals] = useState({}); // { key: text }
  const [choiceValues, setChoiceValues] = useState({});     // { key: optionId }

  // ── Section visit tracking ────────────────────────────────────────────────

  const [visitedSections, setVisitedSections] = useState([]); // completed section IDs

  // ── Generated images state (persists across sections) ─────────────────────

  const [generatedImages, setGeneratedImages] = useState({}); // { generatorId: { blob, url, journalEntryId } }

  // RevealOverlay control (rendered at MasterModule root)
  const [overlayState, setOverlayState] = useState({ active: false, key: 0 });

  // ImageViewerModal control (rendered at MasterModule root)
  const [viewerState, setViewerState] = useState({ open: false, closing: false, generatorId: null });

  // ── Prompt indexing (blocks-aware) ──────────────────────────────────────────
  //
  // Prompts are keyed by OBJECT REFERENCE, not by walk order. A single
  // prompt block shared across multiple screens (the progressive-reveal
  // pattern in `persistBlocks` sections — author defines the prompt as a
  // module-level const and spreads the same reference into screens 1..N)
  // gets ONE stable `promptIndex` across every appearance, so the user's
  // response at responses[promptIndex] follows the block wherever it's
  // rendered. Without this dedupe, each screen's copy would get a fresh
  // index and the textarea would read responses[undefined] on the next
  // screen, making progressive reveal lose typed content.
  //
  // The two views (allBlocksWithPromptIndex + sectionScreensMap) share the
  // same counter + seen-map so they agree on which prompt owns which index.
  const { allBlocksWithPromptIndex, sectionScreensMap } = useMemo(() => {
    const blocks = [];
    const map = {};
    if (!content?.sections) return { allBlocksWithPromptIndex: blocks, sectionScreensMap: map };

    const promptIndexByBlock = new Map();
    let promptCounter = 0;
    const assignPromptIndex = (block) => {
      let idx = promptIndexByBlock.get(block);
      if (idx === undefined) {
        idx = promptCounter++;
        promptIndexByBlock.set(block, idx);
      }
      return idx;
    };

    content.sections.forEach((section) => {
      if (section.type !== 'screens' || !section.screens) return;
      map[section.id] = section.screens.map((screen) => {
        const expanded = expandScreenToBlocks(screen, module.title);
        const indexedBlocks = expanded.map((block) => {
          if (block.type === 'prompt') {
            const promptIndex = assignPromptIndex(block);
            blocks.push({ ...block, promptIndex, sectionId: section.id });
            return { ...block, promptIndex };
          }
          blocks.push({ ...block, sectionId: section.id });
          return block;
        });
        return { ...screen, blocks: indexedBlocks };
      });
    });

    return { allBlocksWithPromptIndex: blocks, sectionScreensMap: map };
  }, [content, module.title]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const sections = useMemo(() => content?.sections || [], [content?.sections]);
  const currentSection = sections[currentSectionIndex];

  // Get screens for the current section with global prompt indices applied
  const currentSectionScreens = currentSection?.type === 'screens'
    ? (sectionScreensMap[currentSection.id] || currentSection.screens || [])
    : [];

  // Resolve a section ID to its index
  const sectionIndexById = useCallback((id) => {
    return sections.findIndex((s) => s.id === id);
  }, [sections]);

  // Back is enabled whenever we have a visit-history entry to pop.
  const canGoBackToPreviousSection = useMemo(() => {
    return sectionHistory.length > 0;
  }, [sectionHistory]);

  // ── Journal store ─────────────────────────────────────────────────────────

  const addEntry = useJournalStore((state) => state.addEntry);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;

  // ── Actions ───────────────────────────────────────────────────────────────

  const begin = useCallback(() => {
    useSessionStore.getState().beginModule(module.instanceId);
    setIsLeaving(true);
    setTimeout(() => {
      setModulePhase('active');
      setIsLeaving(false);
    }, FADE_MS);
  }, [module.instanceId]);

  const finalizeModule = useCallback(() => {
    // Save journal entry if configured. Same logic as the (now-deprecated)
    // CompletionScreen's Continue button, just hoisted up so the user's last
    // Continue press completes the module directly without a "Well Done"
    // intermediate page.
    if (content?.journal?.saveOnComplete) {
      const entryText = assembleJournalEntry({
        titlePrefix: content.journal.titlePrefix || module.title?.toUpperCase() || 'MODULE',
        allScreens: allBlocksWithPromptIndex,
        responses,
        selectorValues,
        selectorJournals,
        conditionContext: { choiceValues, selectorValues, visitedSections },
        storeState: useSessionStore.getState(),
      });
      if (entryText.split('\n').length > 1) {
        addEntry({
          content: entryText,
          source: 'session',
          sessionId,
          moduleTitle: module.title,
        });
      }
    }
    onModuleComplete?.();
    // Keep the phase set to 'complete' as a fallback for any consumer that
    // peeks at it post-completion. The actual UI doesn't render anything
    // here because onModuleComplete is expected to advance the timeline.
    setModulePhase('complete');
  }, [content, module.title, allBlocksWithPromptIndex, responses, selectorValues, selectorJournals, choiceValues, visitedSections, addEntry, sessionId, onModuleComplete]);

  const advanceSection = useCallback(() => {
    // Track that we completed this section
    if (currentSection?.id) {
      setVisitedSections((prev) =>
        prev.includes(currentSection.id) ? prev : [...prev, currentSection.id]
      );
    }

    // Terminal sections end the module regardless of what sits after them.
    if (currentSection?.terminal === true) {
      finalizeModule();
      return;
    }

    // Check if we should pop from route stack (returning from a routed section).
    // Bookmark-pop closes a "side trip" rather than taking a new forward step.
    // Don't push the completed detour onto sectionHistory, and pop the gate's
    // entry that `routeToSection` wrote on entry. The net effect: the round-trip
    // leaves no history residue, so Back from the gate returns to what was
    // before the gate, not back into the completed detour.
    //
    // Stale-bookmark guard: `bookmark: true` resolves to currentSectionIndex+1
    // at route time. When the detour sits sequentially after its gate (gate
    // at N, detour at N+1), the bookmark resolves to the detour's own index.
    // After the detour completes the bookmark would land us back on the
    // section we just finished — a no-op setCurrentSectionIndex call that
    // leaves ScreensSection mounted with its faded-out state intact, i.e. a
    // blank screen until the user presses Continue a second time. Same
    // failure mode if a continuation points to any already-visited section.
    // In those cases we drop the bookmark and fall through to sequential
    // advance below, which correctly skips past visited sections.
    if (routeStack.length > 0) {
      const continuationIndex = routeStack[routeStack.length - 1];
      setRouteStack((prev) => prev.slice(0, -1));
      const continuationId = sections[continuationIndex]?.id;
      const isStaleBookmark =
        continuationIndex >= sections.length
        || continuationIndex === currentSectionIndex
        || visitedSections.includes(continuationId);
      if (!isStaleBookmark) {
        setSectionHistory((prev) => (
          prev.length > 0 && prev[prev.length - 1] === continuationIndex
            ? prev.slice(0, -1)
            : prev
        ));
        setCurrentSectionIndex(continuationIndex);
        return;
      }
      // Fall through to sequential advance.
    }

    // Normal sequential advance — skip already-visited sections
    let nextIndex = currentSectionIndex + 1;
    while (nextIndex < sections.length && visitedSections.includes(sections[nextIndex]?.id)) {
      nextIndex++;
    }
    if (nextIndex >= sections.length) {
      finalizeModule();
    } else {
      setSectionHistory((prev) => [...prev, currentSectionIndex]);
      setCurrentSectionIndex(nextIndex);
    }
  }, [currentSectionIndex, currentSection, sections, routeStack, visitedSections, finalizeModule]);

  const routeToSection = useCallback((routeConfig) => {
    // Normalize: string → skip-ahead (no bookmark), object passes through
    const config = typeof routeConfig === 'string'
      ? { to: routeConfig }
      : routeConfig;

    // Track that we completed the current section before routing away
    if (currentSection?.id) {
      setVisitedSections((prev) =>
        prev.includes(currentSection.id) ? prev : [...prev, currentSection.id]
      );
    }

    // Special routes
    if (config.to === '_next') { advanceSection(); return; }
    if (config.to === '_complete') { finalizeModule(); return; }

    // Find target section
    const targetIndex = sectionIndexById(config.to);
    if (targetIndex === -1) { advanceSection(); return; }

    // Push bookmark only if explicitly requested:
    //   bookmark: true       → auto-bookmark at the section after the current one
    //   bookmark: 'section'  → custom bookmark at a named section
    //   (no bookmark)        → skip-ahead, no return point
    if (config.bookmark) {
      const bookmarkIndex = config.bookmark === true
        ? currentSectionIndex + 1
        : sectionIndexById(config.bookmark);
      if (bookmarkIndex >= 0 && bookmarkIndex < sections.length) {
        setRouteStack((prev) => [...prev, bookmarkIndex]);
      }
    }

    setSectionHistory((prev) => [...prev, currentSectionIndex]);
    setCurrentSectionIndex(targetIndex);
  }, [sectionIndexById, currentSectionIndex, advanceSection, currentSection, sections.length]);

  const complete = useCallback(() => {
    // Save journal entry if configured
    if (content?.journal?.saveOnComplete) {
      const entryText = assembleJournalEntry({
        titlePrefix: content.journal.titlePrefix || module.title?.toUpperCase() || 'MODULE',
        allScreens: allBlocksWithPromptIndex,
        responses,
        selectorValues,
        selectorJournals,
        conditionContext: { choiceValues, selectorValues, visitedSections },
        storeState: useSessionStore.getState(),
      });

      if (entryText.split('\n').length > 1) {
        addEntry({
          content: entryText,
          source: 'session',
          sessionId,
          moduleTitle: module.title,
        });
      }
    }
  }, [content, module.title, allBlocksWithPromptIndex, responses, selectorValues, selectorJournals, choiceValues, visitedSections, addEntry, sessionId]);

  const goBackToPreviousSection = useCallback(() => {
    if (sectionHistory.length === 0) return;

    // Un-visit the section we're leaving so the next forward Continue doesn't
    // skip past it. Forward skip-visited still applies to earlier sections
    // that remain visited.
    const currentId = currentSection?.id;
    if (currentId) {
      setVisitedSections((prev) => prev.filter((id) => id !== currentId));
    }

    const prevIndex = sectionHistory[sectionHistory.length - 1];
    setSectionHistory((prev) => prev.slice(0, -1));

    // If we're back-navigating into a section that's currently the top of
    // `routeStack`, drop that stale entry — otherwise a subsequent Continue
    // would trigger the pop and silently land the user on the section they're
    // already on. Matches the same-named guard in useTransitionModuleState.
    if (routeStack.length > 0 && routeStack[routeStack.length - 1] === prevIndex) {
      setRouteStack((prev) => prev.slice(0, -1));
    }

    setCurrentSectionIndex(prevIndex);
  }, [sectionHistory, currentSection, routeStack]);

  // ── Response handlers ─────────────────────────────────────────────────────

  const setPromptResponse = useCallback((index, value) => {
    setResponses((prev) => ({ ...prev, [index]: value }));
  }, []);

  const toggleSelector = useCallback((key, optionId, multiSelect) => {
    setSelectorValues((prev) => {
      if (multiSelect) {
        const current = prev[key] || [];
        return {
          ...prev,
          [key]: current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      }
      return { ...prev, [key]: prev[key] === optionId ? null : optionId };
    });
  }, []);

  const setSelectorJournal = useCallback((key, value) => {
    setSelectorJournals((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setChoiceValue = useCallback((key, optionId) => {
    setChoiceValues((prev) => ({ ...prev, [key]: optionId }));
  }, []);

  // ── Generated image actions ────────────────────────────────────────────────

  const setGeneratedImage = useCallback((generatorId, data) => {
    setGeneratedImages((prev) => ({ ...prev, [generatorId]: data }));
  }, []);

  const startRevealOverlay = useCallback(() => {
    setOverlayState((prev) => ({ active: true, key: prev.key + 1 }));
  }, []);

  const stopRevealOverlay = useCallback(() => {
    setOverlayState((prev) => ({ ...prev, active: false }));
  }, []);

  const openViewer = useCallback((generatorId) => {
    setViewerState({ open: true, closing: false, generatorId });
  }, []);

  const closeViewer = useCallback(() => {
    setViewerState((prev) => ({ ...prev, closing: true }));
    // After fade completes, unmount
    setTimeout(() => {
      setViewerState({ open: false, closing: false, generatorId: null });
    }, FADE_MS + VIEWER_CLOSE_BUFFER);
  }, []);

  // Cleanup: revoke generated image object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(generatedImages).forEach((img) => {
        if (img.url) {
          try { URL.revokeObjectURL(img.url); } catch (_e) { /* ignore */ }
        }
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Skip handler ───────────────────────────────────────────────────────────
  //
  // Skip advances to the NEXT SECTION rather than abandoning the whole module.
  // Only the final section's Skip ends the module (saves journal + fires the
  // parent onSkip). This keeps Skip useful for "I'm done with this part, but
  // I want to keep going through the activity" — the more common intent in
  // multi-section MasterModule activities than a full module bail-out.
  //
  // Detour Skip (inside a bookmark-routed section) still works the same way:
  // advanceSection pops the bookmark and lands the user back on the gate.
  const handleSkip = useCallback((onSkip) => {
    const isLastSection = routeStack.length === 0
      && currentSectionIndex >= sections.length - 1;

    if (!isLastSection) {
      advanceSection();
      return;
    }

    // Last section in main flow — finalize + abandon. Save partial data and
    // hand control back to the parent so the timeline moves on.
    if (content?.journal?.saveOnComplete) {
      const entryText = assembleJournalEntry({
        titlePrefix: content.journal.titlePrefix || module.title?.toUpperCase() || 'MODULE',
        allScreens: allBlocksWithPromptIndex,
        responses,
        selectorValues,
        selectorJournals,
        conditionContext: { choiceValues, selectorValues, visitedSections },
        storeState: useSessionStore.getState(),
      });
      if (entryText.split('\n').length > 1) {
        addEntry({
          content: entryText,
          source: 'session',
          sessionId,
          moduleTitle: module.title,
        });
      }
    }
    onSkip();
  }, [routeStack, currentSectionIndex, sections.length, advanceSection, content, module.title, allBlocksWithPromptIndex, responses, selectorValues, selectorJournals, choiceValues, visitedSections, addEntry, sessionId]);

  // ── Back-to-idle ──────────────────────────────────────────────────────────
  //
  // When the user is on the very first screen of the very first section and
  // presses Back, we drop them back on the module's idle screen. Press
  // Begin again to re-enter — responses + nav state are preserved (the hook
  // keeps state across phase transitions). Used by ScreensSection to chain
  // its Back fallback: previous screen → previous section → idle.
  const goBackToIdle = useCallback(() => {
    setModulePhase('idle');
    setCurrentSectionIndex(0);
    setSectionHistory([]);
    setRouteStack([]);
  }, []);

  // True when the current section is the last section in main flow (no
  // bookmark to pop, currentSectionIndex is at the final array entry). Used
  // by ScreensSection to relabel the primary "Continue" → "Complete" on the
  // section's last screen.
  const isLastSection = routeStack.length === 0
    && currentSectionIndex >= sections.length - 1;

  return {
    // Navigation
    modulePhase,
    currentSection,
    currentSectionIndex,
    currentSectionScreens,
    isLeaving,
    routeStack,
    canGoBackToPreviousSection,
    goBackToIdle,
    isLastSection,
    finalizeModule,

    // Data
    responses,
    selectorValues,
    selectorJournals,
    choiceValues,
    visitedSections,
    allBlocksWithPromptIndex,

    // Generated images + overlays
    generatedImages,
    overlayState,
    viewerState,

    // Actions
    begin,
    advanceSection,
    routeToSection,
    complete,
    goBackToPreviousSection,
    handleSkip,

    // Response handlers
    setPromptResponse,
    toggleSelector,
    setSelectorJournal,
    setChoiceValue,

    // Generated image actions
    setGeneratedImage,
    startRevealOverlay,
    stopRevealOverlay,
    openViewer,
    closeViewer,
  };
}
