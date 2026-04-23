/**
 * MusicListeningModule Component
 *
 * A guided music immersion module featuring:
 * - Duration picker (10–60 min) that syncs with session timeline
 * - Randomized album recommendations (3 at a time, refreshable)
 * - AlarmPrompt before beginning (away-from-screen module)
 * - MorphingShapes animation during active listening
 * - Timestamp-based timer with auto-complete
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSessionStore } from '../../../stores/useSessionStore';
import useSyncedDuration from '../../../hooks/useSyncedDuration';
import { musicRecommendations, getInitialRecommendations } from '../../../content/modules/musicRecommendations';

// Shared UI components
import ModuleLayout, { CompletionScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar, { SlotButton } from '../capabilities/ModuleControlBar';
import DurationPicker from '../../shared/DurationPicker';
import AlarmPrompt from '../../shared/AlarmPrompt';
import MorphingShapes from '../capabilities/animations/MorphingShapes';

const DURATION_STEPS = [10, 15, 20, 25, 30, 40, 50, 60, 75, 90, 105, 120];

/**
 * RecommendationsWidget — shows 3 random albums with a show/refresh toggle.
 * Reusable between the landing and active views.
 */
function RecommendationsWidget({ initiallyOpen = false }) {
  const [visible, setVisible] = useState(initiallyOpen);
  const [picks, setPicks] = useState(() => getInitialRecommendations());
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  // Queue-based shuffle: cycles through all recommendations before repeating
  const queueRef = useRef([]);

  const refresh = () => {
    if (queueRef.current.length < 3) {
      const shuffled = [...musicRecommendations];
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
      {/* Toggle row */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setVisible(!visible)}
          className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]
            hover:text-[var(--color-text-secondary)] transition-colors"
        >
          {visible ? 'Hide Recommendations' : 'Show Recommendations'}
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

      {/* Recommendations list — slide down */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: visible ? '500px' : '0',
          opacity: visible ? 1 : 0,
        }}
      >
        <div className="pt-3 space-y-1">
          {picks.map((album, index) => (
            <button
              key={`${album.artist}-${album.title}-${index}`}
              onClick={() => setSelectedAlbum(album)}
              className={`w-full text-left pt-1.5 pb-0.5 ${index < picks.length - 1 ? 'border-b border-[var(--color-border)]' : ''} hover:opacity-70 transition-opacity`}
            >
              <p className="text-sm text-[var(--color-text-primary)]">
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25"
          onClick={() => setSelectedAlbum(null)}
        >
          <div
            className="bg-[var(--color-bg)] border border-[var(--color-border)] p-6 max-w-xs w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--color-text-primary)] font-medium" style={{ textTransform: 'none' }}>
                  {selectedAlbum.artist}
                </p>
                <p className="text-sm text-[var(--color-text-primary)] mt-0.5" style={{ textTransform: 'none' }}>
                  {selectedAlbum.title}
                </p>
              </div>

              <p className="text-xs text-[var(--color-text-tertiary)] normal-case tracking-normal leading-relaxed">
                {selectedAlbum.description}
              </p>

              {/* Streaming links */}
              <div className="space-y-2 pt-1">
                {selectedAlbum.links?.spotify && (
                  <a
                    href={selectedAlbum.links.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
                  >
                    Open in Spotify
                  </a>
                )}
                {selectedAlbum.links?.appleMusic && (
                  <a
                    href={selectedAlbum.links.appleMusic}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
                  >
                    Open in Apple Music
                  </a>
                )}
                {selectedAlbum.links?.youtube && (
                  <a
                    href={selectedAlbum.links.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
                  >
                    Open on YouTube
                  </a>
                )}
              </div>

              {/* Dismiss */}
              <button
                onClick={() => setSelectedAlbum(null)}
                className="w-full pt-2 text-xs text-[var(--color-text-tertiary)] hover:opacity-70 transition-opacity"
                style={{ textTransform: 'none' }}
              >
                Thanks, I can find it myself
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const FADE_MS = 400;

/** List icon for the "view all" slot button */
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

/** Full-page scrollable modal showing all recommendations */
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
        <button
          onClick={onClose}
          className="text-[var(--color-text-secondary)] text-sm w-8 h-8 flex items-center justify-center"
        >
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
            {musicRecommendations.map((album, index) => (
              <button
                key={`${album.artist}-${album.title}-${index}`}
                onClick={() => setSelectedAlbum(album)}
                className={`w-full text-left pt-1.5 pb-0.5 ${index < musicRecommendations.length - 1 ? 'border-b border-[var(--color-border)]' : ''} hover:opacity-70 transition-opacity`}
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
      </div>

      {/* Album detail popup */}
      {selectedAlbum && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/25"
          onClick={() => setSelectedAlbum(null)}
        >
          <div
            className="bg-[var(--color-bg)] border border-[var(--color-border)] p-6 max-w-xs w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--color-text-primary)] font-medium" style={{ textTransform: 'none' }}>
                  {selectedAlbum.artist}
                </p>
                <p className="text-sm text-[var(--color-text-primary)] mt-0.5" style={{ textTransform: 'none' }}>
                  {selectedAlbum.title}
                </p>
              </div>

              <p className="text-xs text-[var(--color-text-tertiary)] normal-case tracking-normal leading-relaxed">
                {selectedAlbum.description}
              </p>

              <div className="space-y-2 pt-1">
                {selectedAlbum.links?.spotify && (
                  <a
                    href={selectedAlbum.links.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
                  >
                    Open in Spotify
                  </a>
                )}
                {selectedAlbum.links?.appleMusic && (
                  <a
                    href={selectedAlbum.links.appleMusic}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
                  >
                    Open in Apple Music
                  </a>
                )}
                {selectedAlbum.links?.youtube && (
                  <a
                    href={selectedAlbum.links.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
                  >
                    Open on YouTube
                  </a>
                )}
              </div>

              <button
                onClick={() => setSelectedAlbum(null)}
                className="w-full pt-2 text-xs text-[var(--color-text-tertiary)] hover:opacity-70 transition-opacity"
                style={{ textTransform: 'none' }}
              >
                Thanks, I can find it myself
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MusicListeningModule({ module, onComplete, onSkip, onProgressUpdate }) {
  // Session store actions
  const meditationPlayback = useSessionStore((state) => state.meditationPlayback);
  const startMeditationPlayback = useSessionStore((state) => state.startMeditationPlayback);
  const pauseMeditationPlayback = useSessionStore((state) => state.pauseMeditationPlayback);
  const resetMeditationPlayback = useSessionStore((state) => state.resetMeditationPlayback);

  // Check if this module's playback is active
  const isThisModule = meditationPlayback.moduleInstanceId === module.instanceId;
  const hasStarted = isThisModule && meditationPlayback.hasStarted;
  const isPlaying = isThisModule && meditationPlayback.isPlaying;

  // Duration (synced with session store)
  const duration = useSyncedDuration(module, { hasStarted });

  // Local UI state
  const [showAlarmPrompt, setShowAlarmPrompt] = useState(false);
  const [showAddTime, setShowAddTime] = useState(false);
  const [addTimeAmount, setAddTimeAmount] = useState(5);

  // All-recommendations modal state
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

  // Report timer state to parent
  useEffect(() => {
    if (!onProgressUpdate) return;

    const progress = totalDurationSeconds > 0
      ? (elapsedTime / totalDurationSeconds) * 100
      : 0;

    onProgressUpdate({
      progress,
      mode: 'timer',
      elapsed: elapsedTime,
      total: totalDurationSeconds,
      showTimer: hasStarted && !isComplete,
      isPaused: !isPlaying,
      currentStep: 0,
      totalSteps: 0,
    });
  }, [elapsedTime, totalDurationSeconds, hasStarted, isPlaying, isComplete, onProgressUpdate]);

  // Add time: max additional minutes before hitting 120 min total
  const maxAddableMinutes = Math.max(0, 120 - duration.selected);

  const handleAddTime = useCallback(() => {
    const newDuration = duration.selected + addTimeAmount;
    duration.setSelected(newDuration);
    setShowAddTime(false);
    setAddTimeAmount(5);
  }, [duration, addTimeAmount]);

  // Begin flow: show alarm prompt
  const handleBegin = useCallback(() => {
    useSessionStore.getState().beginModule(module.instanceId);
    setShowAlarmPrompt(true);
  }, [module.instanceId]);

  // After alarm prompt: start timer
  const handleAlarmProceed = useCallback(() => {
    setShowAlarmPrompt(false);
    startMeditationPlayback(module.instanceId);
  }, [module.instanceId, startMeditationPlayback]);

  // Complete handler
  const handleComplete = useCallback(() => {
    resetMeditationPlayback();
    onComplete();
  }, [resetMeditationPlayback, onComplete]);

  // Skip handler
  const handleSkip = useCallback(() => {
    resetMeditationPlayback();
    onSkip();
  }, [resetMeditationPlayback, onSkip]);

  // Scroll to top when active state begins
  useEffect(() => {
    if (hasStarted && !isComplete) {
      window.scrollTo(0, 0);
    }
  }, [hasStarted, isComplete]);

  // All-recommendations modal handlers
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (allRecsCloseTimerRef.current) {
        clearTimeout(allRecsCloseTimerRef.current);
      }
    };
  }, []);

  // Control bar phase
  const getControlPhase = () => {
    if (!hasStarted) return 'idle';
    if (isComplete) return 'completed';
    return 'active';
  };

  // Primary button config
  const getPrimaryButton = () => {
    const phase = getControlPhase();

    if (phase === 'idle') {
      return {
        label: 'Begin',
        onClick: handleBegin,
      };
    }

    if (phase === 'completed') {
      return {
        label: 'Continue',
        onClick: handleComplete,
      };
    }

    return null;
  };

  return (
    <>
      <ModuleLayout layout={{ centered: isComplete }}>
        {/* Idle state: title, animation, duration picker, description, recommendations */}
        {!hasStarted && (
          <div className="flex flex-col items-center animate-fadeIn w-full px-4 -mt-2">
            <h2 className="font-serif text-2xl text-[var(--color-text-primary)] mb-1" style={{ textTransform: 'none' }}>
              Music Time
            </h2>

            <div className="mb-1">
              <MorphingShapes />
            </div>

            {/* Duration picker button */}
            <div className="mb-2">
              <button
                onClick={() => duration.setShowPicker(true)}
                className="w-[80px] py-1 border border-[var(--color-border)] text-[var(--color-text-secondary)]
                  hover:border-[var(--color-text-tertiary)] transition-colors text-center"
              >
                <span className="text-2xl font-light">{duration.selected}</span>
                <span className="text-sm ml-1">min</span>
              </button>
            </div>

            <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)] leading-snug max-w-sm text-left mb-2">
              Set a duration, choose an album or pick from our recommendations, and let the music move through you.
            </p>

            {/* Recommendations widget */}
            <div className="w-full flex justify-center pb-40">
              <RecommendationsWidget />
            </div>
          </div>
        )}

        {/* Active state: title, animation, description, add time, recommendations — anchored to top */}
        {hasStarted && !isComplete && (
          <div className="flex flex-col items-center animate-fadeIn w-full px-4">
            <h2 className="font-serif text-2xl text-[var(--color-text-primary)] mb-1" style={{ textTransform: 'none' }}>
              Music Time
            </h2>

            <div className="mb-2">
              <MorphingShapes />
            </div>

            <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)] leading-snug max-w-sm text-left mb-2">
              Relax, listen, and let the music move through you. Close your eyes or use an eye mask — there's nothing to do but feel.
            </p>

            {/* Add Time button */}
            {maxAddableMinutes > 0 && (
              <button
                onClick={() => setShowAddTime(true)}
                className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors mb-2"
              >
                + Add Time
              </button>
            )}

            {/* Recommendations widget — open by default in active state */}
            <div className="w-full flex justify-center pb-40">
              <RecommendationsWidget initiallyOpen />
            </div>
          </div>
        )}

        {/* Completed state */}
        {isComplete && (
          <CompletionScreen />
        )}
      </ModuleLayout>

      {/* Control bar */}
      <ModuleControlBar
        phase={getControlPhase()}
        primary={getPrimaryButton()}
        showBack={false}
        showSkip={!isComplete}
        onSkip={handleSkip}
        skipConfirmMessage="Skip this music session?"
        rightSlot={hasStarted && !isComplete ? (
          <SlotButton icon={<ListIcon />} label="All recommendations" onClick={handleOpenAllRecs} />
        ) : undefined}
      />

      {/* All recommendations modal */}
      <AllRecommendationsModal
        isOpen={showAllRecs}
        closing={allRecsClosing}
        onClose={handleCloseAllRecs}
      />

      {/* Duration picker modal */}
      <DurationPicker
        isOpen={duration.showPicker}
        onClose={() => duration.setShowPicker(false)}
        onSelect={duration.handleChange}
        currentDuration={duration.selected}
        durationSteps={DURATION_STEPS}
        minDuration={10}
        maxDuration={120}
      />

      {/* Alarm prompt */}
      <AlarmPrompt
        isOpen={showAlarmPrompt}
        onProceed={handleAlarmProceed}
        durationMinutes={duration.selected}
        activityName="Music Time"
      />

      {/* Add Time popup */}
      {showAddTime && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25"
          onClick={() => { setShowAddTime(false); setAddTimeAmount(5); }}
        >
          <div
            className="bg-[var(--color-bg)] border border-[var(--color-border)] p-6 max-w-xs w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)] text-center">
                Add Time
              </p>

              {/* Stepper */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setAddTimeAmount((prev) => Math.max(5, prev - 5))}
                  disabled={addTimeAmount <= 5}
                  className="w-8 h-8 flex items-center justify-center border border-[var(--color-border)] text-[var(--color-text-primary)] disabled:opacity-30 transition-opacity"
                >
                  −
                </button>

                <span className="text-2xl font-light text-[var(--color-text-primary)] w-16 text-center">
                  {addTimeAmount}<span className="text-sm ml-1">min</span>
                </span>

                <button
                  onClick={() => setAddTimeAmount((prev) => Math.min(maxAddableMinutes, prev + 5))}
                  disabled={addTimeAmount >= maxAddableMinutes}
                  className="w-8 h-8 flex items-center justify-center border border-[var(--color-border)] text-[var(--color-text-primary)] disabled:opacity-30 transition-opacity"
                >
                  +
                </button>
              </div>

              <p className="text-[10px] text-[var(--color-text-tertiary)] text-center">
                New total: {duration.selected + addTimeAmount} min
              </p>

              {/* Confirm */}
              <button
                onClick={handleAddTime}
                className="w-full py-2.5 text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
              >
                Confirm
              </button>

              {/* Cancel */}
              <button
                onClick={() => { setShowAddTime(false); setAddTimeAmount(5); }}
                className="w-full text-xs text-[var(--color-text-tertiary)] hover:opacity-70 transition-opacity"
                style={{ textTransform: 'none' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
