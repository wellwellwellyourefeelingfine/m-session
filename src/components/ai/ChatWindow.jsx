/**
 * ChatWindow Component
 * Scrollable message list with auto-scroll and streaming support
 */

import { useRef, useEffect } from 'react';
import { useAIStore } from '../../stores/useAIStore';
import ChatMessage, { TypingIndicator, ErrorMessage } from './ChatMessage';

export default function ChatWindow({ onRetry }) {
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Store state
  const conversations = useAIStore((state) => state.conversations);
  const activeConversationId = useAIStore((state) => state.activeConversationId);
  const isGenerating = useAIStore((state) => state.isGenerating);
  const streamBuffer = useAIStore((state) => state.streamBuffer);
  const currentError = useAIStore((state) => state.currentError);

  // Store actions
  const clearError = useAIStore((state) => state.clearError);

  // Get active conversation
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  // Auto-scroll to bottom when new messages arrive or during streaming
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamBuffer, isGenerating]);

  // Empty state
  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
            No conversation selected
          </p>
          <p className="text-[10px] text-[var(--text-tertiary)]">
            Start a new chat to begin
          </p>
        </div>
      </div>
    );
  }

  // New conversation empty state
  if (messages.length === 0 && !isGenerating) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-[12px] uppercase tracking-wider text-[var(--text-secondary)] mb-4">
            AI Assistant
          </p>
          <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
            I&apos;m here to support you during your session. Feel free to ask questions, share how you&apos;re feeling, or just chat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4"
    >
      {/* Messages */}
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {/* Streaming message */}
      {isGenerating && streamBuffer && (
        <ChatMessage
          message={{
            id: 'streaming',
            role: 'assistant',
            content: streamBuffer,
            timestamp: Date.now(),
          }}
          isStreaming={true}
        />
      )}

      {/* Typing indicator (before any content has streamed) */}
      {isGenerating && !streamBuffer && (
        <TypingIndicator />
      )}

      {/* Error message */}
      {currentError && (
        <ErrorMessage
          error={currentError}
          onRetry={() => {
            clearError();
            if (onRetry) onRetry();
          }}
          onDismiss={clearError}
        />
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
