/**
 * AI Assistant Store
 * Manages API configuration, conversations, and chat state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { encryptApiKey, decryptApiKey, hasEncryptedKey } from '../services/cryptoService';

// Helper to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

// Helper to generate conversation title from first message
const generateTitle = (content) => {
  const maxLength = 30;
  const cleaned = content.trim().replace(/\n/g, ' ');
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength) + '...';
};

export const useAIStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // API CONFIGURATION
      // ============================================
      provider: null, // 'anthropic' | 'openai'
      encryptedApiKey: null, // { iv: string, ciphertext: string }
      apiKeySavedAt: null, // Timestamp for expiration tracking
      isKeyValid: false,
      isValidating: false,
      validationError: null,

      // ============================================
      // SETTINGS
      // ============================================
      settings: {
        persistConversations: true,
        keyExpirationHours: 24, // 12, 24, 48, 168 (week), 0 (never)
        modelPreference: 'default', // 'default' | specific model names
      },

      // ============================================
      // UI STATE
      // ============================================
      isModalOpen: false,
      hasShownSecurityNotice: false, // Track if we've shown the first-time notice

      // ============================================
      // CONVERSATIONS
      // ============================================
      conversations: [],
      activeConversationId: null,

      // ============================================
      // STREAMING STATE
      // ============================================
      isGenerating: false,
      streamBuffer: '',
      currentError: null,
      lastFailedMessage: null, // For retry functionality
      abortController: null, // For canceling streaming

      // ============================================
      // INPUT STATE (persists when modal closes)
      // ============================================
      draftInput: '', // Current unsent message text

      // ============================================
      // API KEY ACTIONS
      // ============================================

      /**
       * Set and encrypt a new API key
       */
      setApiKey: async (provider, plainKey) => {
        try {
          const encrypted = await encryptApiKey(plainKey);
          set({
            provider,
            encryptedApiKey: encrypted,
            apiKeySavedAt: Date.now(),
            isKeyValid: false, // Will be set true after validation
            validationError: null,
          });
          return true;
        } catch (error) {
          console.error('Failed to encrypt API key:', error);
          set({ validationError: 'Failed to encrypt API key' });
          return false;
        }
      },

      /**
       * Get the decrypted API key (for API calls)
       */
      getDecryptedKey: async () => {
        const { encryptedApiKey } = get();
        if (!hasEncryptedKey(encryptedApiKey)) {
          return null;
        }
        try {
          return await decryptApiKey(encryptedApiKey);
        } catch (error) {
          console.error('Failed to decrypt API key:', error);
          return null;
        }
      },

      /**
       * Clear the API key and related state
       */
      clearApiKey: () => {
        set({
          provider: null,
          encryptedApiKey: null,
          apiKeySavedAt: null,
          isKeyValid: false,
          isValidating: false,
          validationError: null,
        });
      },

      /**
       * Check if the API key has expired based on settings
       * @returns {boolean} true if expired
       */
      checkKeyExpiration: () => {
        const { apiKeySavedAt, settings, encryptedApiKey } = get();

        if (!hasEncryptedKey(encryptedApiKey) || !apiKeySavedAt) {
          return false;
        }

        // 0 means never expire
        if (settings.keyExpirationHours === 0) {
          return false;
        }

        const hoursSinceSaved = (Date.now() - apiKeySavedAt) / (1000 * 60 * 60);
        return hoursSinceSaved >= settings.keyExpirationHours;
      },

      /**
       * Get remaining time until key expires
       * @returns {string} Human-readable time remaining
       */
      getKeyExpirationRemaining: () => {
        const { apiKeySavedAt, settings } = get();

        if (!apiKeySavedAt || settings.keyExpirationHours === 0) {
          return 'Never';
        }

        const expiresAt = apiKeySavedAt + settings.keyExpirationHours * 60 * 60 * 1000;
        const remaining = expiresAt - Date.now();

        if (remaining <= 0) return 'Expired';

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
          return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
      },

      /**
       * Set validation state
       */
      setValidating: (isValidating) => set({ isValidating }),

      /**
       * Mark key as valid after successful validation
       */
      setKeyValid: (isValid, error = null) =>
        set({
          isKeyValid: isValid,
          validationError: error,
          isValidating: false,
        }),

      // ============================================
      // SETTINGS ACTIONS
      // ============================================

      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      markSecurityNoticeShown: () => set({ hasShownSecurityNotice: true }),

      // ============================================
      // MODAL ACTIONS
      // ============================================

      openModal: () => set({ isModalOpen: true }),
      closeModal: () => set({ isModalOpen: false }),
      toggleModal: () => set((state) => ({ isModalOpen: !state.isModalOpen })),

      // ============================================
      // CONVERSATION ACTIONS
      // ============================================

      /**
       * Create a new conversation
       */
      createConversation: () => {
        const newConversation = {
          id: generateId(),
          title: 'New Chat',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: newConversation.id,
        }));

        return newConversation.id;
      },

      /**
       * Delete a conversation
       */
      deleteConversation: (id) => {
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id);
          const newActiveId =
            state.activeConversationId === id
              ? filtered[0]?.id || null
              : state.activeConversationId;

          return {
            conversations: filtered,
            activeConversationId: newActiveId,
          };
        });
      },

      /**
       * Set the active conversation
       */
      setActiveConversation: (id) => set({ activeConversationId: id }),

      /**
       * Get the active conversation object
       */
      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId) || null;
      },

      /**
       * Clear all conversations
       */
      clearAllConversations: () =>
        set({
          conversations: [],
          activeConversationId: null,
        }),

      // ============================================
      // MESSAGE ACTIONS
      // ============================================

      /**
       * Add a message to the active conversation
       */
      addMessage: (role, content) => {
        const { activeConversationId, conversations } = get();

        if (!activeConversationId) {
          // Create a new conversation if none exists
          const newId = get().createConversation();
          // Recursively add the message to the new conversation
          get().addMessage(role, content);
          return;
        }

        const message = {
          id: generateId(),
          role, // 'user' | 'assistant'
          content,
          timestamp: Date.now(),
        };

        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id !== activeConversationId) return conv;

            const updatedMessages = [...conv.messages, message];

            // Update title from first user message
            const newTitle =
              conv.messages.length === 0 && role === 'user'
                ? generateTitle(content)
                : conv.title;

            return {
              ...conv,
              messages: updatedMessages,
              title: newTitle,
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      // ============================================
      // STREAMING ACTIONS
      // ============================================

      /**
       * Start generating a response
       */
      startGenerating: (abortController = null) =>
        set({
          isGenerating: true,
          streamBuffer: '',
          currentError: null,
          abortController,
        }),

      /**
       * Append chunk to stream buffer
       */
      appendToStream: (chunk) =>
        set((state) => ({
          streamBuffer: state.streamBuffer + chunk,
        })),

      /**
       * Finalize the stream and add to conversation
       */
      finalizeStream: () => {
        const { streamBuffer } = get();

        if (streamBuffer) {
          get().addMessage('assistant', streamBuffer);
        }

        set({
          isGenerating: false,
          streamBuffer: '',
          lastFailedMessage: null, // Clear on success
          abortController: null,
        });
      },

      /**
       * Handle streaming error
       */
      setStreamError: (error, failedMessage = null) =>
        set({
          isGenerating: false,
          streamBuffer: '',
          currentError: error,
          lastFailedMessage: failedMessage,
          abortController: null,
        }),

      /**
       * Cancel the current streaming request
       */
      cancelStreaming: () => {
        const { abortController, streamBuffer } = get();

        if (abortController) {
          abortController.abort();
        }

        // If we have partial content, save it
        if (streamBuffer) {
          get().addMessage('assistant', streamBuffer + '\n\n[Response stopped]');
        }

        set({
          isGenerating: false,
          streamBuffer: '',
          abortController: null,
          currentError: null,
        });
      },

      /**
       * Clear current error
       */
      clearError: () => set({ currentError: null, lastFailedMessage: null }),

      /**
       * Get the last failed message for retry
       */
      getLastFailedMessage: () => get().lastFailedMessage,

      // ============================================
      // INPUT STATE ACTIONS
      // ============================================

      /**
       * Update draft input (persists when modal closes)
       */
      setDraftInput: (text) => set({ draftInput: text }),

      /**
       * Clear draft input (after sending)
       */
      clearDraftInput: () => set({ draftInput: '' }),

      // ============================================
      // UTILITY
      // ============================================

      /**
       * Check if AI is configured and ready
       */
      isConfigured: () => {
        const { encryptedApiKey, isKeyValid } = get();
        return hasEncryptedKey(encryptedApiKey) && isKeyValid;
      },

      /**
       * Reset the entire store
       */
      resetStore: () => {
        set({
          provider: null,
          encryptedApiKey: null,
          apiKeySavedAt: null,
          isKeyValid: false,
          isValidating: false,
          validationError: null,
          settings: {
            persistConversations: true,
            keyExpirationHours: 24,
            modelPreference: 'default',
          },
          isModalOpen: false,
          hasShownSecurityNotice: false,
          conversations: [],
          activeConversationId: null,
          isGenerating: false,
          streamBuffer: '',
          currentError: null,
        });
      },
    }),
    {
      name: 'mdma-guide-ai-state',
      version: 1,
      partialize: (state) => ({
        // Persist these fields
        provider: state.provider,
        encryptedApiKey: state.encryptedApiKey,
        apiKeySavedAt: state.apiKeySavedAt,
        isKeyValid: state.isKeyValid,
        settings: state.settings,
        hasShownSecurityNotice: state.hasShownSecurityNotice,
        // Only persist conversations if setting is enabled
        conversations: state.settings.persistConversations ? state.conversations : [],
        activeConversationId: state.settings.persistConversations
          ? state.activeConversationId
          : null,
        // Always persist draft input so it survives modal close
        draftInput: state.draftInput,
      }),
      migrate: (persistedState, version) => {
        if (version < 1) {
          return undefined; // Reset on version mismatch
        }
        return persistedState;
      },
    }
  )
);
