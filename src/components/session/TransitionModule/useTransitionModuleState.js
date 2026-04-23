/**
 * useTransitionModuleState
 *
 * Core state hook for the TransitionModule system. Unlike useMasterModuleState
 * (which stores everything locally), this hook persists navigation + data to
 * the session store under `transitionData.activeNavigation`, enabling mid-
 * transition app closes to resume where the user left off.
 *
 * Sync strategy (hybrid, per spec §6.1):
 *  - Selectors and choices: written immediately on change
 *  - Prompt responses (textareas): local while editing, flushed on blur +
 *    on section/screen advance + on transition completion
 *  - Navigation state (section index, screen index, visited, route stack):
 *    written on every section/screen change
 *
 * Cross-store writes: when a prompt declares `storeField` (e.g.,
 * 'sessionProfile.holdingQuestion'), the flush handler mirrors the value to
 * that path in addition to activeNavigation.responses.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useJournalStore } from '../../../stores/useJournalStore';
import expandScreenToBlocks from '../../active/modules/MasterModule/utils/expandScreenToBlocks';
import { assembleJournalEntry } from '../../active/modules/MasterModule/utils/journalAssembler';

export default function useTransitionModuleState(config) {
  const transitionId = config.id;

  // ── Store access ────────────────────────────────────────────────────────────
  const transitionData = useSessionStore((s) => s.transitionData);
  const updateTransitionData = useSessionStore((s) => s.updateTransitionData);
  const updateSessionProfile = useSessionStore((s) => s.updateSessionProfile);
  const storeState = useSessionStore((s) => s);
  const addEntry = useJournalStore((s) => s.addEntry);

  // Whether the persisted navigation is for THIS transition
  const persistedNav = transitionData?.activeNavigation;
  const isResuming = persistedNav?.transitionId === transitionId;

  // ── Core navigation state (mirrors activeNavigation, but local for React re-renders) ──
  const [currentSectionIndex, setCurrentSectionIndex] = useState(
    isResuming ? persistedNav.currentSectionIndex : 0
  );
  const [visitedSections, setVisitedSections] = useState(
    isResuming ? persistedNav.visitedSections : []
  );
  const [routeStack, setRouteStack] = useState(
    isResuming ? persistedNav.routeStack : []
  );
  const [screenIndex, setScreenIndex] = useState(
    isResuming ? persistedNav.screenIndex : 0
  );

  // Back-navigation history — ordered list of section indexes the user came
  // through. Every section transition (advance or route) pushes the section
  // being left. `goBackToPreviousSection` pops from this stack. Persisted to
  // activeNavigation so Back works on resume after a force-close mid-transition.
  const [sectionHistory, setSectionHistory] = useState(
    isResuming ? (persistedNav.sectionHistory || []) : []
  );

  // ── Data state (local during editing, persisted per sync strategy) ──────────
  const [responses, setResponses] = useState(
    isResuming ? { ...persistedNav.responses } : {}
  );
  const [selectorValues, setSelectorValues] = useState(
    isResuming ? { ...persistedNav.selectorValues } : {}
  );
  const [selectorJournals, setSelectorJournals] = useState(
    isResuming ? { ...persistedNav.selectorJournals } : {}
  );
  const [choiceValues, setChoiceValues] = useState(
    isResuming ? { ...persistedNav.choiceValues } : {}
  );

  // Module phase — 'active' or 'complete'
  const [modulePhase, setModulePhase] = useState('active');

  // ── On mount: mark this as the active transition + initialize responses from store ──
  // We track this with a ref so the initialization only runs once per mount.
  const didInitialize = useRef(false);
  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;

    if (!isResuming) {
      // Fresh transition — write transitionId and initial empty state to activeNavigation
      updateTransitionData('activeNavigation', {
        transitionId,
        currentSectionIndex: 0,
        visitedSections: [],
        routeStack: [],
        sectionHistory: [],
        screenIndex: 0,
        responses: {},
        selectorValues: {},
        selectorJournals: {},
        choiceValues: {},
        blockReadiness: {},
      });

      // Pre-populate prompt responses from `storeField` paths (e.g. holdingQuestion)
      // so the textarea shows existing values if the user is editing pre-existing data.
      // Dedupe by block reference so prompts that appear on multiple screens via
      // persistBlocks progressive reveal share a single promptIndex (see indexing
      // notes on `allBlocksWithPromptIndex` / `sectionScreensMap` below).
      const prepopulated = {};
      const blocks = collectAllBlocks(config);
      const seenPromptIndices = new Map();
      let promptCounter = 0;
      blocks.forEach((b) => {
        if (b.type !== 'prompt') return;
        let idx = seenPromptIndices.get(b);
        if (idx === undefined) {
          idx = promptCounter++;
          seenPromptIndices.set(b, idx);
        }
        if (b.storeField) {
          const value = resolveStorePath(b.storeField, storeState);
          if (value) prepopulated[idx] = value;
        }
      });
      if (Object.keys(prepopulated).length > 0) {
        setResponses(prepopulated);
      }
    }
    // No cleanup — activeNavigation is cleared on completion/skip explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived: all blocks indexed + per-section screens map ───────────────────
  //
  // Prompt-index assignment: prompts are keyed by OBJECT REFERENCE. A single
  // prompt block shared across multiple screens (the progressive-reveal
  // pattern in `persistBlocks` sections — e.g. the tailored synthesis
  // activities) gets ONE stable `promptIndex` across every appearance, so
  // the user's response at `responses[index]` follows the block wherever it's
  // rendered. Without this dedupe, each screen's copy would get a fresh index
  // and the textarea would read `responses[undefined]` on the next screen.
  //
  // Content configs should therefore define prompts as module-level consts and
  // spread the same reference into multiple screens, not inline-literal a
  // fresh object per screen.
  //
  // `allBlocksWithPromptIndex` and `sectionScreensMap` share the same counter
  // + seen-map so both views agree on which prompt owns which index.
  const { allBlocksWithPromptIndex, sectionScreensMap } = useMemo(() => {
    const blocks = [];
    const map = {};
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

    (config.sections || []).forEach((section) => {
      if (section.type !== 'screens' || !section.screens) return;

      map[section.id] = section.screens.map((screen) => {
        const expanded = expandScreenToBlocks(screen, '');
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
  }, [config]);

  const sections = useMemo(() => config.sections || [], [config.sections]);
  const currentSection = sections[currentSectionIndex];
  const currentSectionScreens = currentSection?.type === 'screens'
    ? (sectionScreensMap[currentSection.id] || currentSection.screens || [])
    : [];

  // ── Derived sessionData (for conditions + custom blocks) ────────────────────
  const sessionData = useMemo(() => {
    const modules = storeState.modules || {};
    const history = modules.history || [];
    const sessionProfile = storeState.sessionProfile || {};
    const booster = storeState.booster || {};

    // Effective focus: transitionData override or sessionProfile.primaryFocus
    const effectiveFocus = transitionData?.newFocus || sessionProfile.primaryFocus || null;

    return {
      modulesCompleted: history
        .filter((m) => m.status === 'completed')
        .map((m) => m.libraryId),
      boosterStatus: booster.status,
      boosterTaken: booster.status === 'taken',
      primaryFocus: sessionProfile.primaryFocus,
      effectiveFocus,
    };
  }, [storeState, transitionData]);

  const conditionContext = useMemo(() => ({
    choiceValues,
    selectorValues,
    visitedSections,
    sessionData,
    storeState,
  }), [choiceValues, selectorValues, visitedSections, sessionData, storeState]);

  // ── Persist navigation state to activeNavigation whenever it changes ────────
  // Also mirrors any prompts/selectors with `storeField` to their target store
  // locations at the same cadence — so when a user advances a screen, values
  // flow from local state into sessionProfile/transitionData before the next
  // screen renders.
  //
  // Selectors use the same `storeField` convention as prompts. The config is
  // expected to point selectors at *new* paths (e.g. `transitionData.newFocus`)
  // rather than overwriting existing intake values like `sessionProfile.primaryFocus`
  // — the intake answer stays preserved for session export, and any in-session
  // override is read via the `effectiveFocus` derivation above.
  useEffect(() => {
    if (!didInitialize.current) return;
    updateTransitionData('activeNavigation', {
      transitionId,
      currentSectionIndex,
      visitedSections,
      routeStack,
      sectionHistory,
      screenIndex,
      responses,
      selectorValues,
      selectorJournals,
      choiceValues,
      blockReadiness: persistedNav?.blockReadiness || {},
    });

    // Mirror storeField prompts + selectors. Dedupe by storeField path so
    // content configs that repeat a selector across multiple conditional
    // screens (e.g. per-focus sub-type selectors sharing the same key) don't
    // issue redundant store writes.
    const writtenPaths = new Set();
    allBlocksWithPromptIndex.forEach((block) => {
      if (!block.storeField) return;
      if (writtenPaths.has(block.storeField)) return;

      let value;
      if (block.type === 'prompt') {
        value = responses[block.promptIndex];
      } else if (block.type === 'selector') {
        value = selectorValues[block.key];
      } else {
        return;
      }
      if (value == null || value === '') return;
      if (Array.isArray(value) && value.length === 0) return;

      writtenPaths.add(block.storeField);
      if (block.storeField.startsWith('sessionProfile.')) {
        const field = block.storeField.slice('sessionProfile.'.length);
        updateSessionProfile(field, value);
      } else if (block.storeField.startsWith('transitionData.')) {
        const path = block.storeField.slice('transitionData.'.length);
        updateTransitionData(path, value);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSectionIndex, visitedSections, routeStack, screenIndex]);

  // ── Auto-sync selectors/choices to store as a side effect (not inside setters) ──
  // Avoids the "setState inside functional updater causes render-phase store write" warning.
  useEffect(() => {
    if (!didInitialize.current) return;
    updateTransitionData('activeNavigation.selectorValues', selectorValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectorValues]);

  useEffect(() => {
    if (!didInitialize.current) return;
    updateTransitionData('activeNavigation.choiceValues', choiceValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choiceValues]);

  useEffect(() => {
    if (!didInitialize.current) return;
    updateTransitionData('activeNavigation.selectorJournals', selectorJournals);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectorJournals]);

  // ── Response handlers ───────────────────────────────────────────────────────

  // Prompts: local update only. The persist effect above mirrors values
  // (including any `storeField` prompts to their target store paths) on every
  // screen/section advance. This is the hybrid sync strategy — local while
  // typing, flushed on advance — so we avoid per-keystroke localStorage writes.
  const setPromptResponse = useCallback((index, value) => {
    setResponses((prev) => ({ ...prev, [index]: value }));
  }, []);

  // Selectors: local update. Store sync happens via useEffect above.
  const toggleSelector = useCallback((key, optionId, multiSelect) => {
    setSelectorValues((prev) => {
      if (multiSelect) {
        const current = prev[key] || [];
        return current.includes(optionId)
          ? { ...prev, [key]: current.filter((id) => id !== optionId) }
          : { ...prev, [key]: [...current, optionId] };
      }
      return { ...prev, [key]: prev[key] === optionId ? null : optionId };
    });
  }, []);

  const setSelectorJournal = useCallback((key, value) => {
    setSelectorJournals((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Choices: local update. Store sync happens via useEffect above.
  const setChoiceValue = useCallback((key, optionId) => {
    setChoiceValues((prev) => ({ ...prev, [key]: optionId }));
  }, []);

  // ── Flush responses (prompt + selector values) to store + storeField paths ──
  const flushResponses = useCallback(() => {
    updateTransitionData('activeNavigation.responses', responses);

    // Mirror any prompts or selectors with storeField to their target store
    // location. Dedupe by storeField path — selectors sharing a key across
    // conditional screens (e.g. per-focus sub-type selectors) emit once.
    const writtenPaths = new Set();
    allBlocksWithPromptIndex.forEach((block) => {
      if (!block.storeField) return;
      if (writtenPaths.has(block.storeField)) return;

      let value;
      if (block.type === 'prompt') {
        value = responses[block.promptIndex];
      } else if (block.type === 'selector') {
        value = selectorValues[block.key];
      } else {
        return;
      }
      if (value == null) return;
      if (Array.isArray(value) && value.length === 0) return;

      writtenPaths.add(block.storeField);
      if (block.storeField.startsWith('sessionProfile.')) {
        const field = block.storeField.slice('sessionProfile.'.length);
        updateSessionProfile(field, value);
      } else if (block.storeField.startsWith('transitionData.')) {
        const path = block.storeField.slice('transitionData.'.length);
        updateTransitionData(path, value);
      }
    });
  }, [responses, selectorValues, allBlocksWithPromptIndex, updateTransitionData, updateSessionProfile]);

  // ── Navigation actions ──────────────────────────────────────────────────────

  const sectionIndexById = useCallback((id) => {
    return sections.findIndex((s) => s.id === id);
  }, [sections]);

  const advanceSection = useCallback(() => {
    flushResponses();

    // Mark current section visited
    const currentId = currentSection?.id;
    if (currentId) {
      setVisitedSections((prev) =>
        prev.includes(currentId) ? prev : [...prev, currentId]
      );
    }

    // Terminal sections end the module regardless of what sits after them.
    if (currentSection?.terminal === true) {
      setModulePhase('complete');
      return;
    }

    // Pop from route stack if returning from a routed section. Go directly
    // to `continuationIndex` — the content author explicitly bookmarked that
    // section as the return point, so skip-visited must NOT walk past it.
    // (Skip-visited still applies on the subsequent sequential advance from
    // the bookmark target; see the next branch.) Required for the Crossroads
    // pattern where the bookmark target is already visited.
    //
    // History handling: bookmark-pop closes a "side trip" rather than taking
    // a new forward step. Don't push the completed detour onto sectionHistory,
    // and pop the gate's entry that `routeToSection` wrote on entry. The net
    // effect: the round-trip leaves no history residue, so Back from the gate
    // returns to what was before the gate, not back into the completed detour.
    if (routeStack.length > 0) {
      const continuationIndex = routeStack[routeStack.length - 1];
      setRouteStack((prev) => prev.slice(0, -1));
      if (continuationIndex < sections.length) {
        setSectionHistory((prev) => (
          prev.length > 0 && prev[prev.length - 1] === continuationIndex
            ? prev.slice(0, -1)
            : prev
        ));
        setCurrentSectionIndex(continuationIndex);
        setScreenIndex(0);
      } else {
        setModulePhase('complete');
      }
      return;
    }

    // Normal sequential advance — skip already-visited sections. Back-nav
    // un-visits the section being left, so pressing Back then Continue still
    // re-traverses linearly without the skip kicking in.
    let nextIndex = currentSectionIndex + 1;
    while (nextIndex < sections.length && visitedSections.includes(sections[nextIndex]?.id)) {
      nextIndex++;
    }
    if (nextIndex >= sections.length) {
      setModulePhase('complete');
    } else {
      setSectionHistory((prev) => [...prev, currentSectionIndex]);
      setCurrentSectionIndex(nextIndex);
      setScreenIndex(0);
    }
  }, [currentSection, currentSectionIndex, sections, routeStack, visitedSections, flushResponses]);

  const routeToSection = useCallback((routeConfig) => {
    flushResponses();

    const cfg = typeof routeConfig === 'string' ? { to: routeConfig } : routeConfig;

    // Mark current visited before leaving
    const currentId = currentSection?.id;
    if (currentId) {
      setVisitedSections((prev) =>
        prev.includes(currentId) ? prev : [...prev, currentId]
      );
    }

    // Special routes
    if (cfg.to === '_next') { advanceSection(); return; }
    if (cfg.to === '_complete') { setModulePhase('complete'); return; }

    const targetIndex = sectionIndexById(cfg.to);
    if (targetIndex === -1) { advanceSection(); return; }

    // Bookmark handling
    if (cfg.bookmark) {
      const bookmarkIndex = cfg.bookmark === true
        ? currentSectionIndex + 1
        : sectionIndexById(cfg.bookmark);
      if (bookmarkIndex >= 0 && bookmarkIndex < sections.length) {
        setRouteStack((prev) => [...prev, bookmarkIndex]);
      }
    }

    setSectionHistory((prev) => [...prev, currentSectionIndex]);
    setCurrentSectionIndex(targetIndex);
    setScreenIndex(0);
  }, [currentSection, currentSectionIndex, sections, sectionIndexById, advanceSection, flushResponses]);

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
    // `routeStack` (i.e. the user is returning to their bookmark manually
    // rather than via advanceSection's pop), drop that stale stack entry.
    // Otherwise a subsequent Continue would trigger the pop and land the
    // user on the section they're already on (a silent no-op advance).
    if (routeStack.length > 0 && routeStack[routeStack.length - 1] === prevIndex) {
      setRouteStack((prev) => prev.slice(0, -1));
    }

    setCurrentSectionIndex(prevIndex);
    setScreenIndex(0);
  }, [sectionHistory, currentSection, routeStack]);

  const canGoBackToPreviousSection = useMemo(() => {
    return sectionHistory.length > 0;
  }, [sectionHistory]);

  // Screen-change callback from ScreensSection (for progress + persistence)
  const handleScreenChange = useCallback((position, _total) => {
    setScreenIndex(position);
  }, []);

  // ── Completion flow ─────────────────────────────────────────────────────────

  const flushCaptures = useCallback(() => {
    flushResponses();

    // Write completion timestamp
    const tId = mapTransitionIdToDataKey(transitionId);
    if (tId) {
      updateTransitionData(`completedAt.${tId}`, Date.now());
    }

    // Assemble + save journal entry
    if (config.journal?.saveOnComplete) {
      const entryText = assembleJournalEntry({
        titlePrefix: config.journal.titlePrefix || transitionId.toUpperCase(),
        allScreens: allBlocksWithPromptIndex,
        responses,
        selectorValues,
        selectorJournals,
        conditionContext: { choiceValues, selectorValues, visitedSections, storeState },
        storeState,
      });
      if (entryText.split('\n').length > 1) {
        addEntry({
          content: entryText,
          source: 'session',
          moduleTitle: transitionId,
        });
      }
    }
  }, [
    flushResponses, transitionId, config, allBlocksWithPromptIndex,
    responses, selectorValues, selectorJournals, choiceValues, visitedSections,
    storeState, updateTransitionData, addEntry,
  ]);

  const clearActiveNavigation = useCallback(() => {
    updateTransitionData('activeNavigation', {
      transitionId: null,
      currentSectionIndex: 0,
      visitedSections: [],
      routeStack: [],
      sectionHistory: [],
      screenIndex: 0,
      responses: {},
      selectorValues: {},
      selectorJournals: {},
      choiceValues: {},
      blockReadiness: {},
    });
  }, [updateTransitionData]);

  return {
    // Navigation
    modulePhase,
    currentSection,
    currentSectionIndex,
    currentSectionScreens,
    visitedSections,
    routeStack,
    canGoBackToPreviousSection,

    // Data
    responses,
    selectorValues,
    selectorJournals,
    choiceValues,
    allBlocksWithPromptIndex,

    // Derived
    sessionData,
    storeState,
    conditionContext,

    // Actions
    advanceSection,
    routeToSection,
    goBackToPreviousSection,
    handleScreenChange,

    // Response handlers
    setPromptResponse,
    toggleSelector,
    setSelectorJournal,
    setChoiceValue,

    // Lifecycle
    flushResponses,    // persist pending responses only (no journal entry write)
    flushCaptures,     // flushResponses + timestamp + journal entry
    clearActiveNavigation,
    setModulePhase,
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

function collectAllBlocks(config) {
  const blocks = [];
  (config.sections || []).forEach((section) => {
    if (section.type === 'screens' && section.screens) {
      section.screens.forEach((screen) => {
        const expanded = expandScreenToBlocks(screen, '');
        expanded.forEach((b) => blocks.push(b));
      });
    }
  });
  return blocks;
}

function resolveStorePath(path, state) {
  const parts = path.split('.');
  let value = state;
  for (const part of parts) {
    if (value == null || typeof value !== 'object') return undefined;
    value = value[part];
  }
  return value;
}

/**
 * Maps a transitionId (e.g., 'peak-to-integration') to the corresponding key
 * in transitionData.completedAt ('integration').
 */
function mapTransitionIdToDataKey(transitionId) {
  switch (transitionId) {
    case 'opening-ritual': return 'opening';
    case 'peak-transition': return 'peak';
    case 'peak-to-integration': return 'integration';
    case 'closing-ritual': return 'closing';
    default: return null;
  }
}

