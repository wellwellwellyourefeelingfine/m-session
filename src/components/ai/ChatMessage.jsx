/**
 * ChatMessage Component
 * Individual message bubble for user and assistant messages
 */

import { useState } from 'react';

/**
 * Simple markdown-like formatting for assistant messages
 * Supports: **bold**, *italic*, `code`, - lists
 */
function formatContent(content) {
  if (!content) return null;

  // Split by code blocks first
  const parts = content.split(/(`[^`]+`)/g);

  return parts.map((part, index) => {
    // Code spans
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="px-1 py-0.5 bg-[var(--bg-tertiary)] text-[10px] font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Process other formatting
    let formatted = part;

    // Bold
    formatted = formatted.replace(
      /\*\*([^*]+)\*\*/g,
      '<strong>$1</strong>'
    );

    // Italic
    formatted = formatted.replace(
      /\*([^*]+)\*/g,
      '<em>$1</em>'
    );

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br/>');

    return (
      <span
        key={index}
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  });
}

/**
 * Format timestamp for display
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatMessage({ message, isStreaming = false }) {
  const [showTimestamp, setShowTimestamp] = useState(false);

  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
      onClick={() => setShowTimestamp(!showTimestamp)}
    >
      <div
        className={`
          max-w-[85%] md:max-w-[75%] px-4 py-3
          ${isUser
            ? 'bg-[var(--accent)] text-[var(--bg-primary)]'
            : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
          }
        `}
      >
        {/* Message content */}
        <div className="text-[11px] leading-relaxed whitespace-pre-wrap break-words">
          {isUser ? message.content : formatContent(message.content)}
          {isStreaming && (
            <span className="inline-block w-1 h-3 ml-0.5 bg-current animate-pulse" />
          )}
        </div>

        {/* Timestamp (shown on click/tap) */}
        {showTimestamp && message.timestamp && (
          <div
            className={`
              mt-2 text-[9px] uppercase tracking-wider
              ${isUser ? 'text-[var(--bg-primary)]/70' : 'text-[var(--text-tertiary)]'}
            `}
          >
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Typing indicator component
 */
export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="px-4 py-3 bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-typing-dot" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-typing-dot-delayed-1" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-typing-dot-delayed-2" />
        </div>
      </div>
    </div>
  );
}

/**
 * Error message component
 */
export function ErrorMessage({ error, onRetry, onDismiss }) {
  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[85%] md:max-w-[75%] px-4 py-3 bg-[var(--accent-bg)] border border-[var(--accent)]">
        <p className="text-[11px] text-[var(--text-primary)] mb-2">
          {error || 'Something went wrong. Please try again.'}
        </p>
        <div className="flex gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-[10px] uppercase tracking-wider text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] hover:opacity-70 transition-opacity"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
