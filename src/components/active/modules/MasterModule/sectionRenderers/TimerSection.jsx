/**
 * TimerSection — Countdown timer for music/dance/rest activities
 *
 * Supports two timer modes:
 * - Simple timestamp timer (default, like MusicListening/LetsDance)
 * - Silence timer (when useSilenceTimer: true, like OpenSpace)
 *
 * Optional features:
 * - Music/dance recommendations widget + full overlay
 * - Alarm prompt before starting
 * - Add time button
 * - Configurable animation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSessionStore } from '../../../../../stores/useSessionStore';
import useSyncedDuration from '../../../../../hooks/useSyncedDuration';
import { musicRecommendations, getInitialRecommendations } from '../../../../../content/modules/musicRecommendations';
import { danceRecommendations, getInitialDanceRecommendations } from '../../../../../content/modules/danceRecommendations';

import ModuleLayout, { CompletionScreen, DurationPill } from '../../../capabilities/ModuleLayout';
import ModuleControlBar, { SlotButton } from '../../../capabilities/ModuleControlBar';
import AlarmPrompt from '../../../../shared/AlarmPrompt';
import MorphingShapes from '../../../capabilities/animations/MorphingShapes';
import AsciiMoon from '../../../capabilities/animations/AsciiMoon';
import { CirclePlusIcon } from '../../../../shared/Icons';

const DURATION_STEPS = [10, 15, 20, 25, 30, 40, 50, 60, 75, 90, 105, 120];
const FADE_MS = 400;

// ─── Recommendations Widget ─────────────────────────────────────────────────

function RecommendationsWidget({ initiallyOpen = false, type = 'music' }) {
  const allRecs = type === 'dance' ? danceRecommendations : musicRecommendations;
  const getInitial = type === 'dance' ? getInitialDanceRecommendations : getInitialRecommendations;

  const [visible, setVisible] = useState(initiallyOpen);
  const [picks, setPicks] = useState(() => getInitial());
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const queueRef = useRef([]);

  const refresh = () => {
    if (queueRef.current.length < 3) {
      const shuffled = [...allRecs];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      queueRef.current = shuffled;
    }
    setPicks(queueRef.current.splice(0, 3));
  };

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setVisible(!visible)}
          className="flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]
            hover:text-[var(--color-text-secondary)] transition-colors"
        >
          <span>{visible ? 'Hide Recommendations' : 'Show Recommendations'}</span>
          {!visible && <CirclePlusIcon size={14} />}
        </button>
        {visible && (
          <button
            onClick={refresh}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
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
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: visible ? '500px' : '0', opacity: visible ? 1 : 0 }}
      >
        <div className="pt-3 space-y-1">
          {picks.map((album, index) => (
            <button
              key={`${album.artist}-${album.title}-${index}`}
              onClick={() => setSelectedAlbum(album)}
              className={`w-full text-left pt-1.5 pb-0.5 ${index < picks.length - 1 ? 'border-b border-[var(--color-border)]' : ''} hover:opacity-70 transition-opacity`}
            >
              <p className="text-sm text-[var(--color-text-primary)]" style={{ textTransform: 'none' }}>
                {album.artist} — {album.title}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] -mt-0.5 normal-case tracking-normal leading-snug">
                {album.description}
              </p>
            </button>
          ))}
        </div>
      </div>
      {/* Album detail popup */}
      {selectedAlbum && (
        <AlbumDetailPopup album={selectedAlbum} onClose={() => setSelectedAlbum(null)} />
      )}
    </div>
  );
}

// ─── Album Detail Popup ─────────────────────────────────────────────────────

function AlbumDetailPopup({ album, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25" onClick={onClose}>
      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] p-6 max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--color-text-primary)] font-medium" style={{ textTransform: 'none' }}>{album.artist}</p>
            <p className="text-sm text-[var(--color-text-primary)] mt-0.5" style={{ textTransform: 'none' }}>{album.title}</p>
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)] normal-case tracking-normal leading-relaxed">{album.description}</p>
          <div className="space-y-2 pt-1">
            {album.links?.spotify && (
              <a href={album.links.spotify} target="_blank" rel="noopener noreferrer"
                className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity">
                Open in Spotify
              </a>
            )}
            {album.links?.appleMusic && (
              <a href={album.links.appleMusic} target="_blank" rel="noopener noreferrer"
                className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity">
                Open in Apple Music
              </a>
            )}
            {album.links?.youtube && (
              <a href={album.links.youtube} target="_blank" rel="noopener noreferrer"
                className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity">
                Open on YouTube
              </a>
            )}
          </div>
          <button onClick={onClose} className="w-full pt-2 text-xs text-[var(--color-text-tertiary)] hover:opacity-70 transition-opacity" style={{ textTransform: 'none' }}>
            Thanks, I can find it myself
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── All Recommendations Modal ──────────────────────────────────────────────

function AllRecommendationsModal({ isOpen, closing, onClose, type = 'music' }) {
  const allRecs = type === 'dance' ? danceRecommendations : musicRecommendations;
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
      style={{ opacity: closing ? 0 : entered ? 1 : 0, transition: `opacity ${FADE_MS}ms ease`, pointerEvents: closing ? 'none' : 'auto' }}
    >
      <div className="flex items-center justify-between px-4 shrink-0" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))', paddingBottom: '0.75rem' }}>
        <button onClick={onClose} className="text-[var(--color-text-secondary)] text-sm w-8 h-8 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">All Recommendations</span>
        <div className="w-8" />
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-6 pb-12 pt-2">
          <div className="space-y-1 max-w-sm mx-auto">
            {allRecs.map((album, index) => (
              <button
                key={`${album.artist}-${album.title}-${index}`}
                onClick={() => setSelectedAlbum(album)}
                className={`w-full text-left pt-1.5 pb-0.5 ${index < allRecs.length - 1 ? 'border-b border-[var(--color-border)]' : ''} hover:opacity-70 transition-opacity`}
              >
                <p className="text-sm text-[var(--color-text-primary)]" style={{ textTransform: 'none' }}>{album.artist} — {album.title}</p>
                <p className="text-xs text-[var(--color-text-tertiary)] -mt-0.5 normal-case tracking-normal leading-snug">{album.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
      {selectedAlbum && <AlbumDetailPopup album={selectedAlbum} onClose={() => setSelectedAlbum(null)} />}
    </div>
  );
}

// ─── List Icon ──────────────────────────────────────────────────────────────

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

// ─── TimerSection Component ─────────────────────────────────────────────────

export default function TimerSection({
  section,
  module,
  onSectionComplete,
  onSkip,
  onProgressUpdate,
}) {
  const animation = section.animation || 'morphing-shapes';
  const showAlarm = section.showAlarm || false;
  const recType = section.recommendations || null; // 'music' | 'dance' | null
  const allowAddTime = section.allowAddTime || false;

  // Session store for timer state
  const meditationPlayback = useSessionStore((state) => state.meditationPlayback);
  const startMeditationPlayback = useSessionStore((state) => state.startMeditationPlayback);
  const pauseMeditationPlayback = useSessionStore((state) => state.pauseMeditationPlayback);
  const resetMeditationPlayback = useSessionStore((state) => state.resetMeditationPlayback);

  const isThisModule = meditationPlayback.moduleInstanceId === module.instanceId;
  const hasStarted = isThisModule && meditationPlayback.hasStarted;
  const isPlaying = isThisModule && meditationPlayback.isPlaying;

  // Duration
  const duration = useSyncedDuration(module, { hasStarted });

  // Local state
  const [showAlarmPrompt, setShowAlarmPrompt] = useState(false);
  const [showAddTime, setShowAddTime] = useState(false);
  const [addTimeAmount, setAddTimeAmount] = useState(5);
  const [showAllRecs, setShowAllRecs] = useState(false);
  const [allRecsClosing, setAllRecsClosing] = useState(false);
  const allRecsCloseTimerRef = useRef(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef(null);

  const totalDurationSeconds = duration.selected * 60;

  // Timer update loop (timestamp-based)
  useEffect(() => {
    if (!isPlaying || !meditationPlayback.startedAt) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
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
      }
    };
    updateTimer();
    timerRef.current = setInterval(updateTimer, 100);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [isPlaying, meditationPlayback.startedAt, meditationPlayback.accumulatedTime, totalDurationSeconds, pauseMeditationPlayback]);

  // Report timer state to parent
  useEffect(() => {
    if (!onProgressUpdate) return;
    onProgressUpdate({
      progress: totalDurationSeconds > 0 ? (elapsedTime / totalDurationSeconds) * 100 : 0,
      mode: 'timer',
      elapsed: elapsedTime,
      total: totalDurationSeconds,
      showTimer: hasStarted && !isComplete,
      isPaused: !isPlaying,
      currentStep: 0,
      totalSteps: 0,
    });
  }, [elapsedTime, totalDurationSeconds, hasStarted, isPlaying, isComplete, onProgressUpdate]);

  const maxAddableMinutes = Math.max(0, 120 - duration.selected);

  const handleAddTime = useCallback(() => {
    const newDuration = duration.selected + addTimeAmount;
    duration.setSelected(newDuration);
    setShowAddTime(false);
    setAddTimeAmount(5);
  }, [duration, addTimeAmount]);

  const handleBegin = useCallback(() => {
    if (showAlarm) {
      setShowAlarmPrompt(true);
    } else {
      startMeditationPlayback(module.instanceId);
    }
  }, [showAlarm, module.instanceId, startMeditationPlayback]);

  const handleAlarmProceed = useCallback(() => {
    setShowAlarmPrompt(false);
    startMeditationPlayback(module.instanceId);
  }, [module.instanceId, startMeditationPlayback]);

  const handleComplete = useCallback(() => {
    resetMeditationPlayback();
    onSectionComplete();
  }, [resetMeditationPlayback, onSectionComplete]);

  const handleSkip = useCallback(() => {
    resetMeditationPlayback();
    onSkip();
  }, [resetMeditationPlayback, onSkip]);

  const handleOpenAllRecs = useCallback(() => setShowAllRecs(true), []);
  const handleCloseAllRecs = useCallback(() => {
    setAllRecsClosing(true);
    if (allRecsCloseTimerRef.current) clearTimeout(allRecsCloseTimerRef.current);
    allRecsCloseTimerRef.current = setTimeout(() => {
      setShowAllRecs(false);
      setAllRecsClosing(false);
    }, FADE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (allRecsCloseTimerRef.current) clearTimeout(allRecsCloseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (hasStarted && !isComplete) window.scrollTo(0, 0);
  }, [hasStarted, isComplete]);

  const getControlPhase = () => {
    if (!hasStarted) return 'idle';
    if (isComplete) return 'completed';
    return 'active';
  };

  const getPrimaryButton = () => {
    if (!hasStarted) return { label: 'Begin', onClick: handleBegin };
    if (isComplete) return { label: 'Continue', onClick: handleComplete };
    return null;
  };

  const AnimationComponent = animation === 'ascii-moon' ? AsciiMoon : MorphingShapes;

  return (
    <>
      <ModuleLayout layout={{ centered: isComplete }}>
        {/* Idle */}
        {!hasStarted && (
          <div className="flex flex-col items-center animate-fadeIn w-full px-4 -mt-2">
            <h2 className="font-serif text-2xl text-[var(--color-text-primary)] mb-1" style={{ textTransform: 'none' }}>
              {module.title}
            </h2>
            <div className="mb-1">
              <AnimationComponent />
            </div>
            <div className="mb-2">
              {(() => {
                const steps = section.durationSteps || DURATION_STEPS;
                const stepIndex = steps.indexOf(duration.selected);
                const canStepBack = stepIndex > 0;
                const canStepForward = stepIndex >= 0 && stepIndex < steps.length - 1;
                const stepTo = (nextIndex) => {
                  const next = steps[nextIndex];
                  if (typeof next === 'number') duration.handleChange(next);
                };
                return (
                  <DurationPill
                    minutes={duration.selected}
                    showArrows={true}
                    canStepBack={canStepBack}
                    canStepForward={canStepForward}
                    onStepBack={() => stepTo(stepIndex - 1)}
                    onStepForward={() => stepTo(stepIndex + 1)}
                  />
                );
              })()}
            </div>
            {section.idleDescription && (
              <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)] leading-snug max-w-sm text-left mb-2">
                {section.idleDescription}
              </p>
            )}
            {recType && (
              <div className="w-full flex justify-center pb-40">
                <RecommendationsWidget type={recType} />
              </div>
            )}
          </div>
        )}

        {/* Active */}
        {hasStarted && !isComplete && (
          <div className="flex flex-col items-center animate-fadeIn w-full px-4">
            <h2 className="font-serif text-2xl text-[var(--color-text-primary)] mb-1" style={{ textTransform: 'none' }}>
              {module.title}
            </h2>
            <div className="mb-2">
              <AnimationComponent />
            </div>
            {section.activeDescription && (
              <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)] leading-snug max-w-sm text-left mb-2">
                {section.activeDescription}
              </p>
            )}
            {allowAddTime && maxAddableMinutes > 0 && (
              <button
                onClick={() => setShowAddTime(true)}
                className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors mb-2"
              >
                + Add Time
              </button>
            )}
            {recType && (
              <div className="w-full flex justify-center pb-40">
                <RecommendationsWidget initiallyOpen type={recType} />
              </div>
            )}
          </div>
        )}

        {/* Completed */}
        {isComplete && <CompletionScreen />}
      </ModuleLayout>

      <ModuleControlBar
        phase={getControlPhase()}
        primary={getPrimaryButton()}
        showBack={false}
        showSkip={!isComplete}
        onSkip={handleSkip}
        skipConfirmMessage="Skip this activity?"
        rightSlot={recType && hasStarted && !isComplete ? (
          <SlotButton icon={<ListIcon />} label="All recommendations" onClick={handleOpenAllRecs} />
        ) : undefined}
      />

      {recType && (
        <AllRecommendationsModal
          isOpen={showAllRecs}
          closing={allRecsClosing}
          onClose={handleCloseAllRecs}
          type={recType}
        />
      )}

      {showAlarm && (
        <AlarmPrompt
          isOpen={showAlarmPrompt}
          onProceed={handleAlarmProceed}
          durationMinutes={duration.selected}
          activityName={module.title || 'activity'}
        />
      )}

      {/* Add Time popup */}
      {showAddTime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25" onClick={() => { setShowAddTime(false); setAddTimeAmount(5); }}>
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] p-6 max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)] text-center">Add Time</p>
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => setAddTimeAmount((prev) => Math.max(5, prev - 5))} disabled={addTimeAmount <= 5}
                  className="w-8 h-8 flex items-center justify-center border border-[var(--color-border)] text-[var(--color-text-primary)] disabled:opacity-30 transition-opacity">
                  −
                </button>
                <span className="text-2xl font-light text-[var(--color-text-primary)] w-16 text-center">
                  {addTimeAmount}<span className="text-sm ml-1">min</span>
                </span>
                <button onClick={() => setAddTimeAmount((prev) => Math.min(maxAddableMinutes, prev + 5))} disabled={addTimeAmount >= maxAddableMinutes}
                  className="w-8 h-8 flex items-center justify-center border border-[var(--color-border)] text-[var(--color-text-primary)] disabled:opacity-30 transition-opacity">
                  +
                </button>
              </div>
              <p className="text-[10px] text-[var(--color-text-tertiary)] text-center">New total: {duration.selected + addTimeAmount} min</p>
              <button onClick={handleAddTime} className="w-full py-2.5 text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity">
                Confirm
              </button>
              <button onClick={() => { setShowAddTime(false); setAddTimeAmount(5); }} className="w-full text-xs text-[var(--color-text-tertiary)] hover:opacity-70 transition-opacity" style={{ textTransform: 'none' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
