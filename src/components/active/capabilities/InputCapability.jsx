/**
 * InputCapability Component
 *
 * Handles user input collection:
 * - 'journal': Text area for writing (integrates with journal store)
 * - 'checkin': Rating/response selection (future)
 */

import { useState, useRef, useCallback } from 'react';
import { useJournalStore } from '../../../stores/useJournalStore';
import { useSessionStore } from '../../../stores/useSessionStore';

/**
 * @param {object} props
 * @param {object} props.config - Input capability config
 * @param {string} props.config.type - 'journal' | 'checkin'
 * @param {boolean} props.config.saveToJournal - Whether to save to journal store
 * @param {string} props.config.placeholder - Placeholder text
 * @param {string} props.moduleTitle - Title of the module (for journal entry)
 * @param {string} props.value - Controlled value (optional)
 * @param {function} props.onChange - Change handler (optional)
 * @param {function} props.onSave - Called when content should be saved
 */
export default function InputCapability({
  config,
  moduleTitle,
  value: controlledValue,
  onChange: controlledOnChange,
  onSave,
}) {
  if (!config || !config.type) {
    return null;
  }

  const { type } = config;

  switch (type) {
    case 'journal':
      return (
        <JournalInput
          config={config}
          moduleTitle={moduleTitle}
          value={controlledValue}
          onChange={controlledOnChange}
          onSave={onSave}
        />
      );

    case 'checkin':
      return (
        <CheckinInput
          config={config}
        />
      );

    default:
      return null;
  }
}

/**
 * Journal Input Component
 * Full-featured text area with journal store integration
 */
function JournalInput({
  config,
  moduleTitle,
  value: controlledValue,
  onChange: controlledOnChange,
  onSave,
}) {
  // Local state if not controlled
  const [localContent, setLocalContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  // Use controlled or local state
  const content = controlledValue !== undefined ? controlledValue : localContent;
  const setContent = controlledOnChange || setLocalContent;

  // Journal store
  const addEntry = useJournalStore((state) => state.addEntry);
  const settings = useJournalStore((state) => state.settings);

  // Session info for journal entry
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;

  // Style classes from journal settings
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

  // Save to journal store
  const saveEntry = useCallback(() => {
    if (config.saveToJournal && content.trim()) {
      addEntry({
        content: content.trim(),
        source: 'session',
        sessionId,
        moduleTitle,
      });
    }
    if (onSave) {
      onSave(content);
    }
  }, [config.saveToJournal, content, addEntry, sessionId, moduleTitle, onSave]);

  // Expose save function via ref or callback
  // This allows parent components to trigger save on complete/skip

  const { placeholder = "What's on your mind?" } = config;

  return (
    <div className="flex-1 min-h-0">
      <div
        className="relative h-full border border-[var(--color-border)] rounded-lg overflow-hidden"
        style={{ minHeight: '200px' }}
      >
        {/* Placeholder */}
        {!content && !isFocused && (
          <div
            className="absolute top-4 left-4 text-[var(--color-text-tertiary)] pointer-events-none"
            style={{ textTransform: 'none' }}
          >
            <span className={`${getFontSizeClass()} ${getFontFamilyClass()}`}>
              {placeholder}
            </span>
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            // Auto-save on blur if configured
            if (config.autoSave) {
              saveEntry();
            }
          }}
          className={`w-full h-full p-4 bg-transparent resize-none outline-none
            text-[var(--color-text-primary)]
            ${getFontSizeClass()} ${getFontFamilyClass()} ${getLineHeightClass()}`}
          style={{ textTransform: 'none', minHeight: '200px' }}
          placeholder=""
        />
      </div>
    </div>
  );
}

/**
 * Check-in Input Component (Future)
 * For collecting user state/response during sessions
 */
function CheckinInput({ config }) {
  const [selectedOption, setSelectedOption] = useState(null);

  const options = config.options || [
    { value: 'calm', label: 'Feeling calm' },
    { value: 'anxious', label: 'Feeling anxious' },
    { value: 'energetic', label: 'Feeling energetic' },
    { value: 'tired', label: 'Feeling tired' },
  ];

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setSelectedOption(option.value)}
          className={`w-full py-3 px-4 border text-left transition-colors duration-200
            ${selectedOption === option.value
              ? 'border-[var(--color-text-primary)] bg-[var(--color-bg-secondary)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)]'
            }`}
        >
          <span className="text-[var(--color-text-primary)] text-sm">
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * Hook for managing journal content with save functionality
 */
export function useJournalContent({ moduleTitle, saveToJournal = true }) {
  const [content, setContent] = useState('');

  const addEntry = useJournalStore((state) => state.addEntry);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;

  const save = useCallback(() => {
    if (saveToJournal && content.trim()) {
      addEntry({
        content: content.trim(),
        source: 'session',
        sessionId,
        moduleTitle,
      });
    }
  }, [saveToJournal, content, addEntry, sessionId, moduleTitle]);

  const hasContent = content.trim().length > 0;

  return {
    content,
    setContent,
    save,
    hasContent,
  };
}

/**
 * Standalone textarea for simpler use cases
 */
export function SimpleTextarea({
  value,
  onChange,
  placeholder = '',
  className = '',
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full h-full p-4 bg-transparent resize-none outline-none
        text-[var(--color-text-primary)] border border-[var(--color-border)]
        rounded-lg ${className}`}
      style={{ textTransform: 'none', minHeight: '150px' }}
    />
  );
}
