/**
 * JournalingModule Component
 * Interactive journaling during session
 * Saves entries to journal store on completion
 *
 * Uses shared UI components:
 * - ModuleControlBar for consistent bottom controls
 * - ModuleLayout for consistent layout structure
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useJournalStore } from '../../../stores/useJournalStore';
import { useSessionStore } from '../../../stores/useSessionStore';

// Shared UI components
import ModuleLayout, { ModuleHeader } from '../capabilities/ModuleLayout';
import ModuleControlBar from '../capabilities/ModuleControlBar';

export default function JournalingModule({ module, onComplete, onSkip, onTimerUpdate }) {
  const [content, setContent] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const isLetterWriting = module.libraryId === 'letter-writing';

  // Rotating placeholder suggestions for the recipient field
  const recipientSuggestions = [
    '[a loved one]',
    '[my future self]',
    '[my younger self]',
    '[someone I miss]',
    '[a friend]',
    '[a part of me]',
  ];
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [suggestionVisible, setSuggestionVisible] = useState(true);
  const [recipientFocused, setRecipientFocused] = useState(false);

  useEffect(() => {
    if (!isLetterWriting || recipient || recipientFocused) return;
    const cycle = setInterval(() => {
      setSuggestionVisible(false);
      setTimeout(() => {
        setSuggestionIndex((i) => (i + 1) % recipientSuggestions.length);
        setSuggestionVisible(true);
      }, 600);
    }, 3000);
    return () => clearInterval(cycle);
  }, [isLetterWriting, recipient, recipientFocused]);

  const addEntry = useJournalStore((state) => state.addEntry);
  const settings = useJournalStore((state) => state.settings);

  // Get session ID for linking entry to session
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;

  // Get font classes from settings
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
    if (content.trim()) {
      // For letter writing, prepend the salutation to the saved content
      const savedContent = isLetterWriting && recipient.trim()
        ? `Dear ${recipient.trim()},\n\n${content.trim()}`
        : content.trim();
      addEntry({
        content: savedContent,
        source: 'session',
        sessionId,
        moduleTitle: module.title,
      });
    }
  }, [content, recipient, isLetterWriting, addEntry, sessionId, module.title]);

  const handleComplete = useCallback(() => {
    saveEntry();
    onComplete();
  }, [saveEntry, onComplete]);

  const handleSkip = useCallback(() => {
    // Still save if there's content, even when skipping
    saveEntry();
    onSkip();
  }, [saveEntry, onSkip]);

  const hasContent = content.trim().length > 0 || (isLetterWriting && recipient.trim().length > 0);

  // Get primary button config
  const getPrimaryButton = () => {
    return {
      label: hasContent ? 'Save & Continue' : 'Continue',
      onClick: handleComplete,
    };
  };

  return (
    <>
      <ModuleLayout
        layout={{ centered: false, maxWidth: 'lg', padding: 'normal' }}
      >
        {/* Header with title and instructions */}
        <div className="text-center mb-6">
          {isLetterWriting ? (
            <>
              <h2
                className="text-2xl text-[var(--color-text-primary)] mb-3"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                {module.title}
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed" style={{ textTransform: 'none' }}>
                {module.content?.instructions || 'Take time to write and reflect.'}
              </p>
              <p className="text-[var(--color-text-tertiary)] text-xs mt-2" style={{ textTransform: 'none' }}>
                This will be saved to your journal, where you can revisit or add to it later.
              </p>
            </>
          ) : (
            <ModuleHeader
              title={module.title}
              instructions={module.content?.instructions || 'Take time to write and reflect.'}
              centered
            />
          )}
        </div>

        {/* Prompts if available */}
        {module.content?.prompts && module.content.prompts.length > 0 && (
          <div className="mb-6 space-y-2">
            {module.content.prompts.map((prompt, index) => (
              <p
                key={index}
                className="text-[var(--color-text-secondary)] italic text-sm text-center"
                style={{ textTransform: 'none' }}
              >
                {prompt}
              </p>
            ))}
          </div>
        )}

        {/* Recipient input for letter writing */}
        {isLetterWriting && (
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span
                className="text-[var(--color-text-primary)] text-base shrink-0"
                style={{ fontFamily: 'Azeret Mono, monospace', textTransform: 'none' }}
              >
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
                  placeholder=""
                />
                {!recipient && !recipientFocused && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none transition-opacity duration-500"
                    style={{ textTransform: 'none', opacity: suggestionVisible ? 1 : 0 }}
                  >
                    {recipientSuggestions[suggestionIndex]}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Writing area */}
        <div className="flex-1 mb-6 min-h-0">
          <div className="relative h-full border border-[var(--color-border)] rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
            {/* Placeholder */}
            {!content && !isFocused && (
              <div
                className="absolute top-4 left-4 text-[var(--color-text-tertiary)] pointer-events-none"
                style={{ textTransform: 'none' }}
              >
                <span className={`${getFontSizeClass()} ${getFontFamilyClass()}`}>
                  {isLetterWriting
                    ? 'Write your letter here...'
                    : "What's on your mind?"}
                </span>
              </div>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`w-full h-full p-4 bg-transparent resize-none outline-none
                text-[var(--color-text-primary)]
                ${getFontSizeClass()} ${getFontFamilyClass()} ${getLineHeightClass()}`}
              style={{ textTransform: 'none', minHeight: '300px' }}
              placeholder=""
            />
          </div>
        </div>
      </ModuleLayout>

      {/* Fixed control bar above tab bar */}
      <ModuleControlBar
        phase="simple"
        primary={getPrimaryButton()}
        showBack={false}
        showSkip={true}
        onSkip={handleSkip}
        skipConfirmMessage={hasContent ? "Save your writing and skip?" : "Skip this journaling prompt?"}
      />
    </>
  );
}
