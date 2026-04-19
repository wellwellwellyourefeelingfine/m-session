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
      const prepopulated = {};
      const blocks = collectAllBlocks(config);
      let promptCounter = 0;
      blocks.forEach((b) => {
        if (b.type === 'prompt') {
          if (b.storeField) {
            const value = resolveStorePath(b.storeField, storeState);
            if (value) prepopulated[promptCounter] = value;
          }
          promptCounter++;
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
  const allBlocksWithPromptIndex = useMemo(() => {
    const blocks = [];
    let promptCounter = 0;
    (config.sections || []).forEach((section) => {
      if (section.type === 'screens' && section.screens) {
        section.screens.forEach((screen) => {
          const expanded = expandScreenToBlocks(screen, '');
          expanded.forEach((block) => {
            if (block.type === 'prompt') {
              blocks.push({ ...block, promptIndex: promptCounter++, sectionId: section.id });
            } else {
              blocks.push({ ...block, sectionId: section.id });
            }
          });
        });
      }
    });
    return blocks;
  }, [config]);

  const sectionScreensMap = useMemo(() => {
    const map = {};
    let promptCounter = 0;
    (config.sections || []).forEach((section) => {
      if (section.type === 'screens' && section.screens) {
        map[section.id] = section.screens.map((screen) => {
          const expanded = expandScreenToBlocks(screen, '');
          const indexedBlocks = expanded.map((block) => {
            if (block.type === 'prompt') {
              return { ...block, promptIndex: promptCounter++ };
            }
            return block;
          });
          return { ...screen, blocks: indexedBlocks };
        });
      }
    });
    return map;
  }, [config]);

  const sections = config.sections || [];
  const currentSection = sections[currentSectionIndex];
  const currentSectionScreens = currentSection?.type === 'screens'
    ? (sectionScreensMap[currentSection.id] || currentSection.screens || [])
    : [];

  // ── Derived sessionData (for conditions + custom blocks) ────────────────────
  const sessionData = useMemo(() => {
    const modules = storeState.modules || {};
    const history = modules.history || [];
    const journalEntries = useJournalStore.getState().entries || [];
    const sessionProfile = storeState.sessionProfile || {};
    const timeline = storeState.timeline || {};
    const booster = storeState.booster || {};

    // Effective focus: transitionData override or sessionProfile.primaryFocus
    const effectiveFocus = transitionData?.newFocus || sessionProfile.primaryFocus || null;

    return {
      modulesCompleted: history
        .filter((m) => m.status === 'completed')
        .map((m) => m.libraryId),
      modulesSkipped: history
        .filter((m) => m.status === 'skipped')
        .map((m) => m.libraryId),
      boosterStatus: booster.status,
      boosterTaken: booster.status === 'taken',
      journalCount: journalEntries.length,
      helperUsedDuring: classifyHelperUsageByPhase(journalEntries, timeline.phases),
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
  // Also mirrors any prompts with `storeField` to their target store locations
  // at the same cadence — so when a user advances a screen, values flow from
  // local state into sessionProfile/transitionData before the next screen renders.
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

    // Mirror storeField prompts (e.g. intention → sessionProfile.holdingQuestion)
    allBlocksWithPromptIndex.forEach((block) => {
      if (block.type !== 'prompt' || !block.storeField) return;
      const value = responses[block.promptIndex];
      if (value == null || value === '') return;
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

  // ── Flush responses (prompt values) to store + storeField paths ─────────────
  const flushResponses = useCallback(() => {
    updateTransitionData('activeNavigation.responses', responses);

    // Mirror any prompts with storeField to their target store location
    allBlocksWithPromptIndex.forEach((block) => {
      if (block.type !== 'prompt' || !block.storeField) return;
      const value = responses[block.promptIndex];
      if (value == null) return;

      // Only sessionProfile.* paths are supported via updateSessionProfile
      if (block.storeField.startsWith('sessionProfile.')) {
        const field = block.storeField.slice('sessionProfile.'.length);
        updateSessionProfile(field, value);
      } else if (block.storeField.startsWith('transitionData.')) {
        const path = block.storeField.slice('transitionData.'.length);
        updateTransitionData(path, value);
      }
    });
  }, [responses, allBlocksWithPromptIndex, updateTransitionData, updateSessionProfile]);

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

    // Pop from route stack if returning from a routed section.
    // After a bookmark pop we DO skip already-visited sections — this prevents
    // replaying the section we routed to when sequential advance catches up.
    if (routeStack.length > 0) {
      const continuationIndex = routeStack[routeStack.length - 1];
      setRouteStack((prev) => prev.slice(0, -1));
      let nextIndex = continuationIndex;
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
    setCurrentSectionIndex(prevIndex);
    setScreenIndex(0);
  }, [sectionHistory, currentSection]);

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
    flushCaptures,
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

/**
 * Derives a per-phase boolean for "did the user use the HelperModal during this phase?"
 * by scanning journal entries for helper entries and classifying each by timestamp
 * against the timeline's phase boundaries.
 *
 * Helper entries are identified by source: 'session' and moduleTitle starting with
 * 'HELPER MODAL' or similar markers (HelperModal writes `moduleTitle: 'Helper Modal'`).
 */
function classifyHelperUsageByPhase(journalEntries, phases) {
  const result = { comeUp: false, peak: false, integration: false };
  if (!phases) return result;

  const comeUpStart = phases.comeUp?.startedAt;
  const comeUpEnd = phases.comeUp?.endedAt;
  const peakStart = phases.peak?.startedAt;
  const peakEnd = phases.peak?.endedAt;
  const integrationStart = phases.integration?.startedAt;
  const integrationEnd = phases.integration?.endedAt;

  for (const entry of journalEntries) {
    const title = (entry.moduleTitle || '').toLowerCase();
    const isHelperEntry = title.includes('helper modal') || title.includes('helper');
    if (!isHelperEntry) continue;

    const ts = entry.createdAt || entry.timestamp;
    if (!ts) continue;

    if (comeUpStart && (!comeUpEnd || ts <= comeUpEnd) && ts >= comeUpStart) {
      result.comeUp = true;
    }
    if (peakStart && (!peakEnd || ts <= peakEnd) && ts >= peakStart) {
      result.peak = true;
    }
    if (integrationStart && (!integrationEnd || ts <= integrationEnd) && ts >= integrationStart) {
      result.integration = true;
    }
  }

  return result;
}
