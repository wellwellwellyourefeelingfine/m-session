/**
 * ChatMessage Component
 * Individual message bubble for user and assistant messages
 */

import { useState } from 'react';

/**
 * Simple markdown-like formatting for assistant messages
 * Supports: **bold**, *italic*, `code`, line breaks
 * Uses React elements instead of dangerouslySetInnerHTML to prevent XSS.
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

    // Parse inline formatting into React elements
    return <span key={index}>{parseInlineFormatting(part)}</span>;
  });
}

/**
 * Parse bold, italic, and line breaks into React elements.
 * Pattern: split on **bold** and *italic* markers, nest as needed.
 */
function parseInlineFormatting(text) {
  // Split on bold markers first: **text**
  const boldParts = text.split(/\*\*([^*]+)\*\*/g);
  const elements = [];

  boldParts.forEach((segment, i) => {
    if (i % 2 === 1) {
      // Odd indices are bold content
      elements.push(<strong key={`b${i}`}>{parseItalicsAndBreaks(segment)}</strong>);
    } else if (segment) {
      // Even indices are plain text — parse for italics
      elements.push(...parseItalicsAndBreaks(segment, `p${i}`));
    }
  });

  return elements;
}

/**
 * Parse *italic* markers and \n line breaks into React elements.
 * Returns an array of elements/strings.
 */
function parseItalicsAndBreaks(text, keyPrefix = '') {
  const italicParts = text.split(/\*([^*]+)\*/g);
  const elements = [];

  italicParts.forEach((segment, i) => {
    if (i % 2 === 1) {
      // Odd indices are italic content
      elements.push(<em key={`${keyPrefix}i${i}`}>{insertLineBreaks(segment, `${keyPrefix}i${i}`)}</em>);
    } else if (segment) {
      elements.push(...insertLineBreaks(segment, `${keyPrefix}t${i}`));
    }
  });

  return elements;
}

/**
 * Replace \n with <br/> elements. Returns an array of strings and <br/> elements.
 */
function insertLineBreaks(text, keyPrefix = '') {
  const lines = text.split('\n');
  if (lines.length === 1) return [text];

  const result = [];
  lines.forEach((line, i) => {
    if (i > 0) result.push(<br key={`${keyPrefix}br${i}`} />);
    if (line) result.push(line);
  });
  return result;
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
