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

export default function useMasterModuleState(content, module) {
  // ── Navigation state ──────────────────────────────────────────────────────

  const [modulePhase, setModulePhase] = useState('idle'); // 'idle' | 'active' | 'complete'
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);

  // Route stack for choice-based branching.
  // When a choice routes to a non-sequential section, we push the "continuation index"
  // (the index after the choice's parent section) onto the stack.
  // When the routed section completes, we pop and resume from the continuation.
  const [routeStack, setRouteStack] = useState([]);

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

  // Build a flat list of all blocks with global prompt indices assigned.
  // Walks screens → blocks so multi-prompt screens get separate indices.
  const allBlocksWithPromptIndex = useMemo(() => {
    if (!content?.sections) return [];
    let promptCounter = 0;
    const blocks = [];
    content.sections.forEach((section) => {
      if (section.type === 'screens' && section.screens) {
        section.screens.forEach((screen) => {
          const expanded = expandScreenToBlocks(screen, module.title);
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
  }, [content, module.title]);

  // Build per-section screens with blocks expanded and prompt indices assigned.
  // Each screen in the map has a `blocks` array with prompt indices set.
  const sectionScreensMap = useMemo(() => {
    if (!content?.sections) return {};
    let promptCounter = 0;
    const map = {};
    content.sections.forEach((section) => {
      if (section.type === 'screens' && section.screens) {
        map[section.id] = section.screens.map((screen) => {
          const expanded = expandScreenToBlocks(screen, module.title);
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
  }, [content, module.title]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const sections = content?.sections || [];
  const currentSection = sections[currentSectionIndex];

  // Get screens for the current section with global prompt indices applied
  const currentSectionScreens = currentSection?.type === 'screens'
    ? (sectionScreensMap[currentSection.id] || currentSection.screens || [])
    : [];

  // Resolve a section ID to its index
  const sectionIndexById = useCallback((id) => {
    return sections.findIndex((s) => s.id === id);
  }, [sections]);

  // Check if back navigation can go to a previous screens section
  const canGoBackToPreviousSection = useMemo(() => {
    if (currentSectionIndex === 0) return false;
    // Only go back to a previous 'screens' section (not meditation/timer)
    for (let i = currentSectionIndex - 1; i >= 0; i--) {
      if (sections[i].type === 'screens') return true;
      // Stop at non-screens sections (don't cross meditation/timer boundaries)
      break;
    }
    return false;
  }, [currentSectionIndex, sections]);

  // ── Journal store ─────────────────────────────────────────────────────────

  const addEntry = useJournalStore((state) => state.addEntry);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;

  // ── Actions ───────────────────────────────────────────────────────────────

  const begin = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      setModulePhase('active');
      setIsLeaving(false);
    }, FADE_MS);
  }, []);

  const advanceSection = useCallback(() => {
    // Track that we completed this section
    if (currentSection?.id) {
      setVisitedSections((prev) =>
        prev.includes(currentSection.id) ? prev : [...prev, currentSection.id]
      );
    }

    // Check if we should pop from route stack (returning from a routed section)
    if (routeStack.length > 0) {
      const continuationIndex = routeStack[routeStack.length - 1];
      setRouteStack((prev) => prev.slice(0, -1));
      if (continuationIndex < sections.length) {
        setCurrentSectionIndex(continuationIndex);
        return;
      }
    }

    // Normal sequential advance — skip already-visited sections
    let nextIndex = currentSectionIndex + 1;
    while (nextIndex < sections.length && visitedSections.includes(sections[nextIndex]?.id)) {
      nextIndex++;
    }
    if (nextIndex >= sections.length) {
      setModulePhase('complete');
    } else {
      setCurrentSectionIndex(nextIndex);
    }
  }, [currentSectionIndex, sections, routeStack, visitedSections]);

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
    if (config.to === '_complete') { setModulePhase('complete'); return; }

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
    for (let i = currentSectionIndex - 1; i >= 0; i--) {
      if (sections[i].type === 'screens') {
        setCurrentSectionIndex(i);
        return;
      }
      break;
    }
  }, [currentSectionIndex, sections]);

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

  // ── Skip handler (saves partial data) ─────────────────────────────────────

  const handleSkip = useCallback((onSkip) => {
    // Save whatever we have so far
    if (content?.journal?.saveOnComplete) {
      const entryText = assembleJournalEntry({
        titlePrefix: content.journal.titlePrefix || module.title?.toUpperCase() || 'MODULE',
        allScreens: allBlocksWithPromptIndex,
        responses,
        selectorValues,
        selectorJournals,
        conditionContext: { choiceValues, selectorValues, visitedSections },
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
  }, [content, module.title, allBlocksWithPromptIndex, responses, selectorValues, selectorJournals, choiceValues, visitedSections, addEntry, sessionId]);

  return {
    // Navigation
    modulePhase,
    currentSection,
    currentSectionIndex,
    currentSectionScreens,
    isLeaving,
    canGoBackToPreviousSection,

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
