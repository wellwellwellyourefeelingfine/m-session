/**
 * ChatInput Component
 * Message input with auto-resize textarea and send button
 */

import { useRef, useEffect } from 'react';
import { useAIStore } from '../../stores/useAIStore';

export default function ChatInput({ onSend, onStop, disabled = false, placeholder = 'Type your message...' }) {
  // Use draftInput from store so it persists when modal closes
  const value = useAIStore((state) => state.draftInput);
  const setDraftInput = useAIStore((state) => state.setDraftInput);
  const clearDraftInput = useAIStore((state) => state.clearDraftInput);
  const isGenerating = useAIStore((state) => state.isGenerating);

  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120); // Max 120px (about 5 lines)
      textarea.style.height = `${newHeight}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;

    onSend(value.trim());
    clearDraftInput();

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-shrink-0 border-t border-[var(--border)] p-4 bg-[var(--bg-primary)]">
      <div className="flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setDraftInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="
            flex-1 resize-none py-2 px-3
            bg-[var(--bg-secondary)]
            text-[11px] leading-relaxed
            placeholder:text-[var(--text-tertiary)]
            focus:outline-none focus:ring-1 focus:ring-[var(--accent)]
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          style={{ minHeight: '36px', maxHeight: '120px' }}
        />
        {isGenerating && onStop ? (
          <button
            onClick={onStop}
            className="
              px-4 py-2 h-9
              bg-[var(--accent)] text-[var(--bg-primary)]
              text-[10px] uppercase tracking-wider
              hover:opacity-70 transition-opacity
            "
            aria-label="Stop generating"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            className="
              px-4 py-2 h-9
              bg-app-black dark:bg-app-white
              text-app-white dark:text-app-black
              text-[10px] uppercase tracking-wider
              hover:opacity-70 transition-opacity
              disabled:opacity-30 disabled:cursor-not-allowed
            "
            aria-label="Send message"
          >
            Send
          </button>
        )}
      </div>
      <p className="mt-2 text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">
        Enter to send • Shift+Enter for new line
      </p>
    </div>
  );
}
