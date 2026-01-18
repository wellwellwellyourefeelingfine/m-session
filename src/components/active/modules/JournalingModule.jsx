/**
 * JournalingModule Component
 * Interactive journaling during session
 * Saves entries to journal store on completion
 *
 * Uses shared UI components:
 * - ModuleControlBar for consistent bottom controls
 * - ModuleLayout for consistent layout structure
 */

import { useState, useRef, useCallback } from 'react';
import { useJournalStore } from '../../../stores/useJournalStore';
import { useSessionStore } from '../../../stores/useSessionStore';

// Shared UI components
import ModuleLayout, { ModuleHeader } from '../capabilities/ModuleLayout';
import ModuleControlBar from '../capabilities/ModuleControlBar';

export default function JournalingModule({ module, onComplete, onSkip, onTimerUpdate }) {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const addEntry = useJournalStore((state) => state.addEntry);
  const settings = useJournalStore((state) => state.settings);

  // Get session ID for linking entry to session
  const sessionStartTime = useSessionStore((state) => state.timeline.actualStartTime);
  const sessionId = sessionStartTime ? new Date(sessionStartTime).toISOString() : null;

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
      addEntry({
        content: content.trim(),
        source: 'session',
        sessionId,
        moduleTitle: module.title,
      });
    }
  }, [content, addEntry, sessionId, module.title]);

  const handleComplete = useCallback(() => {
    saveEntry();
    onComplete();
  }, [saveEntry, onComplete]);

  const handleSkip = useCallback(() => {
    // Still save if there's content, even when skipping
    saveEntry();
    onSkip();
  }, [saveEntry, onSkip]);

  const hasContent = content.trim().length > 0;

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
          <ModuleHeader
            title={module.title}
            instructions={module.content?.instructions || 'Take time to write and reflect.'}
            centered
          />
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

        {/* Writing area */}
        <div className="flex-1 mb-6 min-h-0">
          <div className="relative h-full border border-[var(--color-border)] rounded-lg overflow-hidden" style={{ minHeight: '200px' }}>
            {/* Placeholder */}
            {!content && !isFocused && (
              <div
                className="absolute top-4 left-4 text-[var(--color-text-tertiary)] pointer-events-none"
                style={{ textTransform: 'none' }}
              >
                <span className={`${getFontSizeClass()} ${getFontFamilyClass()}`}>
                  What's on your mind?
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
              style={{ textTransform: 'none', minHeight: '200px' }}
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
