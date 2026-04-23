/**
 * LetterWritingModule Component
 * A guided letter-writing experience with educational context,
 * step-by-step letter building, full review, and closing reflection.
 *
 * Flow: Idle → Education → Opening → Body → Closing → Review → Reflection → Completion
 */

import { useState, useCallback, useEffect } from 'react';
import { useJournalStore } from '../../../stores/useJournalStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { getModuleById } from '../../../content/modules';
import useProgressReporter from '../../../hooks/useProgressReporter';
import ModuleLayout, { CompletionScreen, IdleScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar from '../capabilities/ModuleControlBar';
import AsciiMoon from '../capabilities/animations/AsciiMoon';

// ── Screen Definitions ─────────────────────────────────────

const SCREENS = [
  // Screen 0: Educational Introduction
  {
    type: 'text',
    header: 'Why write a letter?',
    lines: [
      'Sometimes the altered state during an MDMA session can bring a kind of clarity to our relationships and the things we carry unsaid. Feelings that are usually guarded become accessible, and words that felt impossible to form start to arrive.',
      '§',
      'Writing a letter is a way to meet that clarity and give it a shape. It does not have to be perfect. It does not have to be sent.',
      '§',
      'If you do feel the urge to send this letter, wait at least a few days until after your session is over. Give yourself time to process what came up and decide whether sending it still feels right.',
      '§',
      'Your letter will be saved in your journal, where you can revisit, edit, or continue it at any time.',
    ],
  },
  // Screen 1: Opening — recipient + first prompt
  {
    type: 'letter-opening',
    prompt: 'Who is this letter for?',
    context: "Think about who has been on your mind. It could be someone you love, someone you've lost, your younger self, or a part of you that needs to hear something. There's no wrong answer.",
    textareaPrompt: 'What do you want them to know you feel?',
    placeholder: "Start with what's most alive in you right now...",
  },
  // Screen 2: Body — the heart of the letter
  {
    type: 'letter-body',
    prompt: 'What have you never been able to say?',
    context: "This is the part of the letter where you can say the things that have been hardest to express. You don't need to edit yourself here.",
    placeholder: "The thing I've wanted to tell you is...",
  },
  // Screen 3: Closing — how to leave it
  {
    type: 'letter-close',
    prompt: 'How do you want to leave things?',
    context: "Think about what you want this person \u2014 or this part of you \u2014 to walk away with. What's the feeling you want to leave behind?",
    placeholder: 'What I hope you understand is...',
  },
  // Screen 4: Full Letter Review
  {
    type: 'letter-review',
    header: 'Your Letter',
  },
  // Screen 5: Educational Closing
  {
    type: 'text',
    header: 'After the letter',
    lines: [
      'Writing a letter during a session can surface emotions that are usually guarded. You may have accessed a kind of honesty that surprised you, or felt a tenderness toward someone that you normally keep at a distance.',
      '§',
      'Before sending this letter, wait at least a few days. The altered state can make things feel more urgent than they are. What matters most is that you wrote it \u2014 that alone is meaningful.',
      '§',
      'In the days that follow, sit with what came up. Notice if the feelings shift, deepen, or settle. Your letter is saved in your journal. You can revisit it, revise it, or use it as a starting point for a conversation when the time is right.',
      '§',
      'This does not have to end here. You may wish to write more letters, or to continue editing this one. The journal is always available.',
    ],
  },
];

// ── Rotating Suggestion Helpers ────────────────────────────

const RECIPIENT_SUGGESTIONS = [
  '[a loved one]',
  '[my future self]',
  '[my younger self]',
  '[someone I miss]',
  '[a friend]',
  '[a part of me]',
];

const SALUTATION_SUGGESTIONS = [
  'Sincerely',
  'With love',
  'Yours',
  'Always',
  'With care',
  'Yours truly',
];

function useRotatingSuggestion(suggestions, { active = true, interval = 3000, fadeDuration = 600 } = {}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!active) return;
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % suggestions.length);
        setVisible(true);
      }, fadeDuration);
    }, interval);
    return () => clearInterval(cycle);
  }, [active, suggestions.length, interval, fadeDuration]);

  return { suggestion: suggestions[index], visible };
}

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

// ── Main Component ─────────────────────────────────────────

export default function LetterWritingModule({ module, onComplete, onSkip, onProgressUpdate }) {
  const [phase, setPhase] = useState('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isBodyVisible, setIsBodyVisible] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  // Letter content
  const [recipient, setRecipient] = useState('');
  const [opening, setOpening] = useState('');
  const [body, setBody] = useState('');
  const [closing, setClosing] = useState('');
  const [fullLetter, setFullLetter] = useState('');
  const [salutation, setSalutation] = useState('');
  const [authorName, setAuthorName] = useState('');

  const [recipientFocused, setRecipientFocused] = useState(false);
  const [salutationFocused, setSalutationFocused] = useState(false);

  const libraryModule = getModuleById(module.libraryId);
  const addEntry = useJournalStore((state) => state.addEntry);
  const settings = useJournalStore((state) => state.settings);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;

  const recipientRotation = useRotatingSuggestion(RECIPIENT_SUGGESTIONS, {
    active: !recipient && !recipientFocused && phase === 'active' && stepIndex === 1,
  });
  const salutationRotation = useRotatingSuggestion(SALUTATION_SUGGESTIONS, {
    active: !salutation && !salutationFocused && phase === 'active' && stepIndex === 4,
  });

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

  // Font classes from journal settings
  const getFontClass = () => {
    const size = settings.fontSize === 'small' ? 'text-sm' : settings.fontSize === 'large' ? 'text-lg' : 'text-base';
    const family = settings.fontFamily === 'serif' ? 'font-serif' : settings.fontFamily === 'mono' ? 'font-mono' : 'font-sans';
    const height = settings.lineHeight === 'compact' ? 'leading-snug' : settings.lineHeight === 'relaxed' ? 'leading-loose' : 'leading-normal';
    return `${size} ${family} ${height}`;
  };

  // Assemble letter for review screen
  const assembleLetter = useCallback(() => {
    const ts = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    let assembled = '';
    assembled += `Dear ${recipient.trim() || `[no entry — ${ts}]`},\n\n`;
    assembled += `${opening.trim() || `[no entry — ${ts}]`}\n\n`;
    assembled += `${body.trim() || `[no entry — ${ts}]`}\n\n`;
    assembled += closing.trim() || `[no entry — ${ts}]`;
    return assembled;
  }, [recipient, opening, body, closing]);

  // Save journal entry
  const saveEntry = useCallback(() => {
    let savedContent = 'LETTER WRITING\n\n';

    // Use the review textarea content (which may have been edited)
    if (fullLetter.trim()) {
      savedContent += fullLetter.trim();
    } else {
      // Fallback to assembled parts
      savedContent += assembleLetter();
    }

    if (salutation.trim() || authorName.trim()) {
      savedContent += '\n\n';
      if (salutation.trim()) savedContent += `${salutation.trim()},`;
      if (authorName.trim()) savedContent += `\n${authorName.trim()}`;
    }

    addEntry({
      content: savedContent.trim(),
      source: 'session',
      sessionId,
      moduleTitle: module.title,
    });
  }, [fullLetter, assembleLetter, salutation, authorName, addEntry, sessionId, module.title]);

  // Navigation
  const handleBegin = useCallback(() => {
    useSessionStore.getState().beginModule(module.instanceId);
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
  }, [module.instanceId]);

  const handleNext = useCallback(() => {
    // When advancing to review screen, assemble the letter
    if (stepIndex === 3) {
      setFullLetter(assembleLetter());
    }

    // On review screen "Save & Continue" — save the entry
    if (stepIndex === 4) {
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
    // When going back from review, update parts from fullLetter isn't practical,
    // so just go back and let the user re-enter
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

  // ── Active Phase (screen-by-screen) ──────────────────────

  const getPrimaryLabel = () => {
    if (stepIndex === 4) return 'Save & Continue';
    if (isLastScreen) return 'Complete';
    return 'Continue';
  };

  const renderScreen = () => {
    // Text-only screens (education)
    if (screen.type === 'text') {
      return (
        <div className="space-y-4">
          {renderContentLines(screen.lines)}
        </div>
      );
    }

    // Letter opening — recipient + first textarea
    if (screen.type === 'letter-opening') {
      return (
        <div className="space-y-4">
          <p
            className="text-lg text-[var(--color-text-primary)]"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {screen.prompt}
          </p>
          <p className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed">
            {screen.context}
          </p>

          {/* Dear ___ */}
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[var(--color-text-primary)] text-xs uppercase tracking-wider shrink-0">
              Dear
            </span>
            <div className="relative flex-1">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                onFocus={() => setRecipientFocused(true)}
                onBlur={() => setRecipientFocused(false)}
                className="w-full py-2 px-0 border-0 border-b border-[var(--color-border)] bg-transparent
                           focus:outline-none focus:border-[var(--accent)]
                           text-[var(--color-text-primary)]"
                style={{ textTransform: 'none' }}
              />
              {!recipient && !recipientFocused && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none transition-opacity duration-500"
                  style={{ textTransform: 'none', opacity: recipientRotation.visible ? 1 : 0 }}
                >
                  {recipientRotation.suggestion}
                </span>
              )}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <p
              className="text-[var(--color-text-primary)] text-base mb-2"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {screen.textareaPrompt}
            </p>
            <textarea
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              placeholder={screen.placeholder}
              rows={6}
              className={`w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                focus:outline-none focus:border-[var(--accent)]
                text-[var(--color-text-primary)] leading-relaxed
                placeholder:text-[var(--color-text-tertiary)] resize-none ${getFontClass()}`}
              style={{ textTransform: 'none' }}
            />
          </div>
        </div>
      );
    }

    // Letter body / close — prompt + textarea
    if (screen.type === 'letter-body' || screen.type === 'letter-close') {
      const value = screen.type === 'letter-body' ? body : closing;
      const setter = screen.type === 'letter-body' ? setBody : setClosing;

      return (
        <div className="space-y-4">
          <p
            className="text-lg text-[var(--color-text-primary)]"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {screen.prompt}
          </p>
          <p className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed">
            {screen.context}
          </p>
          <textarea
            value={value}
            onChange={(e) => setter(e.target.value)}
            placeholder={screen.placeholder}
            rows={8}
            className={`w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] leading-relaxed
              placeholder:text-[var(--color-text-tertiary)] resize-none ${getFontClass()}`}
            style={{ textTransform: 'none' }}
          />
        </div>
      );
    }

    // Letter review — full letter in editable textarea + salutation + name
    if (screen.type === 'letter-review') {
      return (
        <div className="space-y-4">
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed" style={{ textTransform: 'none' }}>
            Here is your letter assembled from what you wrote. You can freely edit, add, or remove anything before saving.
          </p>

          <textarea
            value={fullLetter}
            onChange={(e) => setFullLetter(e.target.value)}
            rows={12}
            className={`w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] leading-relaxed
              placeholder:text-[var(--color-text-tertiary)] resize-none ${getFontClass()}`}
            style={{ textTransform: 'none' }}
          />

          {/* Salutation */}
          <div className="flex items-baseline gap-1">
            <div className="relative flex-1" style={{ maxWidth: '180px' }}>
              <input
                type="text"
                value={salutation}
                onChange={(e) => setSalutation(e.target.value)}
                onFocus={() => setSalutationFocused(true)}
                onBlur={() => setSalutationFocused(false)}
                className="w-full py-2 px-0 border-0 border-b border-[var(--color-border)] bg-transparent
                           focus:outline-none focus:border-[var(--accent)]
                           text-[var(--color-text-primary)]"
                style={{ textTransform: 'none' }}
              />
              {!salutation && !salutationFocused && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none transition-opacity duration-500"
                  style={{ textTransform: 'none', opacity: salutationRotation.visible ? 1 : 0 }}
                >
                  {salutationRotation.suggestion}
                </span>
              )}
            </div>
            <span className="text-[var(--color-text-primary)]">,</span>
          </div>

          {/* Author name */}
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your name"
            className="w-full py-2 px-0 border-0 border-b border-[var(--color-border)] bg-transparent
                       focus:outline-none focus:border-[var(--accent)]
                       text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
            style={{ textTransform: 'none', maxWidth: '180px' }}
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
          {/* Header + animation — fades in/out on first/last transitions */}
          <div className={`transition-opacity duration-[400ms] ${isHeaderVisible ? 'opacity-100' : 'opacity-0'}`}>
            <h2
              className="text-xl font-light mb-2 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {screen.header || 'Letter Writing'}
            </h2>

            <div className="flex justify-center mb-4">
              <AsciiMoon />
            </div>
          </div>

          {/* Screen content — fades on transition */}
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
