/**
 * FeltSenseModule Component
 *
 * A guided focusing meditation based on Eugene Gendlin's Focusing technique.
 * Three phases:
 * 1. Idle (variation selector)
 * 2. Audio-guided meditation (useMeditationPlayback)
 * 3. Reflection flow (8 interleaved education, journaling, and check-in screens)
 *
 * Two variations:
 * - Default (~12 min): Core practice
 * - Going Deeper (~20 min): Full practice with extended silences and additional prompts
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  getMeditationById,
  generateTimedSequence,
  resolveEffectiveVoiceId,
} from '../../../content/meditations';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';
import { useTranscriptModal } from '../../../hooks/useTranscriptModal';
import { useJournalStore } from '../../../stores/useJournalStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useAppStore } from '../../../stores/useAppStore';

// Shared UI components
import ModuleLayout, { VoicePill } from '../capabilities/ModuleLayout';
import MeditationLoadingScreen from '../capabilities/MeditationLoadingScreen';
import ModuleControlBar, { VolumeButton, SlotButton } from '../capabilities/ModuleControlBar';
import MorphingShapes from '../capabilities/animations/MorphingShapes';
import AsciiMoon from '../capabilities/animations/AsciiMoon';
import AsciiDiamond from '../capabilities/animations/AsciiDiamond';
import TranscriptModal, { TranscriptIcon } from '../capabilities/TranscriptModal';
import { EggIcon } from '../../shared/Icons';

// ─── Accent term map for renderContentLines ──────────────────────────────────

const ACCENT_TERMS = {
  felt_sense: 'felt sense',
  felt_shift: 'felt shift',
};

// ─── Reflection screen content ───────────────────────────────────────────────

const REFLECTION_SCREENS = [
  // Screen 1: Validation bridge
  {
    type: 'text',
    header: 'What just happened',
    lines: [
      'You just did something most people rarely do. You turned your attention inward, found something your body was holding, and stayed with it.',
      '\u00A7',
      'That might sound simple. It is. But it\u2019s also one of the most powerful things you can do for yourself.',
    ],
  },

  // Screen 2: First capture (before naming anything)
  {
    type: 'journal',
    header: 'While it\u2019s fresh',
    preamble: 'Before we go any further, take a moment to write about what just happened. No need for complete sentences. Just get something down while the experience is still close.',
    journal: {
      key: 'experience',
      prompt: 'What came up? What did you notice?',
      placeholder: 'The feeling, the shape, what your body showed you, anything that stood out...',
      rows: 5,
    },
  },

  // Screen 3: Name the felt sense
  {
    type: 'text',
    header: '{felt_sense_header}',
    lines: [
      'The vague, hard-to-name feeling you found in your body has a name. It\u2019s called a {felt_sense}.',
      '\u00A7',
      'A {felt_sense} is different from an emotion. Emotions are things you recognize: anger, sadness, joy. A {felt_sense} is murkier than that. It\u2019s your body\u2019s way of holding the whole of a situation at once, before your mind has sorted it into words.',
      '\u00A7',
      'The heaviness in your chest that you can\u2019t quite explain. The tightness that shows up around certain people. The background hum of something unresolved. Those are felt senses.',
    ],
  },

  // Screen 4: The doorway
  {
    type: 'text',
    header: 'The doorway',
    lines: [
      'Most of us deal with these sensations in one of two ways:',
      '\u00A7',
      '{#1} We push past them. We distract, analyze, rationalize, or just keep moving.',
      '{#2} We get swallowed by them. We spiral into the story, the emotion, the overwhelm.',
      '\u00A7',
      'What you just practiced is a third option. You sat at the edge of the feeling without diving in or running away. You kept it company.',
      '\u00A7',
      'That\u2019s the doorway. Not thinking about the feeling. Not drowning in it. Just being near it, with steady attention.',
    ],
  },

  // Screen 5: Felt shift definition
  {
    type: 'text',
    header: '{felt_shift_header}',
    lines: [
      'When a {felt_sense} receives that kind of patient, non-judgmental attention, something often happens on its own. The quality of the sensation changes. It might soften, loosen, move, clarify, or open into something new.',
      '\u00A7',
      'This is called a {felt_shift}. You didn\u2019t force it. You didn\u2019t decide what it should become. It changed because it finally had room to.',
      '\u00A7',
      'If nothing shifted this time, that\u2019s completely normal. Some things need more than one visit.',
    ],
  },

  // Screen 6: Shift check-in + optional journal
  {
    type: 'mixed-selector',
    header: '{felt_shift_header}',
    selector: {
      key: 'shiftCheckIn',
      prompt: 'Which best describes what happened during the meditation?',
      options: [
        { id: 'softened', label: 'Something softened or released' },
        { id: 'changed-unclear', label: 'Something changed, but I can\u2019t describe it yet' },
        { id: 'stayed-same', label: 'I stayed with it, but it didn\u2019t seem to shift' },
        { id: 'surprised', label: 'Something came up that surprised me' },
        { id: 'lost-track', label: 'I drifted away or lost track of it' },
        { id: 'not-sure', label: 'I\u2019m not sure yet' },
      ],
    },
    journal: {
      key: 'shift',
      prompt: 'Want to say more about that?',
      placeholder: 'Any details about what changed, or didn\u2019t. Even small shifts count...',
      rows: 3,
    },
  },

  // Screen 7: Body knowledge + journal
  {
    type: 'mixed',
    header: 'What your body knows',
    lines: [
      'Your body registers and stores experience faster than conscious thought. It picks up on patterns, threats, and unfinished business that your thinking mind has moved past or never noticed.',
      '\u00A7',
      'This is why some feelings don\u2019t have obvious explanations. The body is responding to something real, but the information hasn\u2019t been translated into language yet.',
      '\u00A7',
      'A {felt_sense} is that untranslated knowing. When you give it attention, it begins to speak.',
    ],
    journal: {
      key: 'bodyKnowing',
      prompt: 'Is there something your body seems to know that you haven\u2019t been able to put into words until now?',
      placeholder: 'A pattern you keep feeling. Something that doesn\u2019t have a story yet but has a shape...',
      rows: 4,
    },
  },

  // Screen 8: Send-off
  {
    type: 'text',
    animation: 'diamond',
    header: 'Between sessions',
    lines: [
      'This practice does not require a substance. You can do it anytime you notice your body holding something that your mind can\u2019t quite name.',
      '\u00A7',
      'The next time you feel a vague unease, a heaviness, a tension that seems disproportionate to the situation, try pausing. Instead of asking \u201cWhy do I feel this way?\u201d ask \u201cWhat does this feel like in my body?\u201d and wait.',
      '\u00A7',
      'The waiting is the practice. Your body will answer if you give it time.',
    ],
  },
];

// ─── Render helpers ──────────────────────────────────────────────────────────

/**
 * Renders an array of content lines with circle spacer and accent color support.
 * Handles: '§' spacers, '{#N}' numbered items, and accent terms from ACCENT_TERMS map.
 */
function renderContentLines(lines) {
  return (
    <div className="space-y-0">
      {lines.map((line, i) => {
        // Paragraph spacer
        if (line === '\u00A7') {
          return <div key={i} className="h-3" />;
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
        for (const key of Object.keys(ACCENT_TERMS)) {
          if (line.includes(`{${key}}`)) {
            hasAccent = true;
            break;
          }
        }

        if (hasAccent) {
          // Split by all accent terms and reconstruct with styled spans
          const parts = [];
          let remaining = line;
          let partIndex = 0;

          while (remaining.length > 0) {
            // Find the next accent term occurrence
            let earliest = -1;
            let earliestKey = null;
            for (const key of Object.keys(ACCENT_TERMS)) {
              const idx = remaining.indexOf(`{${key}}`);
              if (idx !== -1 && (earliest === -1 || idx < earliest)) {
                earliest = idx;
                earliestKey = key;
              }
            }

            if (earliest === -1) {
              // No more accent terms
              parts.push(<span key={partIndex++}>{remaining}</span>);
              break;
            }

            // Add text before the accent term
            if (earliest > 0) {
              parts.push(<span key={partIndex++}>{remaining.substring(0, earliest)}</span>);
            }

            // Add the accent-styled term
            parts.push(
              <span key={partIndex++} className="text-[var(--accent)]">
                {ACCENT_TERMS[earliestKey]}
              </span>
            );

            remaining = remaining.substring(earliest + earliestKey.length + 2); // +2 for { and }
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

/**
 * Renders a screen header, handling accent-colored headers.
 */
function renderScreenHeader(screen) {
  if (!screen.header) return null;

  // Named-concept headers
  if (screen.header === '{felt_sense_header}') {
    return (
      <p className="text-lg mb-3 text-[var(--color-text-primary)]" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
        Felt sense
      </p>
    );
  }
  if (screen.header === '{felt_shift_header}') {
    return (
      <p className="text-lg mb-3 text-[var(--color-text-primary)]" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
        Felt shift
      </p>
    );
  }

  return (
    <p className="text-lg mb-3 text-[var(--color-text-primary)]" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
      {screen.header}
    </p>
  );
}

/**
 * Renders the body of a reflection screen based on its type.
 */
function ReflectionScreen({ screen, journalValues, onJournalChange, selectorValues, onSelectorChange }) {
  // Text-only screen
  if (screen.type === 'text') {
    return renderContentLines(screen.lines);
  }

  // Journal-only screen
  if (screen.type === 'journal') {
    return (
      <div className="space-y-5">
        {screen.preamble && (
          <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {screen.preamble}
          </p>
        )}
        <div>
          <p className="text-lg mb-3 text-[var(--color-text-primary)]" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
            {screen.journal.prompt}
          </p>
          <textarea
            value={journalValues[screen.journal.key] || ''}
            onChange={(e) => onJournalChange(screen.journal.key, e.target.value)}
            placeholder={screen.journal.placeholder}
            rows={screen.journal.rows || 4}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] text-sm leading-relaxed
              placeholder:text-[var(--color-text-tertiary)] resize-none"
          />
        </div>
      </div>
    );
  }

  // Mixed screen: education content + journal prompt
  if (screen.type === 'mixed') {
    return (
      <div className="space-y-6">
        {renderContentLines(screen.lines)}
        <div>
          <p className="text-lg mb-3 text-[var(--color-text-primary)]" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
            {screen.journal.prompt}
          </p>
          <textarea
            value={journalValues[screen.journal.key] || ''}
            onChange={(e) => onJournalChange(screen.journal.key, e.target.value)}
            placeholder={screen.journal.placeholder}
            rows={screen.journal.rows || 4}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] text-sm leading-relaxed
              placeholder:text-[var(--color-text-tertiary)] resize-none"
          />
        </div>
      </div>
    );
  }

  // Mixed-selector screen: education content + selector + optional journal
  if (screen.type === 'mixed-selector') {
    const selectedId = selectorValues[screen.selector.key];

    return (
      <div className="space-y-6">
        {screen.lines && renderContentLines(screen.lines)}

        {/* Selector */}
        <div>
          <p className="text-lg mb-3 text-[var(--color-text-primary)]" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
            {screen.selector.prompt}
          </p>
          <div className="space-y-2">
            {screen.selector.options.map((option) => {
              const isSelected = selectedId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelectorChange(screen.selector.key, option.id)}
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

        {/* Optional journal prompt */}
        {screen.journal && (
          <div>
            <p className="text-lg mb-3 text-[var(--color-text-primary)]" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
              {screen.journal.prompt}
            </p>
            <textarea
              value={journalValues[screen.journal.key] || ''}
              onChange={(e) => onJournalChange(screen.journal.key, e.target.value)}
              placeholder={screen.journal.placeholder}
              rows={screen.journal.rows || 3}
              className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                focus:outline-none focus:border-[var(--accent)]
                text-[var(--color-text-primary)] text-sm leading-relaxed
                placeholder:text-[var(--color-text-tertiary)] resize-none"
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FeltSenseModule({ module, onComplete, onSkip, onProgressUpdate }) {
  const meditation = getMeditationById('felt-sense');

  // Store integration
  const addEntry = useJournalStore((state) => state.addEntry);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;
  const updateFeltSenseCapture = useSessionStore((s) => s.updateFeltSenseCapture);

  // ─── State ──────────────────────────────────────────────────────────────

  // Module phase: idle → meditation → reflection
  const [phase, setPhase] = useState('idle');

  // Variation state
  const [selectedVariation, setSelectedVariation] = useState(
    meditation?.defaultVariation || 'default'
  );

  // Voice selection — independent of variation. See BodyScanModule for the
  // canonical pattern. Variation drives WHICH clips play (default vs going
  // deeper); voice drives WHICH FOLDER each clip is fetched from. The two
  // are orthogonal — a Going Deeper variation with the Rachel voice
  // resolves to /felt-sense/relaxing-rachel/<the going-deeper clips>.
  const defaultVoiceId = useAppStore((s) => s.preferences?.defaultVoiceId);
  const voices = meditation?.audio?.voices;
  const [selectedVoiceId, setSelectedVoiceId] = useState(() =>
    resolveEffectiveVoiceId(meditation?.audio, defaultVoiceId)
  );
  const activeVoiceRef = useRef(selectedVoiceId);

  // Transcript modal state
  const { showTranscript, transcriptClosing, handleOpenTranscript, handleCloseTranscript } = useTranscriptModal();

  // Reflection state
  const [reflectionStep, setReflectionStep] = useState(0);
  const [isReflectionHeaderVisible, setIsReflectionHeaderVisible] = useState(false);
  const [isReflectionBodyVisible, setIsReflectionBodyVisible] = useState(true);

  // Journal text entries
  const [journalValues, setJournalValues] = useState({
    experience: '',   // Screen 2
    shift: '',        // Screen 6
    bodyKnowing: '',  // Screen 7
  });

  // Selector values
  const [selectorValues, setSelectorValues] = useState({
    shiftCheckIn: null,  // Screen 6
  });

  // ─── Timed sequence (variation assembly) ────────────────────────────────

  const [timedSequence, totalDuration] = useMemo(() => {
    if (!meditation) return [[], 0];

    const clips = meditation.assembleVariation(selectedVariation);
    const variationMeta = meditation.variations[selectedVariation];

    // Generate timed sequence (no silence expansion). voiceId drives audio
    // URL resolution via resolveVoiceBasePath.
    const sequence = generateTimedSequence(clips, 1.0, {
      speakingRate: meditation.speakingRate || 90,
      audioConfig: meditation.audio,
      voiceId: selectedVoiceId,
    });

    // Use the actual sequence end-time as the timer's total — voice-aware
    // because the sequence above was built with the selected voice's
    // durations. Falls back to the variation's pre-computed (Theo-based)
    // duration if the sequence is empty. This keeps the playback timer
    // synced to actual audio length when an alternate voice is selected,
    // since the variation's `duration` field is computed at module-load
    // time using the default voice only.
    const total = sequence.length > 0
      ? sequence[sequence.length - 1].endTime
      : variationMeta.duration;
    return [sequence, total];
  }, [meditation, selectedVariation, selectedVoiceId]);

  // Transcript prompts for the current variation
  const transcriptPrompts = useMemo(() => {
    if (!meditation) return [];
    return meditation.assembleVariation(selectedVariation);
  }, [meditation, selectedVariation]);

  const transcriptTitle = meditation
    ? `${meditation.title} (${meditation.variations[selectedVariation]?.label || selectedVariation})`
    : '';

  // ─── Meditation completion → reflection transition ────────────────────

  const handleMeditationComplete = useCallback(() => {
    setPhase('reflection');
    setReflectionStep(0);
    setIsReflectionHeaderVisible(true);
    setIsReflectionBodyVisible(true);
  }, []);

  const handleMeditationSkip = useCallback(() => {
    setPhase('reflection');
    setReflectionStep(0);
    setIsReflectionHeaderVisible(true);
    setIsReflectionBodyVisible(true);
  }, []);

  // Shared playback hook
  const playback = useMeditationPlayback({
    meditationId: 'felt-sense',
    moduleInstanceId: module.instanceId,
    timedSequence,
    totalDuration,
    onComplete: handleMeditationComplete,
    onSkip: handleMeditationSkip,
    onProgressUpdate,
  });

  // ─── Phase transitions ────────────────────────────────────────────────

  // Hide timer during reflection
  useEffect(() => {
    if (phase === 'reflection') {
      onProgressUpdate?.({ showTimer: false, progress: 100, elapsed: 0, total: 0, isPaused: false });
    }
  }, [phase, onProgressUpdate]);

  // Track when we enter meditation phase
  useEffect(() => {
    if (playback.hasStarted && !playback.isLoading && phase === 'idle') {
      setPhase('meditation');
    }
  }, [playback.hasStarted, playback.isLoading, phase]);

  // Sync the idle-screen voice pill with the global default preference.
  useEffect(() => {
    if (playback.hasStarted) return;
    const nextEffective = resolveEffectiveVoiceId(meditation?.audio, defaultVoiceId);
    if (nextEffective && nextEffective !== selectedVoiceId) {
      setSelectedVoiceId(nextEffective);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally not re-running when selectedVoiceId changes locally
  }, [defaultVoiceId, playback.hasStarted, meditation]);

  // Begin → idle-leaving → preparing (loading screen) → preparing-leaving →
  // active. Composer reads the voice-aware timedSequence during the loading
  // screen window.
  const handleBeginWithTransition = useCallback(() => {
    activeVoiceRef.current = selectedVoiceId;
    useSessionStore.getState().beginModule(module.instanceId);
    playback.handleBeginWithTransition();
  }, [playback, module.instanceId, selectedVoiceId]);

  // Restart meditation from the beginning
  const handleRestart = useCallback(() => {
    playback.handleRestart();
    setPhase('idle');
  }, [playback]);

  // ─── Reflection navigation ────────────────────────────────────────────

  const handleJournalChange = useCallback((key, value) => {
    setJournalValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSelectorChange = useCallback((key, value) => {
    setSelectorValues(prev => ({ ...prev, [key]: value }));
  }, []);

  // ─── Journal save ─────────────────────────────────────────────────────

  const saveJournalEntry = useCallback(() => {
    const timestamp = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    let content = 'FELT SENSE\n';

    content += `\nWhat came up?\n`;
    content += journalValues.experience.trim() ? `${journalValues.experience.trim()}\n` : `[no entry — ${timestamp}]\n`;

    // Include shift check-in selection + optional elaboration
    const shiftOption = REFLECTION_SCREENS[5]?.selector?.options?.find(o => o.id === selectorValues.shiftCheckIn);
    content += `\nWhat shifted\n`;
    if (shiftOption) {
      content += `${shiftOption.label}\n`;
    }
    content += journalValues.shift.trim() ? `${journalValues.shift.trim()}\n` : `[no entry — ${timestamp}]\n`;

    content += `\nWhat my body knows\n`;
    content += journalValues.bodyKnowing.trim() ? `${journalValues.bodyKnowing.trim()}\n` : `[no entry — ${timestamp}]\n`;

    addEntry({
      content: content.trim(),
      source: 'session',
      sessionId,
      moduleTitle: 'Felt Sense',
    });
  }, [journalValues, selectorValues.shiftCheckIn, addEntry, sessionId]);

  const handleReflectionContinue = useCallback(() => {
    if (reflectionStep < REFLECTION_SCREENS.length - 1) {
      // Fade out body → advance → fade in body
      setIsReflectionBodyVisible(false);
      setTimeout(() => {
        document.querySelector('main')?.scrollTo(0, 0);
        setReflectionStep(prev => prev + 1);
        setIsReflectionBodyVisible(true);
      }, 400);
    } else {
      // Last reflection screen → save and complete the module
      saveJournalEntry();
      if (selectorValues.shiftCheckIn) {
        updateFeltSenseCapture('shiftCheckIn', selectorValues.shiftCheckIn);
        updateFeltSenseCapture('completedAt', Date.now());
      }
      setIsReflectionBodyVisible(false);
      setIsReflectionHeaderVisible(false);
      setTimeout(() => {
        onComplete();
      }, 400);
    }
  }, [reflectionStep, saveJournalEntry, selectorValues.shiftCheckIn, updateFeltSenseCapture, onComplete]);

  const handleReflectionBack = useCallback(() => {
    if (reflectionStep > 0) {
      setIsReflectionBodyVisible(false);
      setTimeout(() => {
        document.querySelector('main')?.scrollTo(0, 0);
        setReflectionStep(prev => prev - 1);
        setIsReflectionBodyVisible(true);
      }, 400);
    }
  }, [reflectionStep]);

  // ─── Module-level skip (saves any journal content + check-in) ──────────

  const handleModuleSkip = useCallback(() => {
    saveJournalEntry();
    if (selectorValues.shiftCheckIn) {
      updateFeltSenseCapture('shiftCheckIn', selectorValues.shiftCheckIn);
      updateFeltSenseCapture('completedAt', Date.now());
    }
    onSkip();
  }, [saveJournalEntry, selectorValues.shiftCheckIn, updateFeltSenseCapture, onSkip]);

  // ─── Fallback ─────────────────────────────────────────────────────────

  if (!meditation) {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)] text-center">
            Meditation content not found.
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

  // ─── Render: Idle phase ───────────────────────────────────────────────

  if (phase === 'idle') {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          {playback.error ? (
            <div className="text-center animate-fadeIn flex flex-col items-center">
              <EggIcon size={48} className="text-[var(--color-text-tertiary)] mb-4" />
              <p className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider">
                Audio not found.
              </p>
            </div>
          ) : (playback.transitionStage === 'idle' || playback.transitionStage === 'idle-leaving') ? (() => {
            const isLeaving = playback.transitionStage === 'idle-leaving';
            return (
            <div className={`text-center ${isLeaving ? 'animate-fadeOut' : 'animate-fadeIn'}`} style={{ marginTop: '-2rem' }}>
              <div className="text-center space-y-2">
                <h2
                  className="text-2xl text-[var(--color-text-primary)]"
                  style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
                >
                  {meditation.title}
                </h2>
                <p className="text-left text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {meditation.description}
                </p>
              </div>

              {/* Variation selector */}
              <div className="mt-3 space-y-1.5 max-w-sm mx-auto">
                {Object.values(meditation.variations).map(v => (
                  <button
                    key={v.key}
                    onClick={() => setSelectedVariation(v.key)}
                    className={`w-full text-left px-4 pt-2 pb-1 border transition-colors ${
                      selectedVariation === v.key
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                        : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--color-text-primary)] font-['DM_Serif_Text'] leading-snug">
                          {v.label}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider leading-tight">
                          {v.description}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--color-text-tertiary)] ml-3 flex-shrink-0 mt-0.5">
                        ~{Math.round(v.duration / 60)} min
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Voice pill — independent of variation. Renders only when
                  the meditation declares voices (graceful no-op pre-PR-merge). */}
              {Array.isArray(voices) && voices.length >= 1 && (
                <div className="mt-4">
                  <VoicePill voices={voices} selectedVoiceId={selectedVoiceId} onVoiceChange={setSelectedVoiceId} />
                </div>
              )}
            </div>
            );
          })() : (playback.transitionStage === 'preparing' || playback.transitionStage === 'preparing-leaving') ? (
            <MeditationLoadingScreen
              isLeaving={playback.transitionStage === 'preparing-leaving'}
            />
          ) : null}
        </ModuleLayout>

        <ModuleControlBar
          phase={playback.getPhase()}
          primary={(() => {
            const ph = playback.getPhase();
            if (ph === 'loading') return { label: 'Loading', loading: true };
            return { label: 'Begin', onClick: handleBeginWithTransition };
          })()}
          showBack={false}
          showSkip={true}
          onSkip={onSkip}
          skipConfirmMessage="Skip this meditation?"
        />
      </>
    );
  }

  // ─── Render: Meditation phase ─────────────────────────────────────────

  if (phase === 'meditation') {
    return (
        <>
          <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
            <div
              className="flex flex-col items-center text-center w-full px-4 animate-fadeIn"
              style={{
                alignSelf: 'stretch',
                minHeight: 'calc(100vh - var(--header-plus-status) - var(--bottom-chrome) - 1rem)',
              }}
            >
              <h2
                className="text-xl font-light mb-6"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                {meditation.title}
              </h2>

              <MorphingShapes />

              {/* Paused indicator */}
              <div className="h-5 flex items-center justify-center mt-3">
                {!playback.isPlaying && !playback.isComplete && (
                  <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider animate-pulse">
                    Paused
                  </p>
                )}
              </div>

              {/* Prompt text */}
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
            showBack={true}
            onBack={handleRestart}
            backConfirmMessage="Restart this meditation from the beginning?"
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

          {/* Transcript modal */}
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

  // ─── Render: Reflection phase ─────────────────────────────────────────

  if (phase === 'reflection') {
    const screen = REFLECTION_SCREENS[reflectionStep];

    // Continue is always enabled — users may be writing in a physical journal
    const isContinueDisabled = false;

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className="pt-2">
            {/* Persistent header + animation */}
            <div className={`transition-opacity duration-[400ms] ${
              isReflectionHeaderVisible ? 'opacity-100' : 'opacity-0'
            }`}>
              <h2
                className="text-xl font-light mb-2 text-center"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                Felt Sense
              </h2>

              <div className="flex justify-center mb-4">
                {screen.animation === 'diamond' ? <AsciiDiamond /> : <AsciiMoon />}
              </div>
            </div>

            {/* Body content — fades out/in on each step change */}
            <div className={`transition-opacity duration-[400ms] ${
              isReflectionBodyVisible ? 'opacity-100' : 'opacity-0'
            }`} style={{ paddingBottom: '8rem' }}>
              <div key={reflectionStep} className="animate-fadeIn">
                {renderScreenHeader(screen)}
                <ReflectionScreen
                  screen={screen}
                  journalValues={journalValues}
                  onJournalChange={handleJournalChange}
                  selectorValues={selectorValues}
                  onSelectorChange={handleSelectorChange}
                />
              </div>
            </div>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{
            label: reflectionStep === REFLECTION_SCREENS.length - 1 ? 'Complete' : 'Continue',
            onClick: handleReflectionContinue,
            disabled: isContinueDisabled,
          }}
          showBack={reflectionStep > 0}
          onBack={handleReflectionBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining reflection?"
        />
      </>
    );
  }

  // (No separate closing phase — last reflection screen completes the module directly)

  // Should not reach here, but safe fallback
  return null;
}
