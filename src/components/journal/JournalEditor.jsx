/**
 * JournalEditor Component
 * Full-screen editor for journal entries
 * Features: auto-save, placeholder text, settings integration
 * Matches iOS Notes minimalist style
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useJournalStore } from '../../stores/useJournalStore';

// Debounce helper
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

export default function JournalEditor({ entryId, onBack, isVisible = true }) {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false);
  const textareaRef = useRef(null);
  const isNewEntryRef = useRef(!entryId);
  const createdEntryIdRef = useRef(null);

  const settings = useJournalStore((state) => state.settings);
  const getEntryById = useJournalStore((state) => state.getEntryById);
  const addEntry = useJournalStore((state) => state.addEntry);
  const updateEntry = useJournalStore((state) => state.updateEntry);

  // Load entry content if editing existing entry
  useEffect(() => {
    if (entryId) {
      const entry = getEntryById(entryId);
      if (entry) {
        setContent(entry.content);
        isNewEntryRef.current = false;
        createdEntryIdRef.current = null;
      }
    } else {
      setContent('');
      isNewEntryRef.current = true;
      createdEntryIdRef.current = null;
    }
    setHasUnsavedChanges(false);
    // Reset content ready when entry changes - will fade in when visible
    setIsContentReady(false);
  }, [entryId, getEntryById]);

  // Trigger fade-in when becoming visible (after animation completes)
  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure the transition is visible
      const timer = setTimeout(() => {
        setIsContentReady(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Immediately hide content when navigating away
      setIsContentReady(false);
    }
  }, [isVisible]);

  // Auto-save function
  const saveContent = useCallback(
    (newContent) => {
      if (!newContent.trim()) return; // Don't save empty entries

      if (entryId) {
        // Updating existing entry
        updateEntry(entryId, newContent);
      } else if (createdEntryIdRef.current) {
        // Update the entry we already created for this new entry
        updateEntry(createdEntryIdRef.current, newContent);
      } else {
        // Create new entry
        const newEntry = addEntry({ content: newContent, source: 'manual' });
        createdEntryIdRef.current = newEntry.id;
      }
      setHasUnsavedChanges(false);
    },
    [entryId, addEntry, updateEntry]
  );

  // Debounced save (500ms)
  const debouncedSave = useDebounce(saveContent, 500);

  // Handle content changes
  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setHasUnsavedChanges(true);
    debouncedSave(newContent);
  };

  // Handle back - save before navigating
  const handleBack = () => {
    if (hasUnsavedChanges && content.trim()) {
      saveContent(content);
    }
    onBack();
  };

  // Get font size class based on settings
  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  // Get font family class based on settings
  const getFontFamilyClass = () => {
    switch (settings.fontFamily) {
      case 'serif':
        return 'font-serif';
      case 'mono':
        return 'font-mono';
      default:
        return 'font-sans';
    }
  };

  // Get line height class based on settings
  const getLineHeightClass = () => {
    switch (settings.lineHeight) {
      case 'compact':
        return 'leading-snug';
      case 'relaxed':
        return 'leading-loose';
      default:
        return 'leading-normal';
    }
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Get entry metadata if editing existing
  const entry = entryId ? getEntryById(entryId) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header - just back button */}
      <div className="px-4 pt-5 pb-0">
        <button
          onClick={handleBack}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors touch-target"
          aria-label="Back to entries"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Entry metadata (for existing entries) - with fade in */}
      {entry && (
        <div
          className={`px-6 pt-1 pb-2 text-[var(--color-text-tertiary)] text-xs transition-opacity duration-300 ${
            isContentReady ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {entry.source === 'session' && (
            <span className="uppercase tracking-wider">
              Session Entry{entry.moduleTitle ? ` - ${entry.moduleTitle}` : ''}
              {entry.isEdited && ' (edited)'}
              {' · '}
            </span>
          )}
          <span>{formatDate(entry.updatedAt)}</span>
        </div>
      )}

      {/* Editor area - with fade in */}
      <div className="flex-1 overflow-auto px-6 pt-2 pb-4 min-h-0">
        <div
          className={`relative min-h-full transition-opacity duration-300 ${
            isContentReady ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Placeholder text - only show when content ready and no content */}
          {isContentReady && !content && !isFocused && (
            <div
              className="absolute top-0 left-0 text-[var(--color-text-tertiary)] pointer-events-none select-none"
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
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`w-full min-h-full bg-transparent resize-none outline-none
              text-[var(--color-text-primary)]
              ${getFontSizeClass()} ${getFontFamilyClass()} ${getLineHeightClass()}
              placeholder:text-[var(--color-text-tertiary)]`}
            style={{ textTransform: 'none', minHeight: '300px' }}
            placeholder=""
          />
        </div>
      </div>

      {/* Save indicator */}
      {hasUnsavedChanges && (
        <div className="px-6 py-2 text-center text-[var(--color-text-tertiary)] text-xs">
          Saving...
        </div>
      )}
    </div>
  );
}
