/**
 * TheCycleModule Component
 *
 * Part 2 of the linked EFT relationship module pair.
 * Two modes:
 * - Solo: journaling-first relationship pattern mapping
 * - Couple: facilitated conversation guide with discussion prompts and turn-taking
 *
 * Phase sequence (~26 phases):
 * framing → bridge → friction → positions-intro → your-move → your-underneath →
 *   [couple: partner-turn → sharing]
 *   [solo: their-move → their-underneath] →
 * pre-reveal → reveal-anim → reveal-modal → sitting →
 * med-intro → meditation →
 * capture → checkin → response →
 * psychoed-1 → psychoed-2 → psychoed-3 →
 * reflect-1 → reflect-2 → reflect-3 →
 * [conditional: journey-close] →
 * closing
 *
 * Reads Part 1 data from transitionCaptures.theDescent for personalization.
 */

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  getMeditationById,
  generateTimedSequence,
  estimateMeditationDurationSeconds,
  resolveEffectiveVoiceId,
} from '../../../content/meditations';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';
import { useTranscriptModal } from '../../../hooks/useTranscriptModal';
import { useJournalStore } from '../../../stores/useJournalStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useAppStore } from '../../../stores/useAppStore';
import { saveImage } from '../../../utils/imageStorage';

import {
  getMovesForPosition,
  getPartnerPosition,
  getMoveLabel,
  POSITIONS,
  CYCLE_ACCENT_TERMS,
  FRAMING_CONTENT,
  BRIDGE_CONTENT,
  FRICTION_SCREEN,
  POSITIONS_INTRO,
  YOUR_MOVE_SCREEN,
  YOUR_UNDERNEATH_SCREEN,
  PARTNER_TURN_SCREEN,
  SHARING_SCREEN,
  THEIR_MOVE_SCREEN,
  THEIR_UNDERNEATH_SCREEN,
  PRE_REVEAL_CONTENT,
  CYCLE_NAMING_TEXT,
  SITTING_CONTENT,
  MEDITATION_INTRO_CONTENT,
  CAPTURE_SCREEN,
  CYCLE_CHECKIN_HEADER,
  CYCLE_CHECKIN_SUBTEXT,
  CYCLE_CHECKIN_COUPLE_NOTE,
  CYCLE_CHECKIN_OPTIONS,
  CYCLE_TAILORED_RESPONSES,
  CYCLE_PSYCHOED_SCREENS,
  REFLECT_1_SCREEN,
  REFLECT_2_SCREEN,
  REFLECT_3_SCREEN,
  JOURNEY_CLOSE_SCREEN,
  CLOSING_CONTENT,
} from '../../../content/modules/theCycleContent';

// Shared UI
import ModuleLayout, { VoicePill } from '../capabilities/ModuleLayout';
import ModuleControlBar, { VolumeButton, SlotButton } from '../capabilities/ModuleControlBar';
import MorphingShapes from '../capabilities/animations/MorphingShapes';
import AsciiMoon from '../capabilities/animations/AsciiMoon';
import AsciiDiamond from '../capabilities/animations/AsciiDiamond';
import LeafDrawV2 from '../capabilities/animations/LeafDrawV2';
import RevealOverlay from '../capabilities/animations/RevealOverlay';
import TranscriptModal, { TranscriptIcon } from '../capabilities/TranscriptModal';

// Cycle-specific
import CycleDiagram from './shared/cycle/CycleDiagram';
import { exportCycleAsPNG } from './shared/cycle/exportCycleAsPNG';
import CycleModal from './shared/cycle/CycleModal';

// ─── Constants ──────────────────────────────────────────────────────────────

const FADE_MS = 400;
const CYCLE_NAME_MAX = 60;

// ─── ViewCycleIcon (for control bar slot) ────────────────────────────────────

function ViewCycleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="8" cy="5" rx="5" ry="3.5" />
      <ellipse cx="8" cy="11" rx="5" ry="3.5" />
    </svg>
  );
}

// ─── Render helpers ─────────────────────────────────────────────────────────

function renderContentLines(lines) {
  return (
    <div className="space-y-0">
      {lines.map((line, i) => {
        // Circle spacer
        if (line === '\u00A7') {
          return (
            <div key={i} className="flex justify-center my-4">
              <div className="circle-spacer" />
            </div>
          );
        }

        // Numbered line with accent number
        const numMatch = line.match(/^\{#(\d+)\}\s*(.*)/);
        if (numMatch) {
          return (
            <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              <span className="text-[var(--accent)] font-medium">{numMatch[1]}</span>
              {' \u2014 '}{numMatch[2]}
            </p>
          );
        }

        // Accent term highlighting
        let hasAccent = false;
        for (const key of Object.keys(CYCLE_ACCENT_TERMS)) {
          if (line.includes(`{${key}}`)) {
            hasAccent = true;
            break;
          }
        }

        if (hasAccent) {
          const parts = [];
          let remaining = line;
          let partIndex = 0;

          while (remaining.length > 0) {
            let earliest = -1;
            let earliestKey = null;
            for (const key of Object.keys(CYCLE_ACCENT_TERMS)) {
              const idx = remaining.indexOf(`{${key}}`);
              if (idx !== -1 && (earliest === -1 || idx < earliest)) {
                earliest = idx;
                earliestKey = key;
              }
            }

            if (earliest === -1) {
              parts.push(<span key={partIndex++}>{remaining}</span>);
              break;
            }

            if (earliest > 0) {
              parts.push(<span key={partIndex++}>{remaining.substring(0, earliest)}</span>);
            }

            parts.push(
              <span key={partIndex++} className="text-[var(--accent)]">
                {CYCLE_ACCENT_TERMS[earliestKey]}
              </span>
            );

            remaining = remaining.substring(earliest + earliestKey.length + 2);
          }

          return (
            <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {parts}
            </p>
          );
        }

        return (
          <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TheCycleModule({ module, onComplete, onSkip, onProgressUpdate }) {
  const meditation = getMeditationById('the-cycle-closing');

  // Store integration
  const addEntry = useJournalStore((state) => state.addEntry);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;
  const updateTheCycleCapture = useSessionStore((s) => s.updateTheCycleCapture);

  // Part 1 data
  const descentCaptures = useSessionStore((s) => s.transitionCaptures?.theDescent);
  const hasDescentData = descentCaptures?.completedAt != null;
  const [mode, setMode] = useState(descentCaptures?.mode || 'solo');

  // ─── State ──────────────────────────────────────────────────────────────

  const [phase, setPhase] = useState('framing');
  const [isPhaseVisible, setIsPhaseVisible] = useState(true);

  // Pre-meditation
  const [myPosition, setMyPosition] = useState(null);
  const [friction, setFriction] = useState('');
  const [myMoveId, setMyMoveId] = useState(null);
  const [myMoveMotivation, setMyMoveMotivation] = useState('');
  const [yourUnderneath, setYourUnderneath] = useState('');

  // Solo: guessed partner info
  const [theirMoveId, setTheirMoveId] = useState(null);
  const [theirUnderneath, setTheirUnderneath] = useState('');

  // Couple: partner's actual info
  const [partnerPosition, setPartnerPosition] = useState(null);
  const [partnerMoveId, setPartnerMoveId] = useState(null);
  const [partnerUnderneath, setPartnerUnderneath] = useState('');
  const [partnerStep, setPartnerStep] = useState(0);

  // Naming + diagram
  const [cycleName, setCycleName] = useState('');
  const [diagramBlob, setDiagramBlob] = useState(null);
  const [diagramUrl, setDiagramUrl] = useState(null);
  const [showRevealOverlay, setShowRevealOverlay] = useState(false);
  const [revealKey, setRevealKey] = useState(0);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [cycleModalClosing, setCycleModalClosing] = useState(false);
  const revealTimerRef = useRef(null);
  const cycleCloseTimerRef = useRef(null);

  // Meditation
  const [isMedLeaving, setIsMedLeaving] = useState(false);
  const { showTranscript, transcriptClosing, handleOpenTranscript, handleCloseTranscript } = useTranscriptModal();
  const defaultVoiceId = useAppStore((s) => s.preferences?.defaultVoiceId);
  const voices = meditation?.audio?.voices;
  const [selectedVoiceId, setSelectedVoiceId] = useState(() =>
    resolveEffectiveVoiceId(meditation?.audio, defaultVoiceId)
  );

  // Post-meditation
  const [meditationCapture, setMeditationCapture] = useState('');
  const [checkInResponse, setCheckInResponse] = useState(null);
  const [psychoedStep, setPsychoedStep] = useState(0);
  const [isPsychoedVisible, setIsPsychoedVisible] = useState(true);
  const [isPsychoedHeaderVisible, setIsPsychoedHeaderVisible] = useState(false);

  // Reflection journals
  const [journalSurprise, setJournalSurprise] = useState('');
  const [journalOtherSide, setJournalOtherSide] = useState('');
  const [journalStepOut, setJournalStepOut] = useState('');
  const [journeyReflection, setJourneyReflection] = useState('');

  // Couple notepad toggle
  const [notepadExpanded, setNotepadExpanded] = useState({});

  // ─── Diagram data assembly ────────────────────────────────────────────

  const diagramMyMoves = useMemo(() => (myMoveId ? [myMoveId] : []), [myMoveId]);
  const diagramPartnerMoves = useMemo(
    () => (mode === 'couple'
      ? (partnerMoveId ? [partnerMoveId] : [])
      : (theirMoveId ? [theirMoveId] : [])),
    [mode, partnerMoveId, theirMoveId]
  );

  // ─── Phase transitions ────────────────────────────────────────────────

  const fadeToPhase = useCallback((nextPhase) => {
    setIsPhaseVisible(false);
    setTimeout(() => {
      document.querySelector('main')?.scrollTo(0, 0);
      setPhase(nextPhase);
      setIsPhaseVisible(true);
    }, FADE_MS);
  }, []);

  // Hide timer for non-meditation phases
  useEffect(() => {
    if (phase !== 'meditation') {
      onProgressUpdate?.({ showTimer: false, progress: 0, elapsed: 0, total: 0, isPaused: false });
    }
  }, [phase, onProgressUpdate]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (diagramUrl) URL.revokeObjectURL(diagramUrl);
    };
  }, [diagramUrl]);

  // ─── Navigation ───────────────────────────────────────────────────────

  const getNextPhase = useCallback((current) => {
    switch (current) {
      case 'framing': return 'bridge';
      case 'bridge': return 'friction';
      case 'friction': return 'positions-intro';
      case 'positions-intro': return 'your-move';
      case 'your-move': return 'your-underneath';
      case 'your-underneath': return mode === 'couple' ? 'partner-turn' : 'their-move';
      case 'partner-turn': return 'sharing';
      case 'sharing': return 'pre-reveal';
      case 'their-move': return 'their-underneath';
      case 'their-underneath': return 'pre-reveal';
      case 'reveal-modal': return 'sitting';
      case 'sitting': return 'med-intro';
      case 'capture': return 'checkin';
      case 'checkin': return 'response';
      case 'response': return 'psychoed-1';
      case 'psychoed-1': return 'psychoed-2';
      case 'psychoed-2': return 'psychoed-3';
      case 'psychoed-3': return 'reflect-1';
      case 'reflect-1': return 'reflect-2';
      case 'reflect-2': return 'reflect-3';
      case 'reflect-3': return hasDescentData ? 'journey-close' : 'closing';
      case 'journey-close': return 'closing';
      default: return current;
    }
  }, [mode, hasDescentData]);

  const getPrevPhase = useCallback((current) => {
    switch (current) {
      case 'bridge': return 'framing';
      case 'friction': return 'bridge';
      case 'positions-intro': return 'friction';
      case 'your-move': return 'positions-intro';
      case 'your-underneath': return 'your-move';
      case 'partner-turn': return 'your-underneath';
      case 'sharing': return 'partner-turn';
      case 'their-move': return 'your-underneath';
      case 'their-underneath': return 'their-move';
      case 'pre-reveal': return mode === 'couple' ? 'sharing' : 'their-underneath';
      case 'sitting': return 'reveal-modal';
      case 'med-intro': return 'sitting';
      case 'checkin': return 'capture';
      case 'response': return 'checkin';
      case 'psychoed-1': return 'response';
      case 'psychoed-2': return 'psychoed-1';
      case 'psychoed-3': return 'psychoed-2';
      case 'reflect-1': return 'psychoed-3';
      case 'reflect-2': return 'reflect-1';
      case 'reflect-3': return 'reflect-2';
      case 'journey-close': return 'reflect-3';
      case 'closing': return hasDescentData ? 'journey-close' : 'reflect-3';
      default: return null;
    }
  }, [mode, hasDescentData]);

  // ─── Timed sequence (closing meditation) ──────────────────────────────

  const [timedSequence, totalDuration] = useMemo(() => {
    if (!meditation) return [[], 0];
    const clips = meditation.assembleVariation(mode);
    const sequence = generateTimedSequence(clips, 1.0, {
      audioConfig: meditation.audio,
      voiceId: selectedVoiceId,
    });
    const total = sequence.length > 0
      ? sequence[sequence.length - 1].endTime
      : estimateMeditationDurationSeconds(meditation, { variationKey: mode, voiceId: selectedVoiceId });
    return [sequence, total];
  }, [meditation, mode, selectedVoiceId]);

  const transcriptPrompts = useMemo(() => {
    if (!meditation) return [];
    return meditation.assembleVariation(mode);
  }, [meditation, mode]);

  const transcriptTitle = meditation
    ? `${meditation.title} (${meditation.variations[mode]?.label || mode})`
    : '';

  // ─── Meditation playback ──────────────────────────────────────────────

  const handleMeditationComplete = useCallback(() => {
    fadeToPhase('capture');
  }, [fadeToPhase]);

  const handleMeditationSkip = useCallback(() => {
    fadeToPhase('capture');
  }, [fadeToPhase]);

  const playback = useMeditationPlayback({
    meditationId: 'the-cycle-closing',
    moduleInstanceId: module.instanceId,
    timedSequence,
    totalDuration,
    onComplete: handleMeditationComplete,
    onSkip: handleMeditationSkip,
    onProgressUpdate,
  });

  useEffect(() => {
    if (playback.hasStarted && !playback.isLoading && phase === 'med-intro') {
      setPhase('meditation');
    }
  }, [playback.hasStarted, playback.isLoading, phase]);

  useEffect(() => {
    if (playback.hasStarted) return;
    const nextEffective = resolveEffectiveVoiceId(meditation?.audio, defaultVoiceId);
    if (nextEffective && nextEffective !== selectedVoiceId) {
      setSelectedVoiceId(nextEffective);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally not re-running when selectedVoiceId changes locally
  }, [defaultVoiceId, playback.hasStarted, meditation]);

  const handleBeginMeditation = useCallback(() => {
    setIsMedLeaving(true);
    setTimeout(() => playback.handleStart(), 300);
  }, [playback]);

  // ─── Diagram reveal sequence ──────────────────────────────────────────

  const handleDiagramReveal = useCallback(async () => {
    // Match ValuesCompassModule pattern: hide modal, show overlay, generate behind overlay
    setShowCycleModal(false);
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    setRevealKey(k => k + 1);
    setShowRevealOverlay(true);

    let blob;
    try {
      blob = await exportCycleAsPNG({
        myMoves: diagramMyMoves,
        partnerMoves: diagramPartnerMoves,
        cycleName,
        myPosition,
        partnerPosition: mode === 'couple' ? partnerPosition : undefined,
      });
      setDiagramBlob(blob);
      const url = URL.createObjectURL(blob);
      if (diagramUrl) URL.revokeObjectURL(diagramUrl);
      setDiagramUrl(url);
    } catch (err) {
      setShowRevealOverlay(false);
      console.warn('Cycle diagram generation failed:', err);
      return;
    }

    // Save diagram to journal
    try {
      const partnerPos = mode === 'couple' ? partnerPosition : getPartnerPosition(myPosition);
      const myMoveLabel = myMoveId ? getMoveLabel(myPosition, myMoveId) : '';
      const partnerLabel = mode === 'couple'
        ? (partnerMoveId ? getMoveLabel(partnerPos, partnerMoveId) : '')
        : (theirMoveId ? getMoveLabel(partnerPos, theirMoveId) : '');

      const ts = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      let content = 'THE CYCLE\n';
      content += `\nMode: ${mode}`;
      content += `\nFriction: ${friction.trim() || `[no entry — ${ts}]`}`;
      content += `\nMy position: ${myPosition}`;
      content += `\nMy move: ${myMoveLabel || `[no entry — ${ts}]`}`;
      content += `\nMy underneath: ${yourUnderneath.trim() || `[no entry — ${ts}]`}`;
      content += `\nTheir move: ${partnerLabel || `[no entry — ${ts}]`}`;
      if (mode === 'couple') {
        content += `\nTheir underneath: ${partnerUnderneath.trim() || `[no entry — ${ts}]`}`;
      } else {
        content += `\nTheir underneath (imagined): ${theirUnderneath.trim() || `[no entry — ${ts}]`}`;
      }
      content += `\nCycle name: ${cycleName || `[no entry — ${ts}]`}`;

      const entry = addEntry({
        content,
        source: 'session',
        sessionId,
        moduleTitle: 'The Cycle',
        hasImage: true,
      });
      if (entry?.id && blob) {
        await saveImage(entry.id, blob);
      }
    } catch (err) {
      console.warn('Failed to save cycle diagram to journal:', err);
    }

    // Show cycle modal behind overlay (overlay is still opaque ~900ms after fade-in starts)
    revealTimerRef.current = setTimeout(() => setShowCycleModal(true), 900);
  }, [diagramMyMoves, diagramPartnerMoves, cycleName, myPosition, partnerPosition, diagramUrl, mode, friction, myMoveId, yourUnderneath, theirMoveId, theirUnderneath, partnerMoveId, partnerUnderneath, addEntry, sessionId]);

  const handleRevealDone = useCallback(() => {
    setShowRevealOverlay(false);
    setPhase('reveal-modal');
  }, []);

  // ─── Cycle modal controls ────────────────────────────────────────────

  const handleCloseCycleModal = useCallback(() => {
    // Close from reveal-modal: fade modal out, then advance to sitting
    setIsPhaseVisible(false);
    setCycleModalClosing(true);
    if (cycleCloseTimerRef.current) clearTimeout(cycleCloseTimerRef.current);
    cycleCloseTimerRef.current = setTimeout(() => {
      setShowCycleModal(false);
      setCycleModalClosing(false);
      setPhase('sitting');
      setIsPhaseVisible(true);
    }, FADE_MS);
  }, []);

  const handleCloseCycleView = useCallback(() => {
    // Close from later phases (SlotButton view): just fade modal out
    setCycleModalClosing(true);
    if (cycleCloseTimerRef.current) clearTimeout(cycleCloseTimerRef.current);
    cycleCloseTimerRef.current = setTimeout(() => {
      setShowCycleModal(false);
      setCycleModalClosing(false);
    }, FADE_MS);
  }, []);

  const handleViewCycle = useCallback(() => {
    if (diagramUrl) {
      setShowCycleModal(true);
      setCycleModalClosing(false);
    }
  }, [diagramUrl]);

  // ─── Notepad toggle (couple mode) ─────────────────────────────────────

  const toggleNotepad = useCallback((key) => {
    setNotepadExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ─── Forward navigation ───────────────────────────────────────────────

  const handleContinue = useCallback(() => {
    const next = getNextPhase(phase);

    // First Begin press (from the idle/framing page) — stamp startedAt.
    // Subsequent Continue presses within the flow do not re-stamp.
    if (phase === 'framing') {
      useSessionStore.getState().beginModule(module.instanceId);
    }

    // Special: entering psychoed from response
    if (phase === 'response') {
      setIsPhaseVisible(false);
      setTimeout(() => {
        document.querySelector('main')?.scrollTo(0, 0);
        setPhase('psychoed-1');
        setPsychoedStep(0);
        setIsPhaseVisible(true);
        setIsPsychoedHeaderVisible(true);
        setIsPsychoedVisible(true);
      }, FADE_MS);
      return;
    }

    // Special: stepping within psychoed
    if (phase === 'psychoed-1' || phase === 'psychoed-2') {
      setIsPsychoedVisible(false);
      setTimeout(() => {
        document.querySelector('main')?.scrollTo(0, 0);
        const nextStep = psychoedStep + 1;
        setPsychoedStep(nextStep);
        setPhase(`psychoed-${nextStep + 1}`);
        setIsPsychoedVisible(true);
      }, FADE_MS);
      return;
    }

    // Special: exiting psychoed
    if (phase === 'psychoed-3') {
      setIsPsychoedVisible(false);
      setIsPsychoedHeaderVisible(false);
      setTimeout(() => {
        document.querySelector('main')?.scrollTo(0, 0);
        setPhase('reflect-1');
        setIsPhaseVisible(true);
      }, FADE_MS);
      return;
    }

    // Special: pre-reveal triggers overlay + diagram build (phase stays until handleRevealDone)
    if (phase === 'pre-reveal') {
      handleDiagramReveal();
      return;
    }

    fadeToPhase(next);
  }, [phase, psychoedStep, getNextPhase, fadeToPhase, handleDiagramReveal, module.instanceId]);

  // ─── Back navigation ──────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    // Special: partner-turn sub-steps
    if (phase === 'partner-turn' && partnerStep > 0) {
      setPartnerStep(partnerStep - 1);
      return;
    }

    const prev = getPrevPhase(phase);
    if (!prev) return;

    // Special: back from psychoed-1 → response (header fades out)
    if (phase === 'psychoed-1') {
      setIsPsychoedVisible(false);
      setIsPsychoedHeaderVisible(false);
      setTimeout(() => {
        document.querySelector('main')?.scrollTo(0, 0);
        setPhase('response');
        setIsPhaseVisible(true);
      }, FADE_MS);
      return;
    }

    // Special: back within psychoed
    if (phase === 'psychoed-2' || phase === 'psychoed-3') {
      setIsPsychoedVisible(false);
      setTimeout(() => {
        document.querySelector('main')?.scrollTo(0, 0);
        const prevStep = psychoedStep - 1;
        setPsychoedStep(prevStep);
        setPhase(`psychoed-${prevStep + 1}`);
        setIsPsychoedVisible(true);
      }, FADE_MS);
      return;
    }

    // Special: back from sitting → reopen cycle modal
    if (phase === 'sitting') {
      setIsPhaseVisible(false);
      setTimeout(() => {
        setPhase('reveal-modal');
        setShowCycleModal(true);
      }, FADE_MS);
      return;
    }

    // Special: back to psychoed from reflect-1
    if (phase === 'reflect-1') {
      setIsPhaseVisible(false);
      setTimeout(() => {
        document.querySelector('main')?.scrollTo(0, 0);
        setPhase('psychoed-3');
        setPsychoedStep(2);
        setIsPsychoedVisible(true);
        setIsPsychoedHeaderVisible(true);
      }, FADE_MS);
      return;
    }

    fadeToPhase(prev);
  }, [phase, partnerStep, psychoedStep, getPrevPhase, fadeToPhase]);

  // ─── Save + complete ──────────────────────────────────────────────────

  const saveAllCaptures = useCallback(() => {
    updateTheCycleCapture('mode', mode);
    updateTheCycleCapture('myPosition', myPosition);
    if (friction.trim()) updateTheCycleCapture('friction', friction.trim());
    if (myMoveId) updateTheCycleCapture('myMoveId', myMoveId);
    if (myMoveMotivation.trim()) updateTheCycleCapture('myMoveMotivation', myMoveMotivation.trim());
    if (yourUnderneath.trim()) updateTheCycleCapture('yourUnderneath', yourUnderneath.trim());
    if (theirMoveId) updateTheCycleCapture('theirMoveId', theirMoveId);
    if (theirUnderneath.trim()) updateTheCycleCapture('theirUnderneath', theirUnderneath.trim());
    if (partnerPosition) updateTheCycleCapture('partnerPosition', partnerPosition);
    if (partnerMoveId) updateTheCycleCapture('partnerMoveId', partnerMoveId);
    if (partnerUnderneath.trim()) updateTheCycleCapture('partnerUnderneath', partnerUnderneath.trim());
    updateTheCycleCapture('cycleName', cycleName);
    if (meditationCapture.trim()) updateTheCycleCapture('meditationCapture', meditationCapture.trim());
    if (checkInResponse) updateTheCycleCapture('checkInResponse', checkInResponse);
    if (journalSurprise.trim()) updateTheCycleCapture('journalSurprise', journalSurprise.trim());
    if (journalOtherSide.trim()) updateTheCycleCapture('journalOtherSide', journalOtherSide.trim());
    if (journalStepOut.trim()) updateTheCycleCapture('journalStepOut', journalStepOut.trim());
    if (journeyReflection.trim()) updateTheCycleCapture('journeyReflection', journeyReflection.trim());
    updateTheCycleCapture('completedAt', Date.now());
  }, [mode, myPosition, friction, myMoveId, myMoveMotivation, yourUnderneath, theirMoveId, theirUnderneath, partnerMoveId, partnerUnderneath, cycleName, meditationCapture, checkInResponse, journalSurprise, journalOtherSide, journalStepOut, journeyReflection, updateTheCycleCapture]);

  const buildReflectionJournal = useCallback(() => {
    const ts = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    let content = 'THE CYCLE \u2014 Reflections\n';

    content += `\nFirst impressions\n${meditationCapture.trim() || `[no entry — ${ts}]`}\n`;

    if (checkInResponse) {
      const option = CYCLE_CHECKIN_OPTIONS.find(o => o.id === checkInResponse);
      content += `\nCheck-in: ${option?.label || checkInResponse}\n`;
    }

    content += `\nWhat surprised me\n${journalSurprise.trim() || `[no entry — ${ts}]`}\n`;
    content += `\nThe other side\n${journalOtherSide.trim() || `[no entry — ${ts}]`}\n`;
    content += `\nOne different move\n${journalStepOut.trim() || `[no entry — ${ts}]`}\n`;
    content += `\nCarrying forward\n${journeyReflection.trim() || `[no entry — ${ts}]`}\n`;

    return content.trim();
  }, [meditationCapture, checkInResponse, journalSurprise, journalOtherSide, journalStepOut, journeyReflection]);

  const handleComplete = useCallback(() => {
    const content = buildReflectionJournal();
    addEntry({
      content,
      source: 'session',
      sessionId,
      moduleTitle: 'The Cycle',
    });

    saveAllCaptures();
    setIsPhaseVisible(false);
    setTimeout(() => onComplete(), FADE_MS);
  }, [buildReflectionJournal, addEntry, sessionId, saveAllCaptures, onComplete]);

  const handleModuleSkip = useCallback(() => {
    if (myPosition) updateTheCycleCapture('myPosition', myPosition);
    if (mode) updateTheCycleCapture('mode', mode);
    if (myMoveId) updateTheCycleCapture('myMoveId', myMoveId);
    if (cycleName) updateTheCycleCapture('cycleName', cycleName);
    onSkip();
  }, [myPosition, mode, myMoveId, cycleName, updateTheCycleCapture, onSkip]);

  // ─── Shared control bar props ─────────────────────────────────────────

  const cycleSlot = diagramUrl ? (
    <SlotButton
      icon={<ViewCycleIcon />}
      label="View cycle"
      onClick={handleViewCycle}
    />
  ) : null;

  // ─── Preamble selection helpers ───────────────────────────────────────

  const getReflect2Preamble = () => {
    return checkInResponse === 'heavy'
      ? REFLECT_2_SCREEN.solo.preamble.heavy
      : REFLECT_2_SCREEN.solo.preamble.default;
  };

  const getReflect3Preamble = () => {
    if (checkInResponse === 'ready') return REFLECT_3_SCREEN.solo.preamble.ready;
    if (checkInResponse === 'heavy') return REFLECT_3_SCREEN.solo.preamble.heavy;
    return REFLECT_3_SCREEN.solo.preamble.default;
  };

  const getReflect3Instruction = () => {
    if (checkInResponse === 'ready') return REFLECT_3_SCREEN.couple.instruction.ready;
    if (checkInResponse === 'heavy') return REFLECT_3_SCREEN.couple.instruction.heavy;
    return REFLECT_3_SCREEN.couple.instruction.default;
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  const renderPhaseContent = () => {

  // ─── Framing (intro) ──────────────────────────────────────────────────

  if (phase === 'framing') {
    const modeNote = mode === 'couple'
      ? (hasDescentData ? FRAMING_CONTENT.modeNote.coupleWithPart1 : FRAMING_CONTENT.modeNote.coupleWithoutPart1)
      : FRAMING_CONTENT.modeNote.solo;

    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <div
            className={`text-center transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ marginTop: '-2rem' }}
          >
            <div className="space-y-2">
              <h2 className="font-serif text-2xl text-[var(--color-text-primary)]" style={{ textTransform: 'none' }}>
                {FRAMING_CONTENT.header}
              </h2>
              <p className="uppercase tracking-wider text-xs text-[var(--color-text-tertiary)]">
                {FRAMING_CONTENT.subtitle}
              </p>
            </div>

            <div className="flex justify-center my-4">
              <AsciiMoon />
            </div>

            <p className="tracking-wider text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {FRAMING_CONTENT.description}
            </p>

            <div className="flex justify-center my-4">
              <div className="circle-spacer" />
            </div>

            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed italic">
              {modeNote}
            </p>

            <button
              onClick={() => setMode(mode === 'couple' ? 'solo' : 'couple')}
              className="mt-4 text-xs text-[var(--color-text-tertiary)] underline underline-offset-2 decoration-[var(--color-text-tertiary)]/40 hover:text-[var(--color-text-secondary)] transition-colors"
            >
              {mode === 'couple' ? 'Switch to solo' : 'Switch to couple'}
            </button>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="idle"
          primary={{ label: 'Begin', onClick: handleContinue }}
          showSkip={true}
          onSkip={onSkip}
          skipConfirmMessage="Skip this exercise?"
        />
      </>
    );
  }

  // ─── Bridge (psychoed transition from Part 1) ───────────────────────

  if (phase === 'bridge') {
    const bridgeLines = hasDescentData ? BRIDGE_CONTENT.withPartData.lines : BRIDGE_CONTENT.withoutPartData.lines;
    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-2 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {FRAMING_CONTENT.header}
            </h2>

            <div className="flex justify-center mb-4">
              <LeafDrawV2 />
            </div>

            {renderContentLines(bridgeLines)}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip this exercise?"
        />
      </>
    );
  }

  // ─── Friction ─────────────────────────────────────────────────────────

  if (phase === 'friction') {
    const modeContent = mode === 'couple' ? FRICTION_SCREEN.couple : FRICTION_SCREEN.solo;
    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {FRICTION_SCREEN.header}
            </h2>

            <div className="flex justify-center mb-4">
              <LeafDrawV2 />
            </div>

            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-4">
              {mode === 'couple' ? modeContent.instruction : modeContent.prompt}
            </p>

            <textarea
              value={friction}
              onChange={(e) => setFriction(e.target.value)}
              placeholder={modeContent.placeholder}
              rows={modeContent.rows}
              className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                focus:outline-none focus:border-[var(--accent)]
                text-[var(--color-text-primary)] text-sm leading-relaxed
                placeholder:text-[var(--color-text-tertiary)] resize-none"
            />
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip this exercise?"
        />
      </>
    );
  }

  // ─── Positions Intro (psych-ed: move toward / move away) ────────────

  if (phase === 'positions-intro') {
    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-2 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {POSITIONS_INTRO.header}
            </h2>

            <div className="flex justify-center mb-4">
              <LeafDrawV2 />
            </div>

            {renderContentLines(POSITIONS_INTRO.lines)}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip this exercise?"
        />
      </>
    );
  }

  // ─── Your Move (position + single move select + motivation) ───────────

  if (phase === 'your-move') {
    const modeContent = mode === 'couple' ? YOUR_MOVE_SCREEN.couple : YOUR_MOVE_SCREEN.solo;
    const availableMoves = myPosition ? getMovesForPosition(myPosition) : [];

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-2 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '6rem' }}>
            <h2 className="font-serif text-xl text-[var(--color-text-primary)] text-center mb-4" style={{ textTransform: 'none' }}>
              {modeContent.header}
            </h2>

            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-4">
              {modeContent.prompt}
            </p>

            {/* Position selector */}
            <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-3">
              When things get hard, I tend to...
            </p>
            <div className="space-y-2 mb-6">
              {Object.values(POSITIONS).map(pos => (
                <button
                  key={pos.key}
                  onClick={() => { setMyPosition(pos.key); setMyMoveId(null); }}
                  className={`w-full text-left px-4 py-3 border transition-colors ${
                    myPosition === pos.key
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                  }`}
                >
                  <p className="text-base text-[var(--color-text-primary)] font-['DM_Serif_Text']">
                    {pos.label}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5 uppercase tracking-wider">
                    {pos.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Single move selection */}
            {myPosition && (
              <div className="animate-fadeIn">
                <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-3">
                  Select your primary move
                </p>
                <div className="space-y-2">
                  {availableMoves.map(move => (
                    <button
                      key={move.id}
                      onClick={() => setMyMoveId(move.id)}
                      className={`w-full text-left px-4 py-3 border transition-colors ${
                        myMoveId === move.id
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                          : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                      }`}
                    >
                      <p className="text-sm text-[var(--color-text-primary)]">{move.label}</p>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                        {move.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Motivation textarea (shown after move selected) */}
            {myMoveId && (
              <div className="animate-fadeIn mt-6">
                <p className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider mb-1">
                  {modeContent.journalPrompt}
                </p>
                <textarea
                  value={myMoveMotivation}
                  onChange={(e) => setMyMoveMotivation(e.target.value)}
                  placeholder={modeContent.journalPlaceholder}
                  rows={3}
                  className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                    focus:outline-none focus:border-[var(--accent)]
                    text-[var(--color-text-primary)] text-sm leading-relaxed
                    placeholder:text-[var(--color-text-tertiary)] resize-none"
                />
              </div>
            )}

            {mode === 'couple' && myMoveId && (
              <p className="text-[var(--color-text-tertiary)] text-xs mt-4 italic">
                {modeContent.note}
              </p>
            )}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{
            label: 'Continue',
            onClick: handleContinue,
            disabled: !myPosition || !myMoveId,
          }}
          showBack={true}
          onBack={handleBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip this exercise?"
        />
      </>
    );
  }

  // ─── Your Underneath ──────────────────────────────────────────────────

  if (phase === 'your-underneath') {
    const modeContent = mode === 'couple' ? YOUR_UNDERNEATH_SCREEN.couple : YOUR_UNDERNEATH_SCREEN.solo;
    const part1Emotion = descentCaptures?.primaryEmotion;
    const showQuote = hasDescentData && part1Emotion;

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-2 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {modeContent.header}
            </h2>

            <div className="flex justify-center mb-4">
              <LeafDrawV2 />
            </div>

            {showQuote ? (
              <>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-3">
                  {modeContent.prompt.withPart1Quote}
                </p>
                <blockquote className="border-l-2 border-[var(--accent)] pl-4 mb-3">
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed italic">
                    {part1Emotion}
                  </p>
                </blockquote>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-4">
                  {modeContent.prompt.withPart1After}
                </p>
              </>
            ) : (
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-4">
                {hasDescentData ? modeContent.prompt.withPart1 : modeContent.prompt.withoutPart1}
              </p>
            )}

            {mode === 'couple' && (
              <p className="text-[var(--color-text-tertiary)] text-xs mb-4 italic">
                {modeContent.note}
              </p>
            )}

            <textarea
              value={yourUnderneath}
              onChange={(e) => setYourUnderneath(e.target.value)}
              placeholder={modeContent.placeholder}
              rows={modeContent.rows}
              className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                focus:outline-none focus:border-[var(--accent)]
                text-[var(--color-text-primary)] text-sm leading-relaxed
                placeholder:text-[var(--color-text-tertiary)] resize-none"
            />
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip this exercise?"
        />
      </>
    );
  }

  // ─── Partner Turn (couple only — 2 sub-steps) ────────────────────────

  if (phase === 'partner-turn') {
    const partnerMovesOptions = partnerPosition ? getMovesForPosition(partnerPosition) : [];

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-2 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '6rem' }}>
            <h2
              className="text-xl font-light mb-2 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {PARTNER_TURN_SCREEN.header}
            </h2>

            <p className="text-[var(--color-text-secondary)] text-sm text-center mb-6">
              {PARTNER_TURN_SCREEN.intro}
            </p>

            {partnerStep === 0 && (
              <div className="animate-fadeIn">
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-4">
                  {PARTNER_TURN_SCREEN.step1.prompt}
                </p>

                {/* Position selector — matching Your Move pattern */}
                <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-3">
                  When things get hard, I tend to...
                </p>
                <div className="space-y-2 mb-6">
                  {Object.values(POSITIONS).map(pos => (
                    <button
                      key={pos.key}
                      onClick={() => { setPartnerPosition(pos.key); setPartnerMoveId(null); }}
                      className={`w-full text-left px-4 py-3 border transition-colors ${
                        partnerPosition === pos.key
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                          : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                      }`}
                    >
                      <p className="text-base text-[var(--color-text-primary)] font-['DM_Serif_Text']">
                        {pos.label}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5 uppercase tracking-wider">
                        {pos.description}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Move selector — shown after position selected */}
                {partnerPosition && (
                  <div className="animate-fadeIn">
                    <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-3">
                      Select your primary move
                    </p>
                    <div className="space-y-2">
                      {partnerMovesOptions.map(move => (
                        <button
                          key={move.id}
                          onClick={() => setPartnerMoveId(move.id)}
                          className={`w-full text-left px-4 py-3 border transition-colors ${
                            partnerMoveId === move.id
                              ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                              : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                          }`}
                        >
                          <p className="text-sm text-[var(--color-text-primary)]">{move.label}</p>
                          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                            {move.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {partnerStep === 1 && (
              <div className="animate-fadeIn">
                <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-2">
                  {PARTNER_TURN_SCREEN.step2.subheader}
                </p>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-4">
                  {PARTNER_TURN_SCREEN.step2.prompt}
                </p>
                <textarea
                  value={partnerUnderneath}
                  onChange={(e) => setPartnerUnderneath(e.target.value)}
                  placeholder={PARTNER_TURN_SCREEN.step2.placeholder}
                  rows={PARTNER_TURN_SCREEN.step2.rows}
                  className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                    focus:outline-none focus:border-[var(--accent)]
                    text-[var(--color-text-primary)] text-sm leading-relaxed
                    placeholder:text-[var(--color-text-tertiary)] resize-none"
                />
                <p className="text-[var(--color-text-tertiary)] text-xs mt-3 italic">
                  {PARTNER_TURN_SCREEN.step2.note}
                </p>
              </div>
            )}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{
            label: 'Continue',
            onClick: () => {
              if (partnerStep === 0) {
                setPartnerStep(1);
              } else {
                handleContinue();
              }
            },
            disabled: partnerStep === 0 ? !partnerPosition || !partnerMoveId : false,
          }}
          showBack={true}
          onBack={handleBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip this exercise?"
        />
      </>
    );
  }

  // ─── Sharing (couple only) ────────────────────────────────────────────

  if (phase === 'sharing') {
    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {SHARING_SCREEN.header}
            </h2>

            {renderContentLines(SHARING_SCREEN.lines)}

            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mt-6 italic">
              {SHARING_SCREEN.postShare}
            </p>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip this exercise?"
        />
      </>
    );
  }

  // ─── Their Move (solo only) ───────────────────────────────────────────

  if (phase === 'their-move') {
    const partnerPosition = getPartnerPosition(myPosition);
    const availableMoves = getMovesForPosition(partnerPosition);

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-2 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '6rem' }}>
            <h2 className="font-serif text-xl text-[var(--color-text-primary)] text-center mb-4" style={{ textTransform: 'none' }}>
              {THEIR_MOVE_SCREEN.header}
            </h2>

            <div className="mb-4">
              {renderContentLines(THEIR_MOVE_SCREEN.lines)}
            </div>

            <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-3">
              {THEIR_MOVE_SCREEN.prompt}
            </p>
            <div className="space-y-2">
              {availableMoves.map(move => (
                <button
                  key={move.id}
                  onClick={() => setTheirMoveId(move.id)}
                  className={`w-full text-left px-4 py-3 border transition-colors ${
                    theirMoveId === move.id
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                  }`}
                >
                  <p className="text-sm text-[var(--color-text-primary)]">{move.label}</p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                    {move.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{
            label: 'Continue',
            onClick: handleContinue,
            disabled: !theirMoveId,
          }}
          showBack={true}
          onBack={handleBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip this exercise?"
        />
      </>
    );
  }

  // ─── Their Underneath (solo only) ─────────────────────────────────────

  if (phase === 'their-underneath') {
    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {THEIR_UNDERNEATH_SCREEN.header}
            </h2>

            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-4">
              {THEIR_UNDERNEATH_SCREEN.prompt}
            </p>

            <textarea
              value={theirUnderneath}
              onChange={(e) => setTheirUnderneath(e.target.value)}
              placeholder={THEIR_UNDERNEATH_SCREEN.placeholder}
              rows={THEIR_UNDERNEATH_SCREEN.rows}
              className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                focus:outline-none focus:border-[var(--accent)]
                text-[var(--color-text-primary)] text-sm leading-relaxed
                placeholder:text-[var(--color-text-tertiary)] resize-none"
            />
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip this exercise?"
        />
      </>
    );
  }

  // ─── Pre-Reveal (naming + diagram preview) ────────────────────────────

  if (phase === 'pre-reveal') {
    const preRevealText = mode === 'couple' ? PRE_REVEAL_CONTENT.couple : PRE_REVEAL_CONTENT.solo;

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-2 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '6rem' }}>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-6 text-center">
              {preRevealText}
            </p>

            <input
              type="text"
              value={cycleName}
              onChange={(e) => setCycleName(e.target.value.slice(0, CYCLE_NAME_MAX))}
              placeholder={CYCLE_NAMING_TEXT.placeholder}
              maxLength={CYCLE_NAME_MAX}
              className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                focus:outline-none focus:border-[var(--accent)]
                text-[var(--color-text-primary)] text-sm text-center
                placeholder:text-[var(--color-text-tertiary)] mb-2"
            />
            <p className="text-[10px] text-[var(--color-text-tertiary)] text-center mb-6">
              {cycleName.length}/{CYCLE_NAME_MAX}
            </p>

            <CycleDiagram
              myMoves={diagramMyMoves}
              partnerMoves={diagramPartnerMoves}
              cycleName={cycleName}
              myPosition={myPosition}
              partnerPosition={mode === 'couple' ? partnerPosition : undefined}
              animate={true}
            />
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{
            label: 'Reveal',
            onClick: handleContinue,
            disabled: !cycleName.trim(),
          }}
          showBack={true}
          onBack={handleBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip this exercise?"
        />
      </>
    );
  }

  // ─── Reveal Modal (empty — CycleModal fills the screen) ─────────────

  if (phase === 'reveal-modal') {
    return null;
  }

  // ─── Sitting (post-reveal reflection) ─────────────────────────────────

  if (phase === 'sitting') {
    const sittingContent = mode === 'couple' ? SITTING_CONTENT.couple : SITTING_CONTENT.solo;

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-2 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              The Cycle
            </h2>

            <div className="flex justify-center mb-4">
              <AsciiMoon />
            </div>

            {renderContentLines(sittingContent.lines)}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          rightSlot={cycleSlot}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip this exercise?"
        />
      </>
    );
  }

  // ─── Meditation Intro ─────────────────────────────────────────────────

  if (phase === 'med-intro') {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          {!playback.isLoading ? (
            <div className={`text-center ${isMedLeaving ? 'animate-fadeOut' : 'animate-fadeIn'}`} style={{ marginTop: '-2rem' }}>
              <h2 className="font-serif text-xl text-[var(--color-text-primary)] mb-4" style={{ textTransform: 'none' }}>
                {MEDITATION_INTRO_CONTENT.header}
              </h2>

              <div className="text-left mb-6">
                {renderContentLines(MEDITATION_INTRO_CONTENT.lines)}
              </div>

              {Array.isArray(voices) && voices.length >= 1 && (
                <VoicePill
                  voices={voices}
                  selectedVoiceId={selectedVoiceId}
                  onVoiceChange={setSelectedVoiceId}
                />
              )}
            </div>
          ) : (
            <div className="text-center animate-fadeIn">
              <p className="text-[var(--color-text-tertiary)] text-sm uppercase tracking-wider">
                Preparing meditation...
              </p>
            </div>
          )}
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{
            label: 'Begin',
            onClick: playback.isLoading ? () => {} : handleBeginMeditation,
          }}
          showBack={true}
          onBack={handleBack}
          rightSlot={cycleSlot}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the closing meditation?"
        />
      </>
    );
  }

  // ─── Meditation (playback) ────────────────────────────────────────────

  if (phase === 'meditation') {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <div
            className="flex flex-col items-center text-center w-full px-4 animate-fadeIn"
            style={{
              alignSelf: 'stretch',
              minHeight: 'var(--meditation-page-min-height)',
            }}
          >
            <h2
              className="text-xl font-light mb-6"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {meditation?.title || 'Closing Meditation'}
            </h2>

            <MorphingShapes />

            <div className="h-5 flex items-center justify-center mt-3">
              {!playback.isPlaying && !playback.isComplete && (
                <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider animate-pulse">
                  Paused
                </p>
              )}
            </div>

            <p
              className={`mt-1 px-4 text-[var(--color-text-secondary)] text-sm leading-relaxed transition-opacity duration-300 ${
                playback.promptPhase === 'visible' || playback.promptPhase === 'fading-in' ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {playback.currentPrompt?.text || ''}
            </p>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={playback.getPrimaryButton()}
          showSkip={true}
          onSkip={playback.handleSkip}
          skipConfirmMessage="Skip this meditation?"
          showSeekControls={playback.hasStarted && !playback.isComplete && !playback.isLoading}
          onSeekBack={() => playback.handleSeekRelative(-10)}
          onSeekForward={() => playback.handleSeekRelative(10)}
          leftSlot={
            <VolumeButton
              volume={playback.audio.volume}
              onVolumeChange={playback.audio.setVolume}
            />
          }
          rightSlot={
            <SlotButton
              icon={<TranscriptIcon />}
              label="View transcript"
              onClick={handleOpenTranscript}
            />
          }
        />

        <TranscriptModal
          isOpen={showTranscript}
          closing={transcriptClosing}
          onClose={handleCloseTranscript}
          title={transcriptTitle}
          prompts={transcriptPrompts}
        />
      </>
    );
  }

  // ─── Capture ──────────────────────────────────────────────────────────

  if (phase === 'capture') {
    const captureContent = mode === 'couple' ? CAPTURE_SCREEN.couple : CAPTURE_SCREEN.solo;

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {captureContent.header}
            </h2>

            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-4">
              {mode === 'couple' ? captureContent.instruction : captureContent.preamble}
            </p>

            <textarea
              value={meditationCapture}
              onChange={(e) => setMeditationCapture(e.target.value)}
              placeholder={captureContent.placeholder}
              rows={captureContent.rows}
              className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                focus:outline-none focus:border-[var(--accent)]
                text-[var(--color-text-primary)] text-sm leading-relaxed
                placeholder:text-[var(--color-text-tertiary)] resize-none"
            />
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={false}
          rightSlot={cycleSlot}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── Check-In ─────────────────────────────────────────────────────────

  if (phase === 'checkin') {
    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-3 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {CYCLE_CHECKIN_HEADER}
            </h2>

            <p className="text-[var(--color-text-secondary)] text-sm text-center mb-6">
              {mode === 'couple' ? CYCLE_CHECKIN_COUPLE_NOTE : CYCLE_CHECKIN_SUBTEXT}
            </p>

            <div className="space-y-2">
              {CYCLE_CHECKIN_OPTIONS.map((option) => {
                const isSelected = checkInResponse === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setCheckInResponse(option.id)}
                    className={`w-full text-left px-4 py-3 border transition-colors duration-150 ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent-bg)]'
                        : 'border-[var(--color-border)] bg-transparent hover:border-[var(--color-text-tertiary)]'
                    }`}
                  >
                    <span className="text-[var(--color-text-primary)] text-sm">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{
            label: 'Continue',
            onClick: handleContinue,
            disabled: !checkInResponse,
          }}
          showBack={true}
          onBack={handleBack}
          rightSlot={cycleSlot}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── Tailored Response ────────────────────────────────────────────────

  if (phase === 'response') {
    const responseContent = CYCLE_TAILORED_RESPONSES[checkInResponse];

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {responseContent?.header}
            </h2>

            <div className="space-y-4">
              {responseContent?.paragraphs.map((para, i) => (
                <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          rightSlot={cycleSlot}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── Psychoeducation (3 screens with persistent header) ───────────────

  if (phase === 'psychoed-1' || phase === 'psychoed-2' || phase === 'psychoed-3') {
    const screen = CYCLE_PSYCHOED_SCREENS[psychoedStep];

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className="pt-2">
            {/* Persistent header + animation */}
            <div className={`transition-opacity duration-[${FADE_MS}ms] ${
              isPsychoedHeaderVisible ? 'opacity-100' : 'opacity-0'
            }`}>
              <h2
                className="text-xl font-light mb-2 text-center"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                The Cycle
              </h2>
              <div className="flex justify-center mb-4">
                <AsciiMoon />
              </div>
            </div>

            {/* Body — fades out/in on step change */}
            <div className={`transition-opacity duration-[${FADE_MS}ms] ${
              isPsychoedVisible ? 'opacity-100' : 'opacity-0'
            }`} style={{ paddingBottom: '8rem' }}>
              <div key={psychoedStep} className="animate-fadeIn">
                <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-3">
                  {screen.header}
                </p>
                {renderContentLines(screen.lines)}

                {/* Couple addition on screen 2 */}
                {mode === 'couple' && screen.coupleAddition && (
                  <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mt-4 italic">
                    {screen.coupleAddition}
                  </p>
                )}
              </div>
            </div>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          rightSlot={cycleSlot}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── Reflect 1: What surprised you ────────────────────────────────────

  if (phase === 'reflect-1') {
    const content = mode === 'couple' ? REFLECT_1_SCREEN.couple : REFLECT_1_SCREEN.solo;

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {content.header}
            </h2>

            {mode === 'solo' ? (
              <>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-4">
                  {content.preamble}
                </p>
                <p className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider mb-1">
                  {content.prompt}
                </p>
                <textarea
                  value={journalSurprise}
                  onChange={(e) => setJournalSurprise(e.target.value)}
                  placeholder={content.placeholder}
                  rows={content.rows}
                  className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                    focus:outline-none focus:border-[var(--accent)]
                    text-[var(--color-text-primary)] text-sm leading-relaxed
                    placeholder:text-[var(--color-text-tertiary)] resize-none"
                />
              </>
            ) : (
              <>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-4">
                  {content.instruction}
                </p>
                <p className="text-[var(--color-text-tertiary)] text-xs mb-4 italic">
                  {content.timeSuggestion}
                </p>
                <button
                  onClick={() => toggleNotepad('reflect-1')}
                  className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-2"
                >
                  {notepadExpanded['reflect-1'] ? '\u25BE Hide notepad' : '\u25B8 Write something down'}
                </button>
                {notepadExpanded['reflect-1'] && (
                  <textarea
                    value={journalSurprise}
                    onChange={(e) => setJournalSurprise(e.target.value)}
                    placeholder={content.placeholder}
                    rows={content.rows}
                    className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                      focus:outline-none focus:border-[var(--accent)]
                      text-[var(--color-text-primary)] text-sm leading-relaxed
                      placeholder:text-[var(--color-text-tertiary)] resize-none animate-fadeIn"
                  />
                )}
              </>
            )}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          rightSlot={cycleSlot}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── Reflect 2: The other side / Seeing each other ────────────────────

  if (phase === 'reflect-2') {
    const content = mode === 'couple' ? REFLECT_2_SCREEN.couple : REFLECT_2_SCREEN.solo;

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {content.header}
            </h2>

            {mode === 'solo' ? (
              <>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-4">
                  {getReflect2Preamble()}
                </p>
                <p className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider mb-1">
                  {content.prompt}
                </p>
                <textarea
                  value={journalOtherSide}
                  onChange={(e) => setJournalOtherSide(e.target.value)}
                  placeholder={content.placeholder}
                  rows={content.rows}
                  className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                    focus:outline-none focus:border-[var(--accent)]
                    text-[var(--color-text-primary)] text-sm leading-relaxed
                    placeholder:text-[var(--color-text-tertiary)] resize-none"
                />
              </>
            ) : (
              <>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-2">
                  {content.instruction}
                </p>
                <div className="space-y-3 mb-4">
                  {content.steps.map((step, i) => (
                    <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed pl-4 border-l-2 border-[var(--color-border)]">
                      {step}
                    </p>
                  ))}
                </div>
                <p className="text-[var(--color-text-tertiary)] text-xs mb-4 italic">
                  {content.timeSuggestion}
                </p>
                <button
                  onClick={() => toggleNotepad('reflect-2')}
                  className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-2"
                >
                  {notepadExpanded['reflect-2'] ? '\u25BE Hide notepad' : '\u25B8 Write something down'}
                </button>
                {notepadExpanded['reflect-2'] && (
                  <textarea
                    value={journalOtherSide}
                    onChange={(e) => setJournalOtherSide(e.target.value)}
                    placeholder={content.placeholder}
                    rows={content.rows}
                    className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                      focus:outline-none focus:border-[var(--accent)]
                      text-[var(--color-text-primary)] text-sm leading-relaxed
                      placeholder:text-[var(--color-text-tertiary)] resize-none animate-fadeIn"
                  />
                )}
              </>
            )}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          rightSlot={cycleSlot}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── Reflect 3: One different move ────────────────────────────────────

  if (phase === 'reflect-3') {
    const content = mode === 'couple' ? REFLECT_3_SCREEN.couple : REFLECT_3_SCREEN.solo;

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {content.header}
            </h2>

            {mode === 'solo' ? (
              <>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-4">
                  {getReflect3Preamble()}
                </p>
                <p className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider mb-1">
                  {content.prompt}
                </p>
                <textarea
                  value={journalStepOut}
                  onChange={(e) => setJournalStepOut(e.target.value)}
                  placeholder={content.placeholder}
                  rows={content.rows}
                  className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                    focus:outline-none focus:border-[var(--accent)]
                    text-[var(--color-text-primary)] text-sm leading-relaxed
                    placeholder:text-[var(--color-text-tertiary)] resize-none"
                />
              </>
            ) : (
              <>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-4">
                  {getReflect3Instruction()}
                </p>
                <p className="text-[var(--color-text-tertiary)] text-xs mb-4 italic">
                  {content.timeSuggestion}
                </p>
                <button
                  onClick={() => toggleNotepad('reflect-3')}
                  className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-2"
                >
                  {notepadExpanded['reflect-3'] ? '\u25BE Hide notepad' : '\u25B8 Write something down'}
                </button>
                {notepadExpanded['reflect-3'] && (
                  <textarea
                    value={journalStepOut}
                    onChange={(e) => setJournalStepOut(e.target.value)}
                    placeholder={content.placeholder}
                    rows={content.rows}
                    className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                      focus:outline-none focus:border-[var(--accent)]
                      text-[var(--color-text-primary)] text-sm leading-relaxed
                      placeholder:text-[var(--color-text-tertiary)] resize-none animate-fadeIn"
                  />
                )}
              </>
            )}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          rightSlot={cycleSlot}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── Journey Close (conditional — only if Part 1 completed) ───────────

  if (phase === 'journey-close') {
    const content = mode === 'couple' ? JOURNEY_CLOSE_SCREEN.couple : JOURNEY_CLOSE_SCREEN.solo;

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {content.header}
            </h2>

            {renderContentLines(content.lines)}

            {mode === 'solo' ? (
              <div className="mt-6">
                <p className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider mb-1">
                  {content.prompt}
                </p>
                <textarea
                  value={journeyReflection}
                  onChange={(e) => setJourneyReflection(e.target.value)}
                  placeholder={content.placeholder}
                  rows={content.rows}
                  className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                    focus:outline-none focus:border-[var(--accent)]
                    text-[var(--color-text-primary)] text-sm leading-relaxed
                    placeholder:text-[var(--color-text-tertiary)] resize-none"
                />
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-2">
                  {content.instruction}
                </p>
                <p className="text-[var(--color-text-tertiary)] text-xs mb-4 italic">
                  {content.timeSuggestion}
                </p>
                <button
                  onClick={() => toggleNotepad('journey-close')}
                  className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-2"
                >
                  {notepadExpanded['journey-close'] ? '\u25BE Hide notepad' : '\u25B8 Write something down'}
                </button>
                {notepadExpanded['journey-close'] && (
                  <textarea
                    value={journeyReflection}
                    onChange={(e) => setJourneyReflection(e.target.value)}
                    placeholder={content.placeholder}
                    rows={content.rows}
                    className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                      focus:outline-none focus:border-[var(--accent)]
                      text-[var(--color-text-primary)] text-sm leading-relaxed
                      placeholder:text-[var(--color-text-tertiary)] resize-none animate-fadeIn"
                  />
                )}
              </div>
            )}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          rightSlot={cycleSlot}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── Closing ──────────────────────────────────────────────────────────

  if (phase === 'closing') {
    const modeClosing = mode === 'couple' ? CLOSING_CONTENT.couple : CLOSING_CONTENT.solo;
    const closingLines = hasDescentData ? modeClosing.withJourney : modeClosing.standalone;

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[${FADE_MS}ms] ${isPhaseVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
            <div className="flex justify-center mb-6">
              <AsciiDiamond />
            </div>

            {renderContentLines(closingLines)}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="completed"
          primary={{ label: 'Complete', onClick: handleComplete }}
          showBack={true}
          onBack={handleBack}
          rightSlot={cycleSlot}
          showSkip={false}
        />
      </>
    );
  }

  return null;
  }; // end renderPhaseContent

  return (
    <>
      {renderPhaseContent()}

      <CycleModal
        isOpen={showCycleModal}
        closing={cycleModalClosing}
        onClose={phase === 'reveal-modal' ? handleCloseCycleModal : handleCloseCycleView}
        imageUrl={diagramUrl}
        imageBlob={diagramBlob}
      />

      <RevealOverlay
        key={revealKey}
        isActive={showRevealOverlay}
        onDone={handleRevealDone}
      />
    </>
  );
}
