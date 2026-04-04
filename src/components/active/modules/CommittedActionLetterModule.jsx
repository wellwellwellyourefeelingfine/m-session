/**
 * CommittedActionLetterModule Component
 * A guided letter-writing experience based on the ACT (Acceptance and Commitment Therapy)
 * framework. The user identifies a value, explores barriers, and writes a committed action letter.
 *
 * Flow: Idle → Education → Value → Barrier → Willingness → Commitment → Review → Closing → Completion
 */

import { useState, useCallback, useEffect } from 'react';
import { useJournalStore } from '../../../stores/useJournalStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { getModuleById } from '../../../content/modules';
import useProgressReporter from '../../../hooks/useProgressReporter';
import ModuleLayout, { CompletionScreen, IdleScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar from '../capabilities/ModuleControlBar';
import AsciiMoon from '../capabilities/animations/AsciiMoon';

// ── Content Line Renderer ──────────────────────────────────

function renderContentLines(lines) {
  return (
    <div className="space-y-0">
      {lines.map((line, i) => {
        if (line === '§') {
          return <div key={i} className="h-4" />;
        }
        return (
          <p key={i} className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}

// ── Screen Definitions ─────────────────────────────────────

const SCREENS = [
  // Screen 0: Education
  {
    type: 'text',
    header: 'Committed Action',
    lines: [
      'In Acceptance and Commitment Therapy, change begins not with fixing what is wrong but with getting clear on what matters and choosing to move toward it, even when it is difficult.',
      '§',
      'During a session, values often become unusually clear. The things you care about most can feel vivid and undeniable in a way that everyday life tends to obscure.',
      '§',
      'This activity will guide you through identifying one value that matters, what has been getting in the way, and one concrete action you are willing to take. You will write this as a letter to yourself.',
    ],
  },
  // Screen 1: The value
  {
    type: 'prompt',
    context: 'Think about the different areas of your life: relationships, work, health, creativity, community. Let one rise to the surface.',
    prompt: 'What matters most to you right now?',
    key: 'value',
    placeholder: 'The thing that feels most important is...',
  },
  // Screen 2: The barrier
  {
    type: 'prompt',
    context: 'There is usually something between you and the thing you care about. It might be a fear, a habit, a belief about yourself, or a pattern you keep repeating.',
    prompt: 'What has been keeping you from living this value fully?',
    key: 'barrier',
    placeholder: 'What gets in the way is...',
  },
  // Screen 3: Willingness
  {
    type: 'prompt',
    context: 'A.C.T. does not ask you to eliminate the barrier. It asks whether you are willing to have it and still move forward. This is not the same as liking it or wanting it there.',
    prompt: 'What would you need to be willing to feel in order to move toward what matters?',
    key: 'willingness',
    placeholder: 'I would need to be willing to feel...',
  },
  // Screen 4: The commitment
  {
    type: 'prompt',
    context: 'A committed action is not a grand resolution. It is one specific, doable thing that moves you in the direction of your value. Something you can do in the next week.',
    prompt: 'What is one thing you will do?',
    key: 'commitment',
    placeholder: 'One thing I will do is...',
  },
  // Screen 5: Review
  { type: 'review', header: 'Your Commitment' },
  // Screen 6: Closing
  {
    type: 'text',
    header: 'After the commitment',
    lines: [
      'What you just wrote is a commitment made from a place of unusual clarity. That clarity is real, even if it fades in the days ahead.',
      '§',
      'The barrier you named will likely show up again. That is expected. The question is not whether it appears but whether you are willing to have it and act anyway. That willingness is the practice.',
      '§',
      'Your commitment is saved in your journal. Come back to it when you need a reminder of what you chose and why. If the commitment needs adjusting as you learn more, adjust it. The value underneath stays the same.',
    ],
  },
];

// ── Main Component ─────────────────────────────────────────

export default function CommittedActionLetterModule({ module, onComplete, onSkip, onProgressUpdate }) {
  const [phase, setPhase] = useState('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isBodyVisible, setIsBodyVisible] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  // Content
  const [responses, setResponses] = useState({
    value: '',
    barrier: '',
    willingness: '',
    commitment: '',
  });
  const [fullLetter, setFullLetter] = useState('');

  const libraryModule = getModuleById(module.libraryId);
  const addEntry = useJournalStore((state) => state.addEntry);
  const settings = useJournalStore((state) => state.settings);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;

  const screen = SCREENS[stepIndex];
  const isLastScreen = stepIndex >= SCREENS.length - 1;

  // ── Progress reporting ──────────────────────────────────
  const report = useProgressReporter(onProgressUpdate);

  useEffect(() => {
    if (phase === 'active') {
      report.step(stepIndex + 1, SCREENS.length);
    } else {
      report.idle();
    }
  }, [phase, stepIndex, report]);

  const getFontClass = () => {
    const size = settings.fontSize === 'small' ? 'text-sm' : settings.fontSize === 'large' ? 'text-lg' : 'text-base';
    const family = settings.fontFamily === 'serif' ? 'font-serif' : settings.fontFamily === 'mono' ? 'font-mono' : 'font-sans';
    const height = settings.lineHeight === 'compact' ? 'leading-snug' : settings.lineHeight === 'relaxed' ? 'leading-loose' : 'leading-normal';
    return `${size} ${family} ${height}`;
  };

  const assembleLetter = useCallback(() => {
    const ts = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    let assembled = '';
    assembled += `What matters most:\n${responses.value.trim() || `[no entry — ${ts}]`}\n\n`;
    assembled += `What gets in the way:\n${responses.barrier.trim() || `[no entry — ${ts}]`}\n\n`;
    assembled += `What I am willing to feel:\n${responses.willingness.trim() || `[no entry — ${ts}]`}\n\n`;
    assembled += `What I will do:\n${responses.commitment.trim() || `[no entry — ${ts}]`}`;
    return assembled;
  }, [responses]);

  const saveEntry = useCallback(() => {
    let savedContent = 'COMMITTED ACTION\n\n';

    if (fullLetter.trim()) {
      savedContent += fullLetter.trim();
    } else {
      savedContent += assembleLetter();
    }

    addEntry({
      content: savedContent.trim(),
      source: 'session',
      sessionId,
      moduleTitle: module.title,
    });
  }, [fullLetter, assembleLetter, addEntry, sessionId, module.title]);

  // Navigation
  const handleBegin = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsBodyVisible(false);
      setIsHeaderVisible(false);
      setPhase('active');
      setIsLeaving(false);
      setTimeout(() => {
        setIsHeaderVisible(true);
        setIsBodyVisible(true);
      }, 50);
    }, 400);
  }, []);

  const handleNext = useCallback(() => {
    // Assemble when advancing to review
    if (stepIndex === 4) {
      setFullLetter(assembleLetter());
    }

    // Save on review screen
    if (stepIndex === 5) {
      saveEntry();
    }

    if (isLastScreen) {
      setIsBodyVisible(false);
      setIsHeaderVisible(false);
      setTimeout(() => {
        setPhase('complete');
      }, 400);
      return;
    }

    setIsBodyVisible(false);
    setTimeout(() => {
      document.querySelector('main')?.scrollTo(0, 0);
      setStepIndex((prev) => prev + 1);
      setIsBodyVisible(true);
    }, 400);
  }, [stepIndex, isLastScreen, assembleLetter, saveEntry]);

  const handleBack = useCallback(() => {
    setIsBodyVisible(false);
    setTimeout(() => {
      document.querySelector('main')?.scrollTo(0, 0);
      setStepIndex((prev) => Math.max(0, prev - 1));
      setIsBodyVisible(true);
    }, 400);
  }, []);

  const handleSkip = useCallback(() => {
    saveEntry();
    onSkip();
  }, [saveEntry, onSkip]);

  // ── Idle Phase ───────────────────────────────────────────

  if (phase === 'idle') {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <div className={isLeaving ? 'animate-fadeOut' : 'animate-fadeIn'}>
            <IdleScreen
              title={module.title}
              description={libraryModule?.description}
              duration={module.duration}
            />
          </div>
        </ModuleLayout>
        <ModuleControlBar
          phase="idle"
          primary={{ label: 'Begin', onClick: handleBegin }}
          showSkip={true}
          onSkip={handleSkip}
          skipConfirmMessage="Skip this activity?"
        />
      </>
    );
  }

  // ── Completion Phase ─────────────────────────────────────

  if (phase === 'complete') {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <CompletionScreen />
        </ModuleLayout>
        <ModuleControlBar
          phase="completed"
          primary={{ label: 'Continue', onClick: onComplete }}
          showSkip={false}
        />
      </>
    );
  }

  // ── Active Phase ─────────────────────────────────────────

  const getPrimaryLabel = () => {
    if (stepIndex === 5) return 'Save & Continue';
    if (isLastScreen) return 'Complete';
    return 'Continue';
  };

  const renderScreen = () => {
    if (screen.type === 'text') {
      return (
        <div className="space-y-4">
          {renderContentLines(screen.lines)}
        </div>
      );
    }

    if (screen.type === 'prompt') {
      return (
        <div className="space-y-4">
          <p className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed">
            {screen.context}
          </p>
          <p
            className="text-lg text-[var(--color-text-primary)]"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {screen.prompt}
          </p>
          <textarea
            value={responses[screen.key]}
            onChange={(e) => setResponses((prev) => ({ ...prev, [screen.key]: e.target.value }))}
            placeholder={screen.placeholder}
            rows={6}
            className={`w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] leading-relaxed
              placeholder:text-[var(--color-text-tertiary)] resize-none ${getFontClass()}`}
            style={{ textTransform: 'none' }}
          />
        </div>
      );
    }

    if (screen.type === 'review') {
      return (
        <div className="space-y-4">
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed" style={{ textTransform: 'none' }}>
            Here is your commitment assembled from what you wrote. You can freely edit, add, or remove anything before saving.
          </p>

          <textarea
            value={fullLetter}
            onChange={(e) => setFullLetter(e.target.value)}
            rows={14}
            className={`w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] leading-relaxed
              placeholder:text-[var(--color-text-tertiary)] resize-none ${getFontClass()}`}
            style={{ textTransform: 'none' }}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <ModuleLayout layout={{ centered: false, maxWidth: 'sm', padding: 'normal' }}>
        <div className="pt-2">
          <div className={`transition-opacity duration-[400ms] ${isHeaderVisible ? 'opacity-100' : 'opacity-0'}`}>
            <h2
              className="text-xl font-light mb-2 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {screen.header || 'Committed Action'}
            </h2>

            <div className="flex justify-center mb-4">
              <AsciiMoon />
            </div>
          </div>

          <div
            className={`transition-opacity duration-[400ms] ${isBodyVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ paddingBottom: '6rem' }}
          >
            {renderScreen()}
          </div>
        </div>
      </ModuleLayout>

      <ModuleControlBar
        phase="active"
        primary={{
          label: getPrimaryLabel(),
          onClick: handleNext,
        }}
        showBack={stepIndex > 0}
        onBack={handleBack}
        showSkip={true}
        onSkip={handleSkip}
        skipConfirmMessage="Skip this activity?"
      />
    </>
  );
}
