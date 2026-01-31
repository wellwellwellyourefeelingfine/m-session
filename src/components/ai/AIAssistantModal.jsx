/**
 * AIAssistantModal Component
 * Main slide-down modal container for the AI assistant
 * Includes sidebar, chat window, and input
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAIStore } from '../../stores/useAIStore';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { AIService } from '../../services/aiService';
import { buildSystemPrompt, buildMinimalSystemPrompt } from '../../utils/buildSystemPrompt';
import { DesktopSidebar, MobileSidebar, MobileMenuButton } from './ChatSidebar';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import AISettingsPanel from './AISettingsPanel';

export default function AIAssistantModal({ onClose, isClosing = false }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);

  // AI Store
  const provider = useAIStore((state) => state.provider);
  const settings = useAIStore((state) => state.settings);
  const isGenerating = useAIStore((state) => state.isGenerating);
  const activeConversationId = useAIStore((state) => state.activeConversationId);
  const conversations = useAIStore((state) => state.conversations);

  const getDecryptedKey = useAIStore((state) => state.getDecryptedKey);
  const createConversation = useAIStore((state) => state.createConversation);
  const addMessage = useAIStore((state) => state.addMessage);
  const startGenerating = useAIStore((state) => state.startGenerating);
  const appendToStream = useAIStore((state) => state.appendToStream);
  const finalizeStream = useAIStore((state) => state.finalizeStream);
  const setStreamError = useAIStore((state) => state.setStreamError);
  const cancelStreaming = useAIStore((state) => state.cancelStreaming);
  const checkKeyExpiration = useAIStore((state) => state.checkKeyExpiration);
  const clearApiKey = useAIStore((state) => state.clearApiKey);

  // Check for key expiration on mount
  useEffect(() => {
    if (checkKeyExpiration()) {
      clearApiKey();
      onClose();
    }
  }, [checkKeyExpiration, clearApiKey, onClose]);

  // Handle escape key - use ref to avoid stale closure
  const handleCloseRef = useRef(null);
  const settingsPanelOpenRef = useRef(settingsPanelOpen);

  // Keep settings panel ref updated
  useEffect(() => {
    settingsPanelOpenRef.current = settingsPanelOpen;
  }, [settingsPanelOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        // If settings panel is open, close it first
        if (settingsPanelOpenRef.current) {
          setSettingsPanelOpen(false);
          return;
        }
        // Otherwise close the main modal
        if (handleCloseRef.current) {
          handleCloseRef.current();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle close - notify parent to start close animation
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // When isClosing becomes true, wait for animation then call onClose to complete
  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        onClose();
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  // Keep ref updated for ESC handler
  useEffect(() => {
    handleCloseRef.current = handleClose;
  }, [handleClose]);

  // Get current conversation messages
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  // Send message handler
  const handleSendMessage = useCallback(async (content, isRetry = false) => {
    // Ensure we have an active conversation
    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = createConversation();
    }

    // Add user message (unless retrying - message already exists)
    if (!isRetry) {
      addMessage('user', content);
    }

    // Create abort controller for cancellation
    const abortController = new AbortController();

    // Start generating
    startGenerating(abortController);

    try {
      // Get decrypted key
      const apiKey = await getDecryptedKey();
      if (!apiKey) {
        throw new Error('Failed to decrypt API key');
      }

      // Check for dummy key (for UI testing)
      if (apiKey === 'dummy-test-key') {
        // Simulate streaming response
        const dummyResponse = 'Hello world! This is a test response from the dummy API key. You can use this to test the UI without a real API key.';
        for (const char of dummyResponse) {
          if (abortController.signal.aborted) break;
          await new Promise(resolve => setTimeout(resolve, 30));
          appendToStream(char);
        }
        finalizeStream();
        return;
      }

      // Build system prompt with current session context
      const sessionState = useSessionStore.getState();
      const journalState = useJournalStore.getState();
      const currentSettings = useAIStore.getState().settings;

      const isInActiveSession = sessionState.sessionPhase === 'active';
      const systemPrompt = isInActiveSession
        ? buildSystemPrompt(sessionState, journalState, currentSettings.contextSettings)
        : buildMinimalSystemPrompt();

      // Create AI service and stream response
      const service = new AIService(provider, apiKey);

      // Get updated messages (including the one we just added)
      const currentConversation = useAIStore.getState().conversations.find(
        (c) => c.id === conversationId
      );
      const currentMessages = currentConversation?.messages || [];

      // Stream the response
      for await (const chunk of service.streamMessage(
        currentMessages,
        systemPrompt,
        settings.modelPreference,
        abortController.signal
      )) {
        if (abortController.signal.aborted) break;
        appendToStream(chunk);
      }

      // Finalize
      if (!abortController.signal.aborted) {
        finalizeStream();
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled - already handled in cancelStreaming
        return;
      }
      console.error('AI request failed:', error);
      setStreamError(error.message || 'Failed to get response', content);
    }
  }, [
    activeConversationId,
    createConversation,
    addMessage,
    startGenerating,
    getDecryptedKey,
    provider,
    settings.modelPreference,
    appendToStream,
    finalizeStream,
    setStreamError,
  ]);

  // Retry handler
  const handleRetry = useCallback(() => {
    const lastMessage = useAIStore.getState().lastFailedMessage;
    if (lastMessage) {
      handleSendMessage(lastMessage, true);
    }
  }, [handleSendMessage]);

  return (
    <div
      className={`
        fixed inset-0 z-[75]
        bg-[var(--bg-primary)]
        ${isClosing ? 'animate-slideOutToRightFull' : 'animate-slideInFromRightFull'}
      `}
      style={{ top: 'var(--header-height)' }}
      role="dialog"
      aria-modal="true"
      aria-label="AI Assistant"
    >
      <div className="h-full flex flex-col">
        {/* Top bar with minimize button and mobile menu */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          {/* Mobile menu button */}
          <MobileMenuButton onClick={() => setMobileSidebarOpen(true)} />

          {/* Title (mobile only) */}
          <span className="md:hidden text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            AI Assistant
          </span>

          {/* Desktop spacer */}
          <div className="hidden md:block" />

          {/* Close button - arrow pointing right */}
          <button
            onClick={handleClose}
            className="
              w-8 h-8 flex items-center justify-center
              hover:opacity-70 transition-opacity
            "
            aria-label="Close AI Assistant"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M6 3L11 8L6 13" />
            </svg>
          </button>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop sidebar with collapse toggle */}
          <DesktopSidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onOpenSettings={() => setSettingsPanelOpen(true)}
          />

          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            <ChatWindow onRetry={handleRetry} />
            <ChatInput
              onSend={handleSendMessage}
              onStop={cancelStreaming}
              disabled={isGenerating}
              placeholder={
                messages.length === 0
                  ? 'How are you feeling?'
                  : 'Type your message...'
              }
            />
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onOpenSettings={() => setSettingsPanelOpen(true)}
      />

      {/* AI Settings Panel */}
      <AISettingsPanel
        isOpen={settingsPanelOpen}
        onClose={() => setSettingsPanelOpen(false)}
      />
    </div>
  );
}
