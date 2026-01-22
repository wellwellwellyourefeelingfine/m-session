/**
 * JournalEditor Component
 * Full-screen editor for journal entries
 * Features: auto-save, placeholder text, settings integration
 *
 * iOS Notes-style behavior:
 * - Typing at end of document: cursor stays fixed at halfway point, content scrolls up
 * - Clicking anywhere: no auto-scroll (user can edit freely)
 * - True edge-to-edge content display (flush with header/footer)
 * - Virtual scroll space below content allows last line to scroll to center
 * - Floating back button with accent styling
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

/**
 * Calculate the Y position of the caret in the textarea
 * Uses a mirror div technique to measure text up to cursor position
 */
const getCaretYPosition = (textarea, mirrorRef) => {
  if (!textarea || !mirrorRef.current) return null;

  const mirror = mirrorRef.current;
  const cursorPosition = textarea.selectionStart;
  const textBeforeCursor = textarea.value.substring(0, cursorPosition);

  // Copy textarea styles to mirror
  const computedStyle = window.getComputedStyle(textarea);
  mirror.style.width = computedStyle.width;
  mirror.style.fontSize = computedStyle.fontSize;
  mirror.style.fontFamily = computedStyle.fontFamily;
  mirror.style.lineHeight = computedStyle.lineHeight;
  mirror.style.padding = computedStyle.padding;
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';

  // Set content up to cursor and measure
  mirror.textContent = textBeforeCursor;

  // Add a span at the end to mark cursor position
  const cursorSpan = document.createElement('span');
  cursorSpan.textContent = '|';
  mirror.appendChild(cursorSpan);

  const caretY = cursorSpan.offsetTop;

  return caretY;
};

export default function JournalEditor({ entryId, onBack, isVisible = true }) {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false);

  const textareaRef = useRef(null);
  const editorAreaRef = useRef(null);
  const mirrorRef = useRef(null);
  const isNewEntryRef = useRef(!entryId);
  const createdEntryIdRef = useRef(null);

  const settings = useJournalStore((state) => state.settings);
  const getEntryById = useJournalStore((state) => state.getEntryById);
  const addEntry = useJournalStore((state) => state.addEntry);
  const updateEntry = useJournalStore((state) => state.updateEntry);

  // Subscribe to entries for metadata display only (doesn't trigger content reload)
  const entries = useJournalStore((state) => state.entries);

  // Load entry content ONLY when entryId changes (initial load)
  useEffect(() => {
    if (entryId) {
      const entry = getEntryById(entryId);
      if (entry) {
        setContent(entry.content);
        isNewEntryRef.current = false;
        createdEntryIdRef.current = null;
      } else {
        setContent('');
        isNewEntryRef.current = true;
        createdEntryIdRef.current = null;
      }
    } else {
      setContent('');
      isNewEntryRef.current = true;
      createdEntryIdRef.current = null;
    }
    setHasUnsavedChanges(false);
    setIsContentReady(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  // Trigger fade-in when becoming visible and auto-resize textarea
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsContentReady(true);
        // Auto-resize textarea after content is loaded
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsContentReady(false);
    }
  }, [isVisible]);

  // Simple auto-scroll: if cursor is below 50%, scroll to keep it at 50%
  // Checked on every keystroke - instant scroll, no smooth animation
  const maybeAutoScroll = useCallback(() => {
    const textarea = textareaRef.current;
    const editorArea = editorAreaRef.current;
    if (!textarea || !editorArea) return;

    const caretY = getCaretYPosition(textarea, mirrorRef);
    if (caretY === null) return;

    const viewportHeight = editorArea.getBoundingClientRect().height;
    const targetPosition = viewportHeight * 0.5;
    const caretInViewport = caretY - editorArea.scrollTop;

    // If cursor is below 50%, instantly scroll to bring it to 50%
    if (caretInViewport > targetPosition) {
      editorArea.scrollTop = Math.max(0, caretY - targetPosition);
    }
  }, []);

  // Auto-save function
  const saveContent = useCallback(
    (newContent) => {
      if (!newContent.trim()) return;

      if (entryId) {
        updateEntry(entryId, newContent);
      } else if (createdEntryIdRef.current) {
        updateEntry(createdEntryIdRef.current, newContent);
      } else {
        const newEntry = addEntry({ content: newContent, source: 'manual' });
        createdEntryIdRef.current = newEntry.id;
      }
      setHasUnsavedChanges(false);
    },
    [entryId, addEntry, updateEntry]
  );

  // Debounced save (500ms)
  const debouncedSave = useDebounce(saveContent, 500);

  // Auto-resize textarea to fit content
  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set height to scrollHeight to fit content
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  // Handle content changes (typing)
  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setHasUnsavedChanges(true);
    debouncedSave(newContent);

    // Auto-resize and maybe auto-scroll
    requestAnimationFrame(() => {
      autoResizeTextarea();
      maybeAutoScroll();
    });
  };

  // Handle back - save before navigating
  const handleBack = () => {
    if (hasUnsavedChanges && content.trim()) {
      saveContent(content);
    }
    onBack();
  };

  // Handle click on the spacer area below text - move cursor to end
  const handleSpacerClick = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    const len = textarea.value?.length || 0;
    textarea.setSelectionRange(len, len);
  };

  // Handle click on textarea - no special behavior needed
  const handleTextareaClick = () => {
    // No-op
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
  const entry = entryId ? entries.find((e) => e.id === entryId) : null;

  return (
    <div className="relative h-full">
      {/* Hidden mirror div for caret position calculation */}
      <div
        ref={mirrorRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          visibility: 'hidden',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
      />

      {/* Floating back button - accent styled circle */}
      <button
        onClick={handleBack}
        className="absolute top-3 left-4 z-20 w-10 h-10 rounded-full border border-[var(--accent)] bg-[var(--accent-bg)] flex items-center justify-center transition-opacity hover:opacity-80"
        aria-label="Back to entries"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Editor area - fills entire space */}
      <div
        ref={editorAreaRef}
        className="absolute inset-0 overflow-auto journal-editor-scroll"
      >
        <div
          className={`transition-opacity duration-300 ${
            isContentReady ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Header row - scrolls with content */}
          {entry ? (
            <div className="pt-3 px-4" style={{ minHeight: '3rem' }}>
              {/* Entry metadata - right-aligned, wraps if needed */}
              <div className="text-[var(--color-text-tertiary)] text-xs text-right leading-relaxed">
                {entry.source === 'session' ? (
                  <>
                    <span className="uppercase tracking-wider">
                      Session Entry
                    </span>
                    {entry.moduleTitle && (
                      <span className="uppercase tracking-wider block">
                        {entry.moduleTitle}
                      </span>
                    )}
                    {entry.isEdited && (
                      <span className="uppercase tracking-wider"> (edited)</span>
                    )}
                    <span className="block">{formatDate(entry.updatedAt)}</span>
                  </>
                ) : (
                  <>
                    <span>{formatDate(entry.updatedAt)}</span>
                    {/* Extra spacing for normal notes to clear back button */}
                    <div style={{ height: '2rem' }} />
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Spacer for new notes - clears the back button */
            <div style={{ height: '3.5rem' }} />
          )}

          {/* Textarea wrapper with overlaid placeholder */}
          <div className="relative">
            {/* Placeholder text - absolutely positioned to overlay textarea, matches user font settings */}
            {isContentReady && !content && !isFocused && (
              <div
                className={`absolute left-0 right-0 px-4 text-[var(--color-text-tertiary)] pointer-events-none select-none
                  ${getFontSizeClass()} ${getFontFamilyClass()} ${getLineHeightClass()}`}
                style={{ textTransform: 'none', top: '10px' }}
              >
                What's on your mind?
              </div>
            )}

            {/* Textarea - edge-to-edge content */}
            <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onClick={handleTextareaClick}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`w-full bg-transparent resize-none outline-none px-4
              text-[var(--color-text-primary)]
              ${getFontSizeClass()} ${getFontFamilyClass()} ${getLineHeightClass()}
              placeholder:text-[var(--color-text-tertiary)]`}
            style={{
              textTransform: 'none',
              minHeight: 'auto',
              paddingTop: '10px',
            }}
            placeholder=""
          />
          </div>

          {/* Virtual scroll space - allows last line to scroll to halfway point */}
          <div
            className="cursor-text"
            style={{ height: '50vh', flexShrink: 0 }}
            onClick={handleSpacerClick}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Save indicator - floating at bottom */}
      {hasUnsavedChanges && (
        <div className="absolute bottom-0 left-0 right-0 text-center text-[var(--color-text-tertiary)] text-xs pointer-events-none">
          Saving...
        </div>
      )}
    </div>
  );
}
