/**
 * JournalingModule Component
 * Interactive journaling during session with configurable screen types.
 * Saves entries to journal store on completion.
 *
 * Supports two content formats:
 *
 * 1. New `screens` array (flexible, any mix of screen types in any order):
 *    content.screens: [
 *      { type: 'text', header, lines },
 *      { type: 'prompt', prompt, context, placeholder },
 *      { type: 'selector', prompt, context, options, key, columns, multiSelect, journal },
 *      ...
 *    ]
 *
 * 2. Legacy format (backward compatible):
 *    content.introScreens + content.prompts + content.closingScreens
 *
 * Flow: Idle → Active (screens in order) → Completion
 */

import { useState, useCallback, useMemo } from 'react';
import { useJournalStore } from '../../../stores/useJournalStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { getModuleById } from '../../../content/modules';
import ModuleLayout, { CompletionScreen, IdleScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar from '../capabilities/ModuleControlBar';
import AsciiMoon from '../capabilities/animations/AsciiMoon';

export default function JournalingModule({ module, onComplete, onSkip, _onTimerUpdate }) {
  const [phase, setPhase] = useState('idle');
  const [screenIndex, setScreenIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [selectorValues, setSelectorValues] = useState({});
  const [selectorJournals, setSelectorJournals] = useState({});
  const [isLeaving, setIsLeaving] = useState(false);
  const [isBodyVisible, setIsBodyVisible] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  const libraryModule = getModuleById(module.libraryId);

  // Build unified screen list — supports new `screens` format or legacy format
  const screens = useMemo(() => {
    // New format: content.screens array with mixed types
    if (module.content?.screens?.length > 0) {
      let promptCounter = 0;
      return module.content.screens.map((s) => {
        if (s.type === 'prompt') {
          return { ...s, promptIndex: promptCounter++ };
        }
        return s;
      });
    }

    // Legacy format: introScreens + prompts + closingScreens
    const prompts = module.content?.prompts || [];
    const effectivePrompts = prompts.length > 0
      ? prompts
      : [module.content?.instructions || 'Write freely about whatever is present for you.'];

    const introScreens = (module.content?.introScreens || []).map((s) => ({ type: 'text', ...s }));
    const promptScreens = effectivePrompts.map((prompt, i) => ({ type: 'prompt', prompt, promptIndex: i }));
    const closingScreens = (module.content?.closingScreens || []).map((s) => ({ type: 'text', ...s }));
    return [...introScreens, ...promptScreens, ...closingScreens];
  }, [module.content]);

  const currentScreen = screens[screenIndex];
  const isLastScreen = screenIndex >= screens.length - 1;

  // Find the last saveable screen index (prompt or selector)
  const lastSaveableIndex = useMemo(() => {
    for (let i = screens.length - 1; i >= 0; i--) {
      if (screens[i].type === 'prompt' || screens[i].type === 'selector') return i;
    }
    return -1;
  }, [screens]);

  const addEntry = useJournalStore((state) => state.addEntry);
  const settings = useJournalStore((state) => state.settings);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getFontFamilyClass = () => {
    switch (settings.fontFamily) {
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      default: return 'font-sans';
    }
  };

  const getLineHeightClass = () => {
    switch (settings.lineHeight) {
      case 'compact': return 'leading-snug';
      case 'relaxed': return 'leading-loose';
      default: return 'leading-normal';
    }
  };

  const saveEntry = useCallback(() => {
    const title = module.title?.toUpperCase() || 'JOURNALING';
    let savedContent = `${title}\n`;

    screens.forEach((screen) => {
      if (screen.type === 'prompt') {
        savedContent += `\n${screen.prompt}\n`;
        if (responses[screen.promptIndex]?.trim()) {
          savedContent += `${responses[screen.promptIndex].trim()}\n`;
        }
      }
      if (screen.type === 'selector') {
        savedContent += `\n${screen.prompt}\n`;
        const selected = selectorValues[screen.key];
        if (selected) {
          if (Array.isArray(selected)) {
            const labels = selected.map((id) => screen.options.find((o) => o.id === id)?.label || id);
            savedContent += `${labels.join(', ')}\n`;
          } else {
            const label = screen.options.find((o) => o.id === selected)?.label || selected;
            savedContent += `${label}\n`;
          }
        }
        if (screen.journal && selectorJournals[screen.key]?.trim()) {
          savedContent += `${selectorJournals[screen.key].trim()}\n`;
        }
      }
    });

    addEntry({
      content: savedContent.trim(),
      source: 'session',
      sessionId,
      moduleTitle: module.title,
    });
  }, [responses, selectorValues, selectorJournals, screens, addEntry, sessionId, module.title]);

  // Selector handlers
  const handleSelectorToggle = useCallback((key, optionId, multiSelect) => {
    setSelectorValues((prev) => {
      if (multiSelect) {
        const current = prev[key] || [];
        return {
          ...prev,
          [key]: current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      }
      return { ...prev, [key]: prev[key] === optionId ? null : optionId };
    });
  }, []);

  // Phase transitions
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
    if (screenIndex === lastSaveableIndex) {
      saveEntry();
    }

    if (isLastScreen) {
      setIsBodyVisible(false);
      setIsHeaderVisible(false);
      setTimeout(() => {
        setPhase('complete');
      }, 400);
    } else {
      setIsBodyVisible(false);
      setTimeout(() => {
        document.querySelector('main')?.scrollTo(0, 0);
        setScreenIndex((prev) => prev + 1);
        setIsBodyVisible(true);
      }, 400);
    }
  }, [isLastScreen, screenIndex, lastSaveableIndex, saveEntry]);

  const handleBack = useCallback(() => {
    setIsBodyVisible(false);
    setTimeout(() => {
      document.querySelector('main')?.scrollTo(0, 0);
      setScreenIndex((prev) => Math.max(0, prev - 1));
      setIsBodyVisible(true);
    }, 400);
  }, []);

  const handleSkip = useCallback(() => {
    saveEntry();
    onSkip();
  }, [saveEntry, onSkip]);

  // ── Idle Phase ─────────────────────────────────────────

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

  // ── Completion Phase ───────────────────────────────────

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

  // ── Active Phase ───────────────────────────────────────

  const defaultPlaceholder = libraryModule?.capabilities?.input?.placeholder || 'Write freely...';

  // Count only prompt screens for the counter display
  const promptScreens = screens.filter((s) => s.type === 'prompt');
  const currentPromptNumber = currentScreen?.type === 'prompt'
    ? screens.slice(0, screenIndex + 1).filter((s) => s.type === 'prompt').length
    : null;

  const getPrimaryLabel = () => {
    if (screenIndex === lastSaveableIndex) return 'Save & Continue';
    if (isLastScreen) return 'Complete';
    return 'Continue';
  };

  const renderScreen = () => {
    // Text-only screens (education pages)
    if (currentScreen.type === 'text') {
      return (
        <div className="space-y-0">
          {currentScreen.lines?.map((line, i) => {
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

    // Prompt screen with textarea
    if (currentScreen.type === 'prompt') {
      return (
        <div>
          {currentScreen.context && (
            <p className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed mb-3">
              {currentScreen.context}
            </p>
          )}

          <p
            className="text-lg mb-3 text-[var(--color-text-primary)]"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {currentScreen.prompt}
          </p>

          <textarea
            value={responses[currentScreen.promptIndex] || ''}
            onChange={(e) => setResponses((prev) => ({ ...prev, [currentScreen.promptIndex]: e.target.value }))}
            placeholder={currentScreen.placeholder || defaultPlaceholder}
            rows={6}
            className={`w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] leading-relaxed
              placeholder:text-[var(--color-text-tertiary)] resize-none
              ${getFontSizeClass()} ${getFontFamilyClass()} ${getLineHeightClass()}`}
            style={{ textTransform: 'none' }}
          />

          {promptScreens.length > 1 && currentPromptNumber && (
            <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider mt-2 text-center">
              {currentPromptNumber} of {promptScreens.length}
            </p>
          )}
        </div>
      );
    }

    // Selector screen with grid + optional textarea
    if (currentScreen.type === 'selector') {
      const columns = currentScreen.columns || 2;
      const isMulti = currentScreen.multiSelect || false;
      const selected = selectorValues[currentScreen.key];

      const isOptionSelected = (optionId) => {
        if (isMulti) return (selected || []).includes(optionId);
        return selected === optionId;
      };

      return (
        <div className="space-y-4">
          {currentScreen.context && (
            <p className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed">
              {currentScreen.context}
            </p>
          )}

          <p
            className="text-lg text-[var(--color-text-primary)]"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {currentScreen.prompt}
          </p>

          <div className={`grid gap-2 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {currentScreen.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectorToggle(currentScreen.key, option.id, isMulti)}
                className={`py-3 px-3 border transition-colors duration-150 text-left ${
                  isOptionSelected(option.id)
                    ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
                    : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)]'
                }`}
              >
                <span className="text-xs uppercase tracking-wider">{option.label}</span>
              </button>
            ))}
          </div>

          {currentScreen.journal && (
            <div>
              <p
                className="text-base text-[var(--color-text-primary)] mb-2"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                {currentScreen.journal.prompt}
              </p>
              <textarea
                value={selectorJournals[currentScreen.key] || ''}
                onChange={(e) => setSelectorJournals((prev) => ({ ...prev, [currentScreen.key]: e.target.value }))}
                placeholder={currentScreen.journal.placeholder}
                rows={currentScreen.journal.rows || 3}
                className={`w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                  focus:outline-none focus:border-[var(--accent)]
                  text-[var(--color-text-primary)] leading-relaxed
                  placeholder:text-[var(--color-text-tertiary)] resize-none
                  ${getFontSizeClass()} ${getFontFamilyClass()} ${getLineHeightClass()}`}
                style={{ textTransform: 'none' }}
              />
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <ModuleLayout layout={{ centered: false, maxWidth: 'sm', padding: 'normal' }}>
        <div className="pt-2">
          {/* Header + animation */}
          <div className={`transition-opacity duration-[400ms] ${isHeaderVisible ? 'opacity-100' : 'opacity-0'}`}>
            <h2
              className="text-xl font-light mb-2 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {currentScreen?.header || module.title}
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
        showBack={screenIndex > 0}
        onBack={handleBack}
        showSkip={true}
        onSkip={handleSkip}
        skipConfirmMessage="Skip this activity?"
      />
    </>
  );
}
