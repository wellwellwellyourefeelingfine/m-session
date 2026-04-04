/**
 * FeelingDialogueModule Component
 * A guided conversation with a feeling. The user names a feeling,
 * then has a back-and-forth dialogue with it.
 *
 * Flow: Idle → Education → Name → You speak → It speaks → You respond → What it needs → Review → Closing → Completion
 */

import { useState, useCallback, useEffect } from 'react';
import useProgressReporter from '../../../hooks/useProgressReporter';
import { useJournalStore } from '../../../stores/useJournalStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { getModuleById } from '../../../content/modules';
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
    header: 'Dialogue with a Feeling',
    lines: [
      'Feelings carry information. They are not random. Even the ones that seem to come from nowhere are responding to something real, something your body registered before your conscious mind caught up.',
      '§',
      'During a session, feelings can become vivid enough to feel like separate presences. This makes it possible to do something that usually feels strange: speak to a feeling directly and let it speak back.',
      '§',
      'You are going to name a feeling that is present right now, and then have a short conversation with it. Write whatever comes. You do not need to force anything.',
    ],
  },
  // Screen 1: Name the feeling
  { type: 'name-feeling' },
  // Screen 2: You speak to it
  {
    type: 'dialogue',
    key: 'youSay',
    context: 'Address this feeling directly, as if it were sitting across from you. You can say anything. It has been waiting to hear from you.',
    promptTemplate: 'What do you want to say to {feeling}?',
    placeholder: 'I want to tell you that...',
  },
  // Screen 3: It speaks back
  {
    type: 'dialogue',
    key: 'itSays',
    context: 'Now let the feeling respond. You do not need to force this. Just sit with the question and write whatever comes, even if it surprises you.',
    promptTemplate: 'What does {feeling} want you to know?',
    placeholder: 'What I need you to understand is...',
  },
  // Screen 4: You respond
  {
    type: 'dialogue',
    key: 'youRespond',
    context: 'You have heard from this feeling. Take a moment to respond.',
    promptTemplate: 'What do you want to say back?',
    placeholder: 'Now that I hear you, I...',
  },
  // Screen 5: What it needs
  {
    type: 'dialogue',
    key: 'itNeeds',
    context: 'Every feeling is trying to protect or communicate something. Even the painful ones.',
    promptTemplate: 'What does {feeling} need from you?',
    placeholder: 'What you need is...',
  },
  // Screen 6: Review
  { type: 'review', header: 'Your Dialogue' },
  // Screen 7: Closing
  {
    type: 'text',
    header: 'After the dialogue',
    lines: [
      'Feelings often soften when they are acknowledged directly. You may notice that the feeling you named has shifted, even slightly, just from the act of turning toward it and listening.',
      '§',
      'This does not mean the feeling is resolved. It means you have changed your relationship to it. Instead of something that happens to you, it becomes something you are in conversation with.',
      '§',
      'Your dialogue is saved in your journal. You can return to it, continue it, or start a new dialogue with a different feeling whenever you are ready.',
    ],
  },
];

// ── Main Component ─────────────────────────────────────────

export default function FeelingDialogueModule({ module, onComplete, onSkip, onProgressUpdate }) {
  const [phase, setPhase] = useState('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isBodyVisible, setIsBodyVisible] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  // Dialogue content
  const [feelingName, setFeelingName] = useState('');
  const [feelingBody, setFeelingBody] = useState('');
  const [youSay, setYouSay] = useState('');
  const [itSays, setItSays] = useState('');
  const [youRespond, setYouRespond] = useState('');
  const [itNeeds, setItNeeds] = useState('');
  const [fullDialogue, setFullDialogue] = useState('');

  const dialogueState = { youSay, itSays, youRespond, itNeeds };
  const dialogueSetters = {
    youSay: setYouSay,
    itSays: setItSays,
    youRespond: setYouRespond,
    itNeeds: setItNeeds,
  };

  const libraryModule = getModuleById(module.libraryId);
  const addEntry = useJournalStore((state) => state.addEntry);
  const settings = useJournalStore((state) => state.settings);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;

  const report = useProgressReporter(onProgressUpdate);

  useEffect(() => {
    if (phase === 'idle') {
      report.idle();
    } else if (phase === 'complete') {
      report.step(SCREENS.length, SCREENS.length);
    } else if (phase === 'active') {
      report.step(stepIndex + 1, SCREENS.length);
    }
  }, [phase, stepIndex, report]);

  const screen = SCREENS[stepIndex];
  const isLastScreen = stepIndex >= SCREENS.length - 1;
  const feeling = feelingName.trim() || 'this feeling';

  const getFontClass = () => {
    const size = settings.fontSize === 'small' ? 'text-sm' : settings.fontSize === 'large' ? 'text-lg' : 'text-base';
    const family = settings.fontFamily === 'serif' ? 'font-serif' : settings.fontFamily === 'mono' ? 'font-mono' : 'font-sans';
    const height = settings.lineHeight === 'compact' ? 'leading-snug' : settings.lineHeight === 'relaxed' ? 'leading-loose' : 'leading-normal';
    return `${size} ${family} ${height}`;
  };

  const assembleDialogue = useCallback(() => {
    const ts = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const feeling = feelingName.trim() || 'Feeling';
    let assembled = '';
    assembled += `Feeling: ${feelingName.trim() || `[no entry — ${ts}]`}\n`;
    assembled += `Where I feel it: ${feelingBody.trim() || `[no entry — ${ts}]`}\n`;
    assembled += '\n';
    assembled += `Me: ${youSay.trim() || `[no entry — ${ts}]`}\n\n`;
    assembled += `${feeling}: ${itSays.trim() || `[no entry — ${ts}]`}\n\n`;
    assembled += `Me: ${youRespond.trim() || `[no entry — ${ts}]`}\n\n`;
    assembled += `What it needs: ${itNeeds.trim() || `[no entry — ${ts}]`}`;
    return assembled;
  }, [feelingName, feelingBody, youSay, itSays, youRespond, itNeeds]);

  const saveEntry = useCallback(() => {
    let savedContent = 'DIALOGUE WITH A FEELING\n\n';

    if (fullDialogue.trim()) {
      savedContent += fullDialogue.trim();
    } else {
      savedContent += assembleDialogue();
    }

    addEntry({
      content: savedContent.trim(),
      source: 'session',
      sessionId,
      moduleTitle: module.title,
    });
  }, [fullDialogue, assembleDialogue, addEntry, sessionId, module.title]);

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
    // Assemble dialogue when advancing to review
    if (stepIndex === 5) {
      setFullDialogue(assembleDialogue());
    }

    // Save on review screen
    if (stepIndex === 6) {
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
  }, [stepIndex, isLastScreen, assembleDialogue, saveEntry]);

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
    if (stepIndex === 6) return 'Save & Continue';
    if (isLastScreen) return 'Complete';
    return 'Continue';
  };

  const renderScreen = () => {
    // Text screens (education/closing)
    if (screen.type === 'text') {
      return (
        <div className="space-y-4">
          {renderContentLines(screen.lines)}
        </div>
      );
    }

    // Name the feeling
    if (screen.type === 'name-feeling') {
      return (
        <div className="space-y-4">
          <p className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed">
            Notice what is most present in your body right now. It might be something you can name easily, or it might be vaguer than that. Start with whatever word comes closest.
          </p>

          <p
            className="text-lg text-[var(--color-text-primary)]"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            What feeling is here right now?
          </p>
          <input
            type="text"
            value={feelingName}
            onChange={(e) => setFeelingName(e.target.value)}
            placeholder="grief, anger, a tightness..."
            className={`w-full py-2 px-0 border-0 border-b border-[var(--color-border)] bg-transparent
                       focus:outline-none focus:border-[var(--accent)]
                       text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]`}
            style={{ textTransform: 'none' }}
          />

          <p
            className="text-lg text-[var(--color-text-primary)] mt-4"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            Where do you feel it? What does it look like?
          </p>
          <textarea
            value={feelingBody}
            onChange={(e) => setFeelingBody(e.target.value)}
            placeholder="Heavy in my chest, dark, like a weight..."
            rows={4}
            className={`w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] leading-relaxed
              placeholder:text-[var(--color-text-tertiary)] resize-none ${getFontClass()}`}
            style={{ textTransform: 'none' }}
          />
        </div>
      );
    }

    // Dialogue screens (you speak, it speaks, you respond, what it needs)
    if (screen.type === 'dialogue') {
      const value = dialogueState[screen.key];
      const setter = dialogueSetters[screen.key];
      const prompt = screen.promptTemplate.replace('{feeling}', feeling);

      return (
        <div className="space-y-4">
          <p className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed">
            {screen.context}
          </p>
          <p
            className="text-lg text-[var(--color-text-primary)]"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {prompt}
          </p>
          <textarea
            value={value}
            onChange={(e) => setter(e.target.value)}
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

    // Review screen
    if (screen.type === 'review') {
      return (
        <div className="space-y-4">
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed" style={{ textTransform: 'none' }}>
            Here is your dialogue assembled from what you wrote. You can freely edit, add, or remove anything before saving.
          </p>

          <textarea
            value={fullDialogue}
            onChange={(e) => setFullDialogue(e.target.value)}
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
              {screen.header || 'Dialogue with a Feeling'}
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
