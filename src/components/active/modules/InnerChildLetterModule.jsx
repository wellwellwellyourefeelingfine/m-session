/**
 * InnerChildLetterModule Component
 * A guided letter to your younger self at a specific age.
 * Follows the same structure as LetterWritingModule but with
 * age selection instead of free-text recipient.
 *
 * Flow: Idle → Education → Age + Opening → Body → Closing → Review → Reflection → Completion
 */

import { useState, useCallback, useEffect } from 'react';
import { useJournalStore } from '../../../stores/useJournalStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { getModuleById } from '../../../content/modules';
import ModuleLayout, { CompletionScreen, IdleScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar from '../capabilities/ModuleControlBar';
import AsciiMoon from '../capabilities/animations/AsciiMoon';

// ── Screen Definitions ─────────────────────────────────────

const SCREENS = [
  // Screen 0: Educational Introduction
  {
    type: 'text',
    header: 'Writing to your younger self',
    lines: [
      'During a session, the barriers between your present self and your past can thin. Memories that normally stay at a distance can feel close, and the emotions attached to them can become vivid and accessible.',
      '§',
      'This is an opportunity to write a letter to a younger version of yourself. Pick an age that feels important. It might be a time when something difficult happened, or a period when you needed to hear something that no one said.',
      '§',
      'You do not need to have a specific memory in mind. Sometimes just thinking about yourself at a certain age is enough to bring something forward.',
      '§',
      'Your letter will be saved in your journal. You can revisit or continue it at any time.',
    ],
  },
  // Screen 1: Age selection + opening
  {
    type: 'letter-opening',
    context: 'Think about a time in your life that still carries weight. It could be childhood, adolescence, or any age where something was left unresolved or unsaid.',
    textareaPrompt: 'What do you want them to know first?',
    placeholder: 'Start with what feels most important to say...',
  },
  // Screen 2: Body
  {
    type: 'letter-body',
    prompt: 'What do you understand now that you could not have understood then?',
    context: 'You have lived through what that younger version of you was afraid of, confused by, or hurt by. You carry knowledge now that you did not have then.',
    placeholder: 'What I wish I could have known is...',
  },
  // Screen 3: Closing
  {
    type: 'letter-close',
    prompt: 'What does that younger version of you need to hear most?',
    context: 'Think about the reassurance, permission, or truth that would have made the biggest difference. Say it directly.',
    placeholder: 'What I need you to know is...',
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
      'Writing to your younger self can bring up tenderness, grief, or a protectiveness that surprises you. All of that is real, and all of it is useful.',
      '§',
      'The version of you that needed this letter may still be operating somewhere inside you, shaping how you react, what you avoid, and what you believe about yourself. Acknowledging that version directly is one of the most effective ways to begin updating those old patterns.',
      '§',
      'Your letter is saved in your journal. You may want to come back to it during integration or in the days after your session. Some people find it helpful to read the letter out loud to themselves.',
      '§',
      'This is a relationship you can continue. You can write more letters, at different ages, whenever you feel ready.',
    ],
  },
];

// ── Rotating Suggestion Helpers ────────────────────────────

const SALUTATION_SUGGESTIONS = [
  'With love',
  'Always yours',
  'I am here',
  'With everything I have',
  'From who you become',
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

export default function InnerChildLetterModule({ module, onComplete, onSkip }) {
  const [phase, setPhase] = useState('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isBodyVisible, setIsBodyVisible] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  // Letter content
  const [age, setAge] = useState('');
  const [opening, setOpening] = useState('');
  const [body, setBody] = useState('');
  const [closing, setClosing] = useState('');
  const [fullLetter, setFullLetter] = useState('');
  const [salutation, setSalutation] = useState('');
  const [authorName, setAuthorName] = useState('');

  const [salutationFocused, setSalutationFocused] = useState(false);

  const libraryModule = getModuleById(module.libraryId);
  const addEntry = useJournalStore((state) => state.addEntry);
  const settings = useJournalStore((state) => state.settings);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;

  const salutationRotation = useRotatingSuggestion(SALUTATION_SUGGESTIONS, {
    active: !salutation && !salutationFocused && phase === 'active' && stepIndex === 4,
  });

  const screen = SCREENS[stepIndex];
  const isLastScreen = stepIndex >= SCREENS.length - 1;

  const getFontClass = () => {
    const size = settings.fontSize === 'small' ? 'text-sm' : settings.fontSize === 'large' ? 'text-lg' : 'text-base';
    const family = settings.fontFamily === 'serif' ? 'font-serif' : settings.fontFamily === 'mono' ? 'font-mono' : 'font-sans';
    const height = settings.lineHeight === 'compact' ? 'leading-snug' : settings.lineHeight === 'relaxed' ? 'leading-loose' : 'leading-normal';
    return `${size} ${family} ${height}`;
  };

  const getRecipientLabel = () => {
    if (age.trim()) return `Dear ${age.trim()}-year-old me`;
    return 'Dear younger me';
  };

  const assembleLetter = useCallback(() => {
    let assembled = `${getRecipientLabel()},\n\n`;
    if (opening.trim()) assembled += `${opening.trim()}\n\n`;
    if (body.trim()) assembled += `${body.trim()}\n\n`;
    if (closing.trim()) assembled += `${closing.trim()}`;
    return assembled;
  }, [age, opening, body, closing]);

  const saveEntry = useCallback(() => {
    let savedContent = 'INNER CHILD LETTER\n\n';

    if (fullLetter.trim()) {
      savedContent += fullLetter.trim();
    } else {
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
    if (stepIndex === 3) {
      setFullLetter(assembleLetter());
    }

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
    if (stepIndex === 4) return 'Save & Continue';
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

    if (screen.type === 'letter-opening') {
      return (
        <div className="space-y-4">
          <p className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed">
            {screen.context}
          </p>

          {/* Age input */}
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[var(--color-text-primary)] text-xs uppercase tracking-wider shrink-0">
              Dear
            </span>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="age"
              min="1"
              max="99"
              className="w-16 py-2 px-0 border-0 border-b border-[var(--color-border)] bg-transparent
                         focus:outline-none focus:border-[var(--accent)]
                         text-[var(--color-text-primary)] text-center"
              style={{ textTransform: 'none' }}
            />
            <span className="text-[var(--color-text-primary)] text-xs uppercase tracking-wider shrink-0">
              year-old me,
            </span>
          </div>

          {/* Textarea */}
          <div>
            <p
              className="text-lg text-[var(--color-text-primary)] mb-2"
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

    if (screen.type === 'letter-body' || screen.type === 'letter-close') {
      const value = screen.type === 'letter-body' ? body : closing;
      const setter = screen.type === 'letter-body' ? setBody : setClosing;

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
            <div className="relative flex-1" style={{ maxWidth: '220px' }}>
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
          <div className={`transition-opacity duration-[400ms] ${isHeaderVisible ? 'opacity-100' : 'opacity-0'}`}>
            <h2
              className="text-xl font-light mb-2 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {screen.header || 'Inner Child Letter'}
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
