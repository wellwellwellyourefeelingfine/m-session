/**
 * ShakingTheTreeModule Component
 *
 * A somatic movement practice guiding users through 5 timed sections:
 * Sway → Bounce → Shake → Move Freely → Return.
 *
 * Features:
 * - 5 psychoeducation intro screens with LeafDraw animation
 * - Duration picker (10–30 min) synced with session timeline
 * - AlarmPrompt before beginning (away-from-screen module)
 * - Sectioned movement timer with boundary-triggered transitions
 * - Cue text (3s bold display at section change) + staggered guidance lines
 * - MorphingShapes animation (default speed)
 * - Haptic pulse at section transitions (Android only)
 * - Music recommendations (18 curated tracks)
 * - 7-screen post-movement check-in with body sensation grid,
 *   tailored responses, psychoeducation, and journal integration
 *
 * Timer: Timestamp-based (Date.now + meditationPlayback store).
 * No audio playback — purely a clock.
 *
 * State machine: idle → intro → active → checkin → completion
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSessionStore } from '../../../stores/useSessionStore';
import useSyncedDuration from '../../../hooks/useSyncedDuration';
import useProgressReporter from '../../../hooks/useProgressReporter';
import { useJournalStore } from '../../../stores/useJournalStore';
import {
  INTRO_SCREENS,
  MOVEMENT_SECTIONS,
  BODY_CHECKIN_OPTIONS,
  UNNAMED_OPTION,
  LANDING_SCREEN,
  TAILORED_RESPONSES,
  REFLECT_SCREENS,
  JOURNAL_SCREEN,
  CLOSING_CONTENT,
  getResponseKey,
} from '../../../content/modules/shakingTheTreeContent';
import {
  movementRecommendations,
  getInitialMovementRecommendations,
} from '../../../content/modules/movementRecommendations';

// Shared UI components
import ModuleLayout, { CompletionScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar, { SlotButton } from '../capabilities/ModuleControlBar';
import DurationPicker from '../../shared/DurationPicker';
import AlarmPrompt from '../../shared/AlarmPrompt';
import MorphingShapes from '../capabilities/animations/MorphingShapes';
import LeafDrawV2 from '../capabilities/animations/LeafDrawV2';

// ─── Constants ───────────────────────────────────────────────────────────────

const DURATION_STEPS = [10, 15, 20, 25, 30];
const FADE_MS = 400;
const CUE_FADE_MS = 200;
const SECTION_STAGGER_MS = 1000;
const CHECKIN_STEP_COUNT = 7;

// ─── Private utilities ───────────────────────────────────────────────────────

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function hapticPulse(pattern = [50]) {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Silently fail
  }
}

/**
 * Renders an array of content lines with circle spacer and accent color support.
 * '§' renders as a single circle spacer.
 * '{#N} text' renders with an accent-colored number.
 */
function renderContentLines(lines) {
  return (
    <div className="space-y-0">
      {lines.map((line, i) => {
        // Skip § spacers — no circle spacers on check-in pages
        if (line === '§') {
          return <div key={i} className="h-3" />;
        }
        const numMatch = line.match(/^\{#(\d+)\}\s*(.*)/);
        if (numMatch) {
          return (
            <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              <span className="text-[var(--accent)] font-medium">{numMatch[1]}</span>
              {' — '}{numMatch[2]}
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

// ─── Private SVG icons ───────────────────────────────────────────────────────

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="5" y1="3" x2="14" y2="3" />
    <line x1="5" y1="8" x2="14" y2="8" />
    <line x1="5" y1="13" x2="14" y2="13" />
    <circle cx="2" cy="3" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="2" cy="8" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="2" cy="13" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);

// ─── RecommendationsWidget ───────────────────────────────────────────────────

function RecommendationsWidget({ initiallyOpen = false }) {
  const [visible, setVisible] = useState(initiallyOpen);
  const [picks, setPicks] = useState(() => getInitialMovementRecommendations());
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const queueRef = useRef([]);

  const refresh = () => {
    if (queueRef.current.length < 3) {
      const shuffled = [...movementRecommendations];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      queueRef.current = shuffled;
    }
    setPicks(queueRef.current.splice(0, 3));
  };

  if (picks.length === 0 && !visible) return null;

  return (
    <div className="w-full max-w-sm">
      {picks.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setVisible(!visible)}
            className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]
              hover:text-[var(--color-text-secondary)] transition-colors"
          >
            {visible ? 'Hide Recommendations' : 'Show Recommendations'}
            {/* Plus icon when collapsed, fades out when expanded */}
            <span
              className="inline-flex transition-opacity duration-200"
              style={{ opacity: visible ? 0 : 1, width: visible ? 0 : 'auto', overflow: 'hidden' }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="8" y1="2" x2="8" y2="14" />
                <line x1="2" y1="8" x2="14" y2="8" />
              </svg>
            </span>
          </button>
          {/* Recycle icon when expanded, fades in */}
          {visible && (
            <button
              onClick={refresh}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors animate-fadeIn"
              aria-label="Refresh recommendations"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 8a6 6 0 0 1 10.3-4.2M14 8a6 6 0 0 1-10.3 4.2" />
                <polyline points="2 3 2 6.5 5.5 6.5" />
                <polyline points="14 13 14 9.5 10.5 9.5" />
              </svg>
            </button>
          )}
        </div>
      )}

      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: visible ? '500px' : '0', opacity: visible ? 1 : 0 }}
      >
        <div className="pt-3 space-y-1">
          {picks.map((track, index) => (
            <button
              key={`${track.artist}-${track.title}-${index}`}
              onClick={() => setSelectedAlbum(track)}
              className={`w-full text-left pt-1.5 pb-0.5 ${index < picks.length - 1 ? 'border-b border-[var(--color-border)]' : ''} hover:opacity-70 transition-opacity`}
            >
              <p className="text-sm text-[var(--color-text-primary)]">
                {track.artist} — {track.title}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] -mt-0.5 normal-case tracking-normal leading-snug">
                {track.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {selectedAlbum && (
        <TrackDetailPopup track={selectedAlbum} onClose={() => setSelectedAlbum(null)} />
      )}
    </div>
  );
}

// ─── TrackDetailPopup ────────────────────────────────────────────────────────

function TrackDetailPopup({ track, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg)] border border-[var(--color-border)] p-6 max-w-xs w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--color-text-primary)] font-medium" style={{ textTransform: 'none' }}>
              {track.artist}
            </p>
            <p className="text-sm text-[var(--color-text-primary)] mt-0.5" style={{ textTransform: 'none' }}>
              {track.title}
            </p>
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)] normal-case tracking-normal leading-relaxed">
            {track.description}
          </p>
          <div className="space-y-2 pt-1">
            {track.links?.spotify && (
              <a href={track.links.spotify} target="_blank" rel="noopener noreferrer"
                className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity">
                Open in Spotify
              </a>
            )}
            {track.links?.appleMusic && (
              <a href={track.links.appleMusic} target="_blank" rel="noopener noreferrer"
                className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity">
                Open in Apple Music
              </a>
            )}
            {track.links?.youtube && (
              <a href={track.links.youtube} target="_blank" rel="noopener noreferrer"
                className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity">
                Open on YouTube
              </a>
            )}
          </div>
          <button onClick={onClose}
            className="w-full pt-2 text-xs text-[var(--color-text-tertiary)] hover:opacity-70 transition-opacity"
            style={{ textTransform: 'none' }}>
            Thanks, I can find it myself
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AllRecommendationsModal ─────────────────────────────────────────────────

function AllRecommendationsModal({ isOpen, closing, onClose }) {
  const [entered, setEntered] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    setEntered(false);
    setSelectedAlbum(null);
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-[var(--color-bg)] flex flex-col"
      style={{
        opacity: closing ? 0 : entered ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: closing ? 'none' : 'auto',
      }}
    >
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))',
          paddingBottom: '0.75rem',
        }}
      >
        <button onClick={onClose}
          className="text-[var(--color-text-secondary)] text-sm w-8 h-8 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
          All Recommendations
        </span>
        <div className="w-8" />
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-6 pb-12 pt-2">
          <div className="space-y-1 max-w-sm mx-auto">
            {movementRecommendations.map((track, index) => (
              <button
                key={`${track.artist}-${track.title}-${index}`}
                onClick={() => setSelectedAlbum(track)}
                className={`w-full text-left pt-1.5 pb-0.5 ${index < movementRecommendations.length - 1 ? 'border-b border-[var(--color-border)]' : ''} hover:opacity-70 transition-opacity`}
              >
                <p className="text-sm text-[var(--color-text-primary)]" style={{ textTransform: 'none' }}>
                  {track.artist} — {track.title}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] -mt-0.5 normal-case tracking-normal leading-snug">
                  {track.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedAlbum && (
        <TrackDetailPopup track={selectedAlbum} onClose={() => setSelectedAlbum(null)} />
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ShakingTheTreeModule({ module, onComplete, onSkip, onProgressUpdate }) {
  // Session store
  const meditationPlayback = useSessionStore((state) => state.meditationPlayback);
  const startMeditationPlayback = useSessionStore((state) => state.startMeditationPlayback);
  const pauseMeditationPlayback = useSessionStore((state) => state.pauseMeditationPlayback);
  const resumeMeditationPlayback = useSessionStore((state) => state.resumeMeditationPlayback);
  const resetMeditationPlayback = useSessionStore((state) => state.resetMeditationPlayback);
  const updateShakingTheTreeCapture = useSessionStore((state) => state.updateShakingTheTreeCapture);
  const sessionId = useSessionStore((state) => state.sessionId);

  // Journal store
  const addEntry = useJournalStore((state) => state.addEntry);

  // Playback state
  const isThisModule = meditationPlayback.moduleInstanceId === module.instanceId;
  const hasStarted = isThisModule && meditationPlayback.hasStarted;
  const isPlaying = isThisModule && meditationPlayback.isPlaying;

  // Duration (synced with session store)
  const duration = useSyncedDuration(module, { hasStarted });

  // Progress reporter (parent's ModuleStatusBar)
  const report = useProgressReporter(onProgressUpdate);

  // ── Module phase state machine ──
  const [phase, setPhase] = useState('idle');
  // 'idle' | 'intro' | 'active' | 'checkin' | 'completion'

  // ── Idle state ──
  const [showAlarmPrompt, setShowAlarmPrompt] = useState(false);
  const [isIdleVisible, setIsIdleVisible] = useState(true);

  // ── Intro state ──
  const [introStep, setIntroStep] = useState(0);
  const [isIntroBodyVisible, setIsIntroBodyVisible] = useState(true);
  const [isIntroHeaderVisible, setIsIntroHeaderVisible] = useState(true);

  // ── Active state ──
  const [currentSectionIndex, setCurrentPhaseIndex] = useState(0);
  const [guidanceVisibility, setGuidanceVisibility] = useState([true, true, true]);
  const [cueVisible, setCueVisible] = useState(true);
  const [invitationVisible, setInvitationVisible] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // ── Check-in state ──
  const [checkinStep, setCheckinStep] = useState(0);
  const [isCheckinBodyVisible, setIsCheckinBodyVisible] = useState(true);
  const [selectedSensations, setSelectedSensations] = useState([]);
  const [responseKey, setResponseKey] = useState(null);
  const [journalText, setJournalText] = useState('');

  // ── All-recommendations modal ──
  const [showAllRecs, setShowAllRecs] = useState(false);
  const [allRecsClosing, setAllRecsClosing] = useState(false);
  const allRecsCloseTimerRef = useRef(null);

  // ── Refs ──
  const sectionTransitionTimeoutsRef = useRef([]);
  const prevSectionIndexRef = useRef(0);
  const timerRef = useRef(null);

  // ── Timer ──
  const totalDurationSeconds = duration.selected * 60;

  // Timer update loop (timestamp-based, LetsDanceModule pattern)
  useEffect(() => {
    if (!isPlaying || !meditationPlayback.startedAt) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const currentSegment = (now - meditationPlayback.startedAt) / 1000;
      const newElapsed = (meditationPlayback.accumulatedTime || 0) + currentSegment;
      setElapsedTime(newElapsed);

      if (newElapsed >= totalDurationSeconds && totalDurationSeconds > 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        pauseMeditationPlayback();
        setIsComplete(true);
        setPhase('checkin');
        setCheckinStep(0);
        setIsCheckinBodyVisible(true);
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, meditationPlayback.startedAt, meditationPlayback.accumulatedTime, totalDurationSeconds, pauseMeditationPlayback]);

  // Report timer / step progress to parent (ModuleStatusBar)
  useEffect(() => {
    if (!onProgressUpdate) return;

    if (phase === 'active' && hasStarted) {
      const progress = totalDurationSeconds > 0
        ? (elapsedTime / totalDurationSeconds) * 100
        : 0;
      onProgressUpdate({
        progress,
        mode: 'timer',
        elapsed: elapsedTime,
        total: totalDurationSeconds,
        showTimer: !isComplete,
        isPaused: !isPlaying,
        currentStep: 0,
        totalSteps: 0,
      });
    } else if (phase === 'intro') {
      report.step(introStep + 1, INTRO_SCREENS.length);
    } else if (phase === 'checkin') {
      report.step(checkinStep + 1, CHECKIN_STEP_COUNT);
    } else {
      report.idle();
    }
  }, [elapsedTime, totalDurationSeconds, hasStarted, isPlaying, isComplete, onProgressUpdate, phase, introStep, checkinStep, report]);

  // ── Section boundary calculation ──
  const sectionBoundaries = useMemo(() => {
    let accumulated = 0;
    return MOVEMENT_SECTIONS.map((p) => {
      accumulated += p.pctOfTotal * totalDurationSeconds;
      return accumulated;
    });
  }, [totalDurationSeconds]);

  // ── Section transition helpers ──
  const clearSectionTransitionTimeouts = useCallback(() => {
    sectionTransitionTimeoutsRef.current.forEach(clearTimeout);
    sectionTransitionTimeoutsRef.current = [];
  }, []);

  const triggerSectionTransition = useCallback((newIndex) => {
    clearSectionTransitionTimeouts();
    hapticPulse();
    setCueVisible(false);
    setInvitationVisible(false);
    setGuidanceVisibility([false, false, false]);

    // After fade-out: update section index
    const t1 = setTimeout(() => {
      setCurrentPhaseIndex(newIndex);
    }, CUE_FADE_MS);

    const base = CUE_FADE_MS;
    // +1s: cue appears
    const t2 = setTimeout(() => setCueVisible(true), base + SECTION_STAGGER_MS);
    // +2s: invitation appears
    const t3 = setTimeout(() => setInvitationVisible(true), base + SECTION_STAGGER_MS * 2);
    // +3s: guidance bullets stagger in
    const t4 = setTimeout(() => setGuidanceVisibility([true, false, false]), base + SECTION_STAGGER_MS * 3);
    const t5 = setTimeout(() => setGuidanceVisibility([true, true, false]), base + SECTION_STAGGER_MS * 3 + 300);
    const t6 = setTimeout(() => setGuidanceVisibility([true, true, true]), base + SECTION_STAGGER_MS * 3 + 600);

    sectionTransitionTimeoutsRef.current = [t1, t2, t3, t4, t5, t6];
  }, [clearSectionTransitionTimeouts]);

  // ── Detect section changes from elapsed time ──
  useEffect(() => {
    if (phase !== 'active' || !hasStarted || isComplete) return;

    let newIndex = MOVEMENT_SECTIONS.length - 1;
    for (let i = 0; i < sectionBoundaries.length; i++) {
      if (elapsedTime < sectionBoundaries[i]) {
        newIndex = i;
        break;
      }
    }

    if (newIndex !== prevSectionIndexRef.current) {
      triggerSectionTransition(newIndex);
      prevSectionIndexRef.current = newIndex;
    }
  }, [elapsedTime, phase, hasStarted, isComplete, sectionBoundaries, triggerSectionTransition]);

  // ── Idle handlers ──
  const handleIdleBegin = useCallback(() => {
    setIsIdleVisible(false);
    setTimeout(() => {
      setPhase('intro');
      setIntroStep(0);
      setIsIntroBodyVisible(true);
      setIsIntroHeaderVisible(true);
    }, FADE_MS);
  }, []);

  // ── Intro handlers ──
  const handleIntroContinue = useCallback(() => {
    if (introStep < INTRO_SCREENS.length - 1) {
      setIsIntroBodyVisible(false);
      setTimeout(() => {
        setIntroStep((prev) => prev + 1);
        setIsIntroBodyVisible(true);
      }, FADE_MS);
    } else {
      setShowAlarmPrompt(true);
    }
  }, [introStep]);

  const handleIntroBack = useCallback(() => {
    if (introStep > 0) {
      setIsIntroBodyVisible(false);
      setTimeout(() => {
        setIntroStep((prev) => prev - 1);
        setIsIntroBodyVisible(true);
      }, FADE_MS);
    } else {
      setIsIntroBodyVisible(false);
      setIsIntroHeaderVisible(false);
      setTimeout(() => {
        setPhase('idle');
        setIsIdleVisible(true);
      }, FADE_MS);
    }
  }, [introStep]);

  const handleAlarmProceed = useCallback(() => {
    setShowAlarmPrompt(false);
    setIsIntroBodyVisible(false);
    setIsIntroHeaderVisible(false);
    setTimeout(() => {
      setPhase('active');
      setCurrentPhaseIndex(0);
      prevSectionIndexRef.current = 0;
      setGuidanceVisibility([true, true, true]);
      setCueVisible(true);
      setInvitationVisible(true);
      startMeditationPlayback(module.instanceId);
    }, FADE_MS);
  }, [module.instanceId, startMeditationPlayback]);

  // ── Active handlers ──
  const handlePauseResume = useCallback(() => {
    if (isPlaying) {
      pauseMeditationPlayback();
    } else {
      resumeMeditationPlayback();
    }
  }, [isPlaying, pauseMeditationPlayback, resumeMeditationPlayback]);

  const handleActiveBack = useCallback(() => {
    resetMeditationPlayback();
    setElapsedTime(0);
    setIsComplete(false);
    setPhase('idle');
    setIsIdleVisible(true);
  }, [resetMeditationPlayback]);

  // Skip active → advance to check-in (not end module)
  const handleActiveSkip = useCallback(() => {
    pauseMeditationPlayback();
    setIsComplete(true);
    setPhase('checkin');
    setCheckinStep(0);
    setIsCheckinBodyVisible(true);
  }, [pauseMeditationPlayback]);

  // Seek back 10 seconds
  const handleSeekBack = useCallback(() => {
    const newTime = Math.max(0, elapsedTime - 10);
    setElapsedTime(newTime);
    const state = useSessionStore.getState();
    useSessionStore.setState({
      meditationPlayback: {
        ...state.meditationPlayback,
        accumulatedTime: newTime,
        startedAt: Date.now(),
        isPlaying: state.meditationPlayback.isPlaying,
      },
    });
  }, [elapsedTime]);

  // Seek forward 10 seconds
  const handleSeekForward = useCallback(() => {
    const newTime = Math.min(totalDurationSeconds, elapsedTime + 10);
    setElapsedTime(newTime);
    if (newTime >= totalDurationSeconds) {
      pauseMeditationPlayback();
      setIsComplete(true);
      setPhase('checkin');
      setCheckinStep(0);
      setIsCheckinBodyVisible(true);
      return;
    }
    const state = useSessionStore.getState();
    useSessionStore.setState({
      meditationPlayback: {
        ...state.meditationPlayback,
        accumulatedTime: newTime,
        startedAt: Date.now(),
        isPlaying: state.meditationPlayback.isPlaying,
      },
    });
  }, [elapsedTime, totalDurationSeconds, pauseMeditationPlayback]);

  // ── Check-in handlers ──
  const toggleSensation = useCallback((id) => {
    setSelectedSensations((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const saveCheckinData = useCallback(() => {
    // Save body sensations to store
    if (selectedSensations.length > 0) {
      updateShakingTheTreeCapture('bodySensations', selectedSensations);
    }
    if (responseKey) {
      updateShakingTheTreeCapture('responseKey', responseKey);
    }
    updateShakingTheTreeCapture('completedAt', Date.now());

    // Save journal entry if text was written
    if (journalText.trim()) {
      const sensationLabels = selectedSensations
        .map((id) => {
          const opt = BODY_CHECKIN_OPTIONS.find((o) => o.id === id);
          if (opt) return opt.label;
          if (id === UNNAMED_OPTION.id) return UNNAMED_OPTION.label;
          return id;
        })
        .join(', ');

      const ts = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const content = [
        'SHAKING THE TREE',
        '',
        `Body sensations: ${sensationLabels || `[no entry — ${ts}]`}`,
        '',
        journalText.trim() || `[no entry — ${ts}]`,
      ].join('\n');

      addEntry({
        content,
        source: 'session',
        sessionId,
        moduleTitle: 'Shaking the Tree',
      });
    }
  }, [selectedSensations, responseKey, journalText, updateShakingTheTreeCapture, addEntry, sessionId]);

  const handleCheckinContinue = useCallback(() => {
    // On body check-in step, compute response key before advancing
    if (checkinStep === 1 && selectedSensations.length > 0) {
      const key = getResponseKey(selectedSensations);
      setResponseKey(key);
    }

    if (checkinStep < CHECKIN_STEP_COUNT - 1) {
      setIsCheckinBodyVisible(false);
      setTimeout(() => {
        setCheckinStep((prev) => prev + 1);
        setIsCheckinBodyVisible(true);
      }, FADE_MS);
    } else {
      // Last step → save and complete
      saveCheckinData();
      setIsCheckinBodyVisible(false);
      setTimeout(() => {
        setPhase('completion');
      }, FADE_MS);
    }
  }, [checkinStep, selectedSensations, saveCheckinData]);

  const handleCheckinBack = useCallback(() => {
    if (checkinStep > 0) {
      setIsCheckinBodyVisible(false);
      setTimeout(() => {
        setCheckinStep((prev) => prev - 1);
        setIsCheckinBodyVisible(true);
      }, FADE_MS);
    } else {
      // Back on landing → skip check-in → completion
      saveCheckinData();
      setPhase('completion');
    }
  }, [checkinStep, saveCheckinData]);

  // ── Completion handler ──
  const handleComplete = useCallback(() => {
    resetMeditationPlayback();
    onComplete();
  }, [resetMeditationPlayback, onComplete]);

  // ── Skip handler ──
  const handleModuleSkip = useCallback(() => {
    saveCheckinData();
    resetMeditationPlayback();
    onSkip();
  }, [saveCheckinData, resetMeditationPlayback, onSkip]);

  // ── All-recommendations modal handlers ──
  const handleOpenAllRecs = useCallback(() => {
    setShowAllRecs(true);
  }, []);

  const handleCloseAllRecs = useCallback(() => {
    setAllRecsClosing(true);
    if (allRecsCloseTimerRef.current) clearTimeout(allRecsCloseTimerRef.current);
    allRecsCloseTimerRef.current = setTimeout(() => {
      setShowAllRecs(false);
      setAllRecsClosing(false);
    }, FADE_MS);
  }, []);

  // ── Scroll to top on phase transitions ──
  useEffect(() => {
    if (phase === 'active' || phase === 'intro') {
      window.scrollTo(0, 0);
    }
  }, [phase]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      clearSectionTransitionTimeouts();
      if (allRecsCloseTimerRef.current) clearTimeout(allRecsCloseTimerRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [clearSectionTransitionTimeouts]);

  // ── Derived values ──
  const currentMovementSection = MOVEMENT_SECTIONS[currentSectionIndex];

  // Time remaining in current section
  const sectionEndTime = sectionBoundaries[currentSectionIndex] || totalDurationSeconds;
  const sectionTimeRemaining = Math.max(0, sectionEndTime - elapsedTime);

  // Check-in: can continue on body-checkin step only if selections made
  const checkinContinueDisabled = checkinStep === 1 && selectedSensations.length === 0;

  // ── Control bar config ──
  const getControlPhase = () => {
    if (phase === 'idle') return 'idle';
    if (phase === 'intro') return 'active';
    if (phase === 'active') return 'active';
    if (phase === 'checkin') return 'active';
    return 'completed';
  };

  const getPrimaryButton = () => {
    if (phase === 'idle') {
      return { label: 'Begin', onClick: handleIdleBegin };
    }
    if (phase === 'intro') {
      const screen = INTRO_SCREENS[introStep];
      return {
        label: screen?.isReady ? 'Begin' : 'Continue',
        onClick: handleIntroContinue,
      };
    }
    if (phase === 'active') {
      return {
        label: isPlaying ? 'Pause' : 'Resume',
        onClick: handlePauseResume,
      };
    }
    if (phase === 'checkin') {
      return {
        label: checkinStep === CHECKIN_STEP_COUNT - 1 ? 'Finish' : 'Continue',
        onClick: handleCheckinContinue,
        disabled: checkinContinueDisabled,
      };
    }
    return { label: 'Continue', onClick: handleComplete };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <>
      {/* ── Idle Phase ── */}
      {phase === 'idle' && (
        <>
          <ModuleLayout layout={{ centered: false }}>
            <div
              className="flex flex-col items-center w-full px-4 transition-opacity duration-[400ms]"
              style={{ opacity: isIdleVisible ? 1 : 0 }}
            >
              <h2 className="font-serif text-2xl text-[var(--color-text-primary)] mb-4" style={{ textTransform: 'none' }}>
                Shaking the Tree
              </h2>

              <div className="mb-4">
                <LeafDrawV2 />
              </div>

              <div className="mb-3">
                <button
                  onClick={() => duration.setShowPicker(true)}
                  className="w-[80px] py-1 border border-[var(--color-border)] text-[var(--color-text-secondary)]
                    hover:border-[var(--color-text-tertiary)] transition-colors text-center"
                >
                  <span className="text-2xl font-light">{duration.selected}</span>
                  <span className="text-sm ml-1">min</span>
                </button>
              </div>

              <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)] leading-snug max-w-sm text-center mb-4">
                A guided movement practice. Pick 2-3 tracks — start with something gentle, end with something that settles.
              </p>

              <div className="w-full flex justify-center pb-40">
                <RecommendationsWidget />
              </div>
            </div>
          </ModuleLayout>

          <ModuleControlBar
            phase={getControlPhase()}
            primary={getPrimaryButton()}
            showBack={false}
            showSkip={true}
            onSkip={handleModuleSkip}
            skipConfirmMessage="Skip this movement practice?"
          />
        </>
      )}

      {/* ── Intro Phase ── */}
      {phase === 'intro' && (
        <>
          <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
            <div className="pt-2">
              <div className={`transition-opacity duration-[400ms] ${
                isIntroHeaderVisible ? 'opacity-100' : 'opacity-0'
              }`}>
                <h2
                  className="text-xl font-light mb-2 text-center"
                  style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                >
                  Shaking the Tree
                </h2>
                <div className="flex justify-center mb-4">
                  <LeafDrawV2 />
                </div>
              </div>

              <div className={`transition-opacity duration-[400ms] ${
                isIntroBodyVisible ? 'opacity-100' : 'opacity-0'
              }`}>
                <div key={introStep} className="animate-fadeIn">
                  {INTRO_SCREENS[introStep]?.header && (
                    <p className="uppercase tracking-wider text-[10px] text-[var(--accent)] mb-3">
                      {INTRO_SCREENS[introStep].header}
                    </p>
                  )}

                  <div className="space-y-3">
                    {INTRO_SCREENS[introStep]?.body.map((paragraph, i) => (
                      <p
                        key={i}
                        className="text-sm text-[var(--color-text-primary)] leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ModuleLayout>

          <ModuleControlBar
            phase={getControlPhase()}
            primary={getPrimaryButton()}
            showBack={true}
            onBack={handleIntroBack}
            backConfirmMessage=""
            showSkip={true}
            onSkip={handleModuleSkip}
            skipConfirmMessage="Skip this movement practice?"
          />
        </>
      )}

      {/* ── Active Phase ── */}
      {phase === 'active' && (
        <>
          <ModuleLayout layout={{ centered: false }}>
            <div className="flex flex-col items-center w-full px-2">
              <h2 className="font-serif text-xl text-[var(--color-text-primary)] mb-1" style={{ textTransform: 'none' }}>
                Shaking the Tree
              </h2>

              <div className="mb-8">
                <MorphingShapes />
              </div>

              {/* Section indicator with time remaining */}
              <div className="mb-3 text-center">
                <p
                  className="text-3xl text-[var(--color-text-primary)]"
                  style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                >
                  {currentMovementSection?.name}
                </p>
                <p
                  className="text-xs tracking-wider text-[var(--color-text-tertiary)]"
                  style={{ textTransform: 'none' }}
                >
                  section {currentSectionIndex + 1} of {MOVEMENT_SECTIONS.length}
                </p>
                <p
                  className="text-5xl text-[var(--color-text-primary)] mt-1 tabular-nums"
                  style={{ fontFamily: 'DM Serif Text, serif' }}
                >
                  {formatTime(sectionTimeRemaining)}
                </p>
              </div>

              {/* Cue + Invitation — one sentence per line, staggered fade-in */}
              <div className="text-base text-[var(--color-text-primary)] text-center mb-1">
                <p
                  className="transition-opacity duration-300"
                  style={{ opacity: cueVisible ? 1 : 0 }}
                >
                  {currentMovementSection?.cue}
                </p>
                <p
                  className="transition-opacity duration-300"
                  style={{ opacity: invitationVisible ? 1 : 0 }}
                >
                  {currentMovementSection?.invitation}
                </p>
              </div>

              {/* Guidance — left-aligned bullets, visually separated */}
              <div className="w-full max-w-sm mt-3 pl-4">
                {currentMovementSection?.guidance.map((line, i) => (
                  <p
                    key={`${currentSectionIndex}-${i}`}
                    className="text-xs text-[var(--color-text-secondary)] text-left transition-opacity duration-200 mb-1"
                    style={{ opacity: guidanceVisibility[i] ? 1 : 0 }}
                  >
                    • {line}
                  </p>
                ))}
              </div>

              {/* Recommendations widget — shown during active */}
              <div className="w-full flex justify-center mt-4 pb-40">
                <RecommendationsWidget />
              </div>
            </div>
          </ModuleLayout>

          <ModuleControlBar
            phase={getControlPhase()}
            primary={getPrimaryButton()}
            showBack={true}
            onBack={handleActiveBack}
            backConfirmMessage="End this movement practice and go back?"
            showSkip={true}
            onSkip={handleActiveSkip}
            skipConfirmMessage="Skip the movement practice?"
            showSeekControls={true}
            onSeekBack={handleSeekBack}
            onSeekForward={handleSeekForward}
            rightSlot={
              <SlotButton
                icon={<ListIcon />}
                label="All recommendations"
                onClick={handleOpenAllRecs}
              />
            }
          />
        </>
      )}

      {/* ── Check-in Phase ── */}
      {phase === 'checkin' && (
        <>
          <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
            <div className={`transition-opacity duration-[400ms] ${
              isCheckinBodyVisible ? 'opacity-100' : 'opacity-0'
            }`}>
              <div key={checkinStep} className="animate-fadeIn">

                {/* Step 0: Landing */}
                {checkinStep === 0 && (
                  <div className="pt-4">
                    <h2
                      className="text-xl font-light mb-2 text-center text-[var(--color-text-primary)]"
                      style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                    >
                      Shaking the Tree
                    </h2>
                    <div className="flex justify-center mb-4">
                      <LeafDrawV2 />
                    </div>
                    <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                      {LANDING_SCREEN.instruction}
                    </p>
                  </div>
                )}

                {/* Step 1: Body Check-in */}
                {checkinStep === 1 && (
                  <div className="pt-2">
                    <h2
                      className="text-xl font-light mb-2 text-center text-[var(--color-text-primary)]"
                      style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                    >
                      What do you notice?
                    </h2>
                    <div className="flex justify-center mb-4">
                      <LeafDrawV2 />
                    </div>
                    <p className="text-sm text-[var(--color-text-primary)] mb-4 leading-relaxed">
                      Select everything that feels present right now.
                    </p>

                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {BODY_CHECKIN_OPTIONS.map((option) => {
                          const isSelected = selectedSensations.includes(option.id);
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => toggleSensation(option.id)}
                              className={`py-3 px-2 border transition-colors duration-150 text-center ${
                                isSelected
                                  ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
                                  : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                              }`}
                            >
                              <span className="uppercase tracking-wider text-xs">
                                {option.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSensation(UNNAMED_OPTION.id)}
                        className={`w-full py-3 px-4 border transition-colors duration-150 text-center ${
                          selectedSensations.includes(UNNAMED_OPTION.id)
                            ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
                            : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)]'
                        }`}
                      >
                        <span className="uppercase tracking-wider text-xs">
                          {UNNAMED_OPTION.label}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Tailored Response */}
                {checkinStep === 2 && responseKey && TAILORED_RESPONSES[responseKey] && (
                  <div className="pt-2">
                    <h2
                      className="text-xl font-light mb-2 text-center text-[var(--color-text-primary)]"
                      style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                    >
                      {TAILORED_RESPONSES[responseKey].header}
                    </h2>
                    <div className="flex justify-center mb-4">
                      <LeafDrawV2 />
                    </div>
                    <div className="space-y-3">
                      {TAILORED_RESPONSES[responseKey].paragraphs.map((para, i) => (
                        <p key={i} className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Reflect 1 */}
                {checkinStep === 3 && (
                  <div className="pt-2">
                    <h2
                      className="text-xl font-light mb-2 text-center text-[var(--color-text-primary)]"
                      style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                    >
                      {REFLECT_SCREENS[0].header}
                    </h2>
                    <div className="flex justify-center mb-4">
                      <LeafDrawV2 />
                    </div>
                    {renderContentLines(REFLECT_SCREENS[0].lines)}
                  </div>
                )}

                {/* Step 4: Reflect 2 */}
                {checkinStep === 4 && (
                  <div className="pt-2">
                    <h2
                      className="text-xl font-light mb-2 text-center text-[var(--color-text-primary)]"
                      style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                    >
                      {REFLECT_SCREENS[1].header}
                    </h2>
                    <div className="flex justify-center mb-4">
                      <LeafDrawV2 />
                    </div>
                    {renderContentLines(REFLECT_SCREENS[1].lines)}
                  </div>
                )}

                {/* Step 5: Journal */}
                {checkinStep === 5 && (
                  <div className="pt-2">
                    <h2
                      className="text-xl font-light mb-2 text-center text-[var(--color-text-primary)]"
                      style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                    >
                      {JOURNAL_SCREEN.header}
                    </h2>
                    <div className="flex justify-center mb-4">
                      <LeafDrawV2 />
                    </div>
                    <textarea
                      value={journalText}
                      onChange={(e) => setJournalText(e.target.value)}
                      placeholder={JOURNAL_SCREEN.placeholder}
                      className="w-full h-40 p-3 border border-[var(--color-border)] bg-transparent
                        text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]
                        resize-none focus:outline-none focus:border-[var(--accent)]"
                      style={{ textTransform: 'none' }}
                    />
                  </div>
                )}

                {/* Step 6: Closing */}
                {checkinStep === 6 && (
                  <div className="pt-4">
                    <h2
                      className="text-xl font-light mb-2 text-center text-[var(--color-text-primary)]"
                      style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                    >
                      Shaking the Tree
                    </h2>
                    <div className="flex justify-center mb-4">
                      <LeafDrawV2 />
                    </div>
                    {renderContentLines(CLOSING_CONTENT.lines)}
                  </div>
                )}

              </div>
            </div>
          </ModuleLayout>

          <ModuleControlBar
            phase={getControlPhase()}
            primary={getPrimaryButton()}
            showBack={true}
            onBack={handleCheckinBack}
            backConfirmMessage=""
            showSkip={true}
            onSkip={handleModuleSkip}
            skipConfirmMessage="Skip the check-in?"
          />
        </>
      )}

      {/* ── Completion Phase ── */}
      {phase === 'completion' && (
        <>
          <ModuleLayout layout={{ centered: true }}>
            <CompletionScreen />
          </ModuleLayout>

          <ModuleControlBar
            phase={getControlPhase()}
            primary={getPrimaryButton()}
            showSkip={false}
          />
        </>
      )}

      {/* ── Modals ── */}

      <DurationPicker
        isOpen={duration.showPicker}
        onClose={() => duration.setShowPicker(false)}
        onSelect={duration.handleChange}
        currentDuration={duration.selected}
        durationSteps={DURATION_STEPS}
        minDuration={10}
        maxDuration={30}
      />

      <AlarmPrompt
        isOpen={showAlarmPrompt}
        onProceed={handleAlarmProceed}
        durationMinutes={duration.selected}
        activityName="Shaking the Tree"
      />

      <AllRecommendationsModal
        isOpen={showAllRecs}
        closing={allRecsClosing}
        onClose={handleCloseAllRecs}
      />
    </>
  );
}
