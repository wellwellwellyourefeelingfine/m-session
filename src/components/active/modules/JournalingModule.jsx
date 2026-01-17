/**
 * JournalingModule Component
 * Interactive journaling during session
 * Saves entries to journal store on completion
 */

import { useState, useRef, useEffect } from 'react';
import { useJournalStore } from '../../../stores/useJournalStore';
import { useSessionStore } from '../../../stores/useSessionStore';

export default function JournalingModule({ module, onComplete, onSkip }) {
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

  const handleComplete = () => {
    // Save entry if there's content
    if (content.trim()) {
      addEntry({
        content: content.trim(),
        source: 'session',
        sessionId,
        moduleTitle: module.title,
      });
    }
    onComplete();
  };

  const handleSkip = () => {
    // Still save if there's content, even when skipping
    if (content.trim()) {
      addEntry({
        content: content.trim(),
        source: 'session',
        sessionId,
        moduleTitle: module.title,
      });
    }
    onSkip();
  };

  return (
    <div className="flex flex-col h-full px-6 py-8">
      {/* Header with title and instructions */}
      <div className="text-center mb-6">
        <h2 className="text-[var(--color-text-primary)] mb-3">
          {module.title}
        </h2>

        <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
          {module.content?.instructions || 'Take time to write and reflect.'}
        </p>
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

      {/* Action buttons */}
      <div className="w-full max-w-md mx-auto space-y-4">
        <button
          onClick={handleComplete}
          className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)]
                     uppercase tracking-wider hover:opacity-80 transition-opacity duration-300"
        >
          {content.trim() ? 'Save & Continue' : 'Continue'}
        </button>

        <button
          onClick={handleSkip}
          className="w-full py-2 text-[var(--color-text-tertiary)] underline"
        >
          {content.trim() ? 'Save & Skip' : 'Skip'}
        </button>
      </div>
    </div>
  );
}
