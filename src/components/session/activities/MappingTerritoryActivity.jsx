/**
 * MappingTerritoryActivity Component
 *
 * A 17-screen pre-session educational flow guiding the user through
 * the kinds of experience that can arise during a session.
 * Based on Bill Richards' Sacred Knowledge.
 *
 * Screen types: text, journal, choice
 * No audio, no meditation, no timer — purely self-paced.
 *
 * Follows IntentionSettingActivity pattern for step navigation,
 * fade transitions, control bar, and data persistence.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useJournalStore } from '../../../stores/useJournalStore';
import {
  PROGRESS_STEPS,
  MAPPING_SCREENS,
  SCREEN_TYPES,
  COPING_PATTERN_OPTIONS,
  APPROACH_STYLE_OPTIONS,
} from './mappingTerritoryContent';
import { musicRecommendations, getInitialRecommendations } from '../../../content/modules/musicRecommendations';

// Shared UI components
import ModuleLayout from '../../active/capabilities/ModuleLayout';
import ModuleControlBar, { SlotButton } from '../../active/capabilities/ModuleControlBar';
import useProgressReporter from '../../../hooks/useProgressReporter';
import CompassAnimation from '../../active/capabilities/animations/CompassV2';

// ─── Inline music components (not exported from MusicListeningModule) ───

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

/** Album detail popup — shared between MusicPicks and AllMusicModal */
function AlbumDetailPopup({ album, onClose }) {
  if (!album) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg)] border border-[var(--color-border)] p-6 max-w-xs w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--color-text-primary)] font-medium" style={{ textTransform: 'none' }}>
              {album.artist}
            </p>
            <p className="text-sm text-[var(--color-text-primary)] mt-0.5" style={{ textTransform: 'none' }}>
              {album.title}
            </p>
          </div>

          <p className="text-xs text-[var(--color-text-tertiary)] normal-case tracking-normal leading-relaxed">
            {album.description}
          </p>

          <div className="space-y-2 pt-1">
            {album.links?.spotify && (
              <a
                href={album.links.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
              >
                Open in Spotify
              </a>
            )}
            {album.links?.appleMusic && (
              <a
                href={album.links.appleMusic}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
              >
                Open in Apple Music
              </a>
            )}
            {album.links?.youtube && (
              <a
                href={album.links.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
              >
                Open on YouTube
              </a>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full pt-2 text-xs text-[var(--color-text-tertiary)] hover:opacity-70 transition-opacity"
            style={{ textTransform: 'none' }}
          >
            Thanks, I can find it myself
          </button>
        </div>
      </div>
    </div>
  );
}

/** Inline music picks — 3 random albums with refresh, always visible */
function MusicPicks() {
  const [picks, setPicks] = useState(() => getInitialRecommendations());
  const [selectedAlbum, setSelectedAlbum] = useState(null);
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
      <div className="flex items-center justify-center gap-3 mb-3">
        <span className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Recommendations
        </span>
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
      </div>

      <div className="space-y-1">
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

      <AlbumDetailPopup album={selectedAlbum} onClose={() => setSelectedAlbum(null)} />
    </div>
  );
}

/** Full-page scrollable modal showing all recommendations */
function AllMusicModal({ isOpen, closing, onClose }) {
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

      {selectedAlbum && (
        <AlbumDetailPopup album={selectedAlbum} onClose={() => setSelectedAlbum(null)} />
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function MappingTerritoryActivity({ _module, onComplete, onSkip, onProgressUpdate }) {
  // ── Stores ──
  const updateMappingTerritoryCapture = useSessionStore((s) => s.updateMappingTerritoryCapture);
  const completePreSubstanceActivity = useSessionStore((s) => s.completePreSubstanceActivity);
  const sessionId = useSessionStore((s) => s.sessionId);
  const addEntry = useJournalStore((s) => s.addEntry);

  // ── Progress reporting ──
  const report = useProgressReporter(onProgressUpdate);

  // ── Step navigation ──
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // ── Local capture state ──
  const [askingForAttention, setAskingForAttention] = useState('');
  const [wordToSelf, setWordToSelf] = useState('');
  const [copingPattern, setCopingPattern] = useState(null);
  const [approachStyle, setApproachStyle] = useState(null);

  // ── All-music modal ──
  const [showAllMusic, setShowAllMusic] = useState(false);
  const [allMusicClosing, setAllMusicClosing] = useState(false);
  const allMusicCloseTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (allMusicCloseTimerRef.current) clearTimeout(allMusicCloseTimerRef.current);
    };
  }, []);

  const handleOpenAllMusic = useCallback(() => {
    setShowAllMusic(true);
  }, []);

  const handleCloseAllMusic = useCallback(() => {
    setAllMusicClosing(true);
    if (allMusicCloseTimerRef.current) clearTimeout(allMusicCloseTimerRef.current);
    allMusicCloseTimerRef.current = setTimeout(() => {
      setShowAllMusic(false);
      setAllMusicClosing(false);
    }, FADE_MS);
  }, []);

  // ── Derived values ──
  const currentStep = MAPPING_SCREENS[currentStepIndex];
  const totalSteps = MAPPING_SCREENS.length;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const progress = ((currentStepIndex + 1) / PROGRESS_STEPS) * 100;

  // ── Report step progress to parent status bar ──
  useEffect(() => {
    report.step(currentStepIndex + 1, PROGRESS_STEPS);
  }, [currentStepIndex, report]);

  // ── Save captures for current step before navigating away ──
  const saveCurrentStepCapture = useCallback(() => {
    const step = MAPPING_SCREENS[currentStepIndex];
    if (!step.captureField) return;

    switch (step.captureField) {
      case 'copingPattern':
        if (copingPattern) updateMappingTerritoryCapture('copingPattern', copingPattern);
        break;
      case 'approachStyle':
        if (approachStyle) updateMappingTerritoryCapture('approachStyle', approachStyle);
        break;
      case 'askingForAttention':
        if (askingForAttention.trim()) updateMappingTerritoryCapture('askingForAttention', askingForAttention.trim());
        break;
      case 'wordToSelf':
        if (wordToSelf.trim()) updateMappingTerritoryCapture('wordToSelf', wordToSelf.trim());
        break;
    }
  }, [currentStepIndex, copingPattern, approachStyle, askingForAttention, wordToSelf, updateMappingTerritoryCapture]);

  // ── Step navigation ──
  const advanceStep = useCallback(() => {
    saveCurrentStepCapture();
    setIsVisible(false);
    setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
      setIsVisible(true);
    }, 400);
  }, [saveCurrentStepCapture]);

  const goBack = useCallback(() => {
    if (currentStepIndex === 0) return;
    setIsVisible(false);
    setTimeout(() => {
      setCurrentStepIndex((prev) => Math.max(0, prev - 1));
      setIsVisible(true);
    }, 400);
  }, [currentStepIndex]);

  // ── Module completion ──
  const handleModuleComplete = useCallback(() => {
    // Save final captures
    saveCurrentStepCapture();
    updateMappingTerritoryCapture('completedAt', new Date().toISOString());

    // Save journal entries
    if (askingForAttention.trim()) {
      addEntry({
        content: `WHAT'S BEEN ASKING FOR ATTENTION:\n\n${askingForAttention.trim()}`,
        source: 'session',
        sessionId,
        moduleTitle: 'Mapping the Territory',
        isEdited: false,
      });
    }

    if (wordToSelf.trim()) {
      addEntry({
        content: `A WORD TO MYSELF:\n\n${wordToSelf.trim()}`,
        source: 'session',
        sessionId,
        moduleTitle: 'Mapping the Territory',
        isEdited: false,
      });
    }

    completePreSubstanceActivity('mapping-territory');
    onComplete();
  }, [saveCurrentStepCapture, updateMappingTerritoryCapture, askingForAttention, wordToSelf, addEntry, sessionId, completePreSubstanceActivity, onComplete]);

  // ── Primary button handler ──
  const handlePrimary = useCallback(() => {
    if (isLastStep) {
      setIsVisible(false);
      setTimeout(() => handleModuleComplete(), 400);
      return;
    }
    advanceStep();
  }, [isLastStep, advanceStep, handleModuleComplete]);

  // ── Screen renderers ──

  const renderTextScreen = (step) => (
    <div className="space-y-6">
      {/* Section label */}
      <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider text-center mb-4">
        {step.label}
      </p>

      <h2
        className="text-[var(--color-text-primary)] text-xl text-center"
        style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
      >
        {step.title}
      </h2>

      {step.showAnimation && (
        <div className="flex justify-center">
          <CompassAnimation />
        </div>
      )}

      {step.body.map((paragraph, i) => (
        <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {paragraph}
        </p>
      ))}

      {/* External link (screen 1) */}
      {step.link && (
        <a
          href={step.link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] text-sm underline block"
        >
          {step.link.text}
        </a>
      )}

      {/* Footer */}
      {step.footer && (
        <>
          <div className="flex justify-center">
            <div className="circle-spacer" />
          </div>
          <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider text-center">
            {step.footer}
          </p>
        </>
      )}

      {/* Music picks (screen 14) */}
      {step.hasMusicRecommendations && (
        <div className="flex justify-center pt-2">
          <MusicPicks />
        </div>
      )}

      {/* Music footer (screen 14) */}
      {step.musicFooter && (
        <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed text-center">
          {step.musicFooter}
        </p>
      )}
    </div>
  );

  const renderJournalScreen = (step) => {
    const value = step.captureField === 'askingForAttention' ? askingForAttention : wordToSelf;
    const setter = step.captureField === 'askingForAttention' ? setAskingForAttention : setWordToSelf;

    return (
      <div className="space-y-6">
        {/* Section label */}
        <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider text-center mb-4">
          {step.label}
        </p>

        <h2
          className="text-[var(--color-text-primary)] text-xl text-center"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          {step.title}
        </h2>

        {step.body.map((paragraph, i) => (
          <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {paragraph}
          </p>
        ))}

        {step.prompt && (
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed italic">
            {step.prompt}
          </p>
        )}

        <textarea
          value={value}
          onChange={(e) => setter(e.target.value)}
          placeholder={step.placeholder}
          rows={5}
          className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
            focus:outline-none focus:border-[var(--accent)] text-[var(--color-text-primary)]
            text-sm leading-relaxed resize-none placeholder:text-[var(--color-text-tertiary)]
            text-left"
          style={{ textTransform: 'none' }}
        />

        {step.footer && (
          <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed text-center">
            {step.footer}
          </p>
        )}
      </div>
    );
  };

  const renderChoiceScreen = (step) => {
    const options = step.captureField === 'copingPattern' ? COPING_PATTERN_OPTIONS : APPROACH_STYLE_OPTIONS;
    const selected = step.captureField === 'copingPattern' ? copingPattern : approachStyle;
    const setSelected = step.captureField === 'copingPattern' ? setCopingPattern : setApproachStyle;

    return (
      <div className="space-y-6">
        {/* Section label */}
        <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider text-center mb-4">
          {step.label}
        </p>

        <h2
          className="text-[var(--color-text-primary)] text-xl text-center"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          {step.title}
        </h2>

        {step.body.map((paragraph, i) => (
          <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {paragraph}
          </p>
        ))}

        {step.footer && (
          <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed text-center">
            {step.footer}
          </p>
        )}

        <div className="flex flex-col gap-2 pb-24">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelected(selected === option.id ? null : option.id)}
              className={`w-full py-3 px-4 text-left uppercase tracking-wider text-xs transition-colors ${
                selected === option.id
                  ? 'border border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
                  : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep.type) {
      case SCREEN_TYPES.TEXT: return renderTextScreen(currentStep);
      case SCREEN_TYPES.JOURNAL: return renderJournalScreen(currentStep);
      case SCREEN_TYPES.CHOICE: return renderChoiceScreen(currentStep);
      default: return null;
    }
  };

  // ── Control bar configuration ──

  const getShowBack = () => currentStepIndex > 0;

  const getPrimaryConfig = () => {
    if (isLastStep) return { label: 'Complete', onClick: handlePrimary };
    return { label: 'Continue', onClick: handlePrimary };
  };

  const getSkipConfig = () => !isLastStep;

  const getRightSlot = () => {
    if (currentStep.showMusic) {
      return (
        <SlotButton
          icon={<ListIcon />}
          label="All recommendations"
          onClick={handleOpenAllMusic}
        />
      );
    }
    return null;
  };

  // ── Render ──

  return (
    <>
      <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
        <div className={`pt-2 transition-opacity duration-[400ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div key={currentStepIndex} className="animate-fadeIn">
            {renderStepContent()}
          </div>
        </div>
      </ModuleLayout>

      <ModuleControlBar
        phase={isLastStep ? 'completed' : 'active'}
        primary={getPrimaryConfig()}
        showBack={getShowBack()}
        onBack={goBack}
        showSkip={getSkipConfig()}
        onSkip={onSkip}
        skipConfirmMessage="Skip this module?"
        rightSlot={getRightSlot()}
      />

      <AllMusicModal
        isOpen={showAllMusic}
        closing={allMusicClosing}
        onClose={handleCloseAllMusic}
      />
    </>
  );
}
