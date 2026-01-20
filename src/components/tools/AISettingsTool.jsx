/**
 * AISettingsTool Component
 * API key configuration and AI assistant settings
 */

import { useState, useEffect } from 'react';
import { useAIStore } from '../../stores/useAIStore';
import { AIService, getAvailableModels, getProviderInfo } from '../../services/aiService';

const EXPIRATION_OPTIONS = [
  { value: 12, label: '12 HOURS' },
  { value: 24, label: '24 HOURS' },
  { value: 48, label: '48 HOURS' },
  { value: 168, label: '1 WEEK' },
  { value: 0, label: 'NEVER' },
];

export default function AISettingsTool() {
  // Store state
  const provider = useAIStore((state) => state.provider);
  const isKeyValid = useAIStore((state) => state.isKeyValid);
  const isValidating = useAIStore((state) => state.isValidating);
  const validationError = useAIStore((state) => state.validationError);
  const settings = useAIStore((state) => state.settings);
  const hasShownSecurityNotice = useAIStore((state) => state.hasShownSecurityNotice);
  const conversations = useAIStore((state) => state.conversations);

  // Store actions
  const setApiKey = useAIStore((state) => state.setApiKey);
  const clearApiKey = useAIStore((state) => state.clearApiKey);
  const setValidating = useAIStore((state) => state.setValidating);
  const setKeyValid = useAIStore((state) => state.setKeyValid);
  const updateSettings = useAIStore((state) => state.updateSettings);
  const markSecurityNoticeShown = useAIStore((state) => state.markSecurityNoticeShown);
  const clearAllConversations = useAIStore((state) => state.clearAllConversations);
  const getDecryptedKey = useAIStore((state) => state.getDecryptedKey);
  const getKeyExpirationRemaining = useAIStore((state) => state.getKeyExpirationRemaining);

  // Local state
  const [selectedProvider, setSelectedProvider] = useState(provider || 'anthropic');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showSecurityNotice, setShowSecurityNotice] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRemoveKeyConfirm, setShowRemoveKeyConfirm] = useState(false);

  // Show security notice on first use
  useEffect(() => {
    if (!hasShownSecurityNotice && !isKeyValid) {
      setShowSecurityNotice(true);
    }
  }, [hasShownSecurityNotice, isKeyValid]);

  // Handle provider change
  const handleProviderChange = (newProvider) => {
    setSelectedProvider(newProvider);
    if (isKeyValid) {
      // If switching providers, clear existing key
      clearApiKey();
      setApiKeyInput('');
    }
  };

  // Handle API key validation
  const handleValidateKey = async () => {
    if (!apiKeyInput.trim()) return;

    setValidating(true);

    // First, save the key
    const saved = await setApiKey(selectedProvider, apiKeyInput.trim());
    if (!saved) {
      setKeyValid(false, 'Failed to save API key');
      return;
    }

    // Check for dummy test key - bypass validation
    if (apiKeyInput.trim() === 'dummy-test-key') {
      setKeyValid(true);
      setApiKeyInput('');
      if (!hasShownSecurityNotice) {
        markSecurityNoticeShown();
      }
      return;
    }

    // Then validate with the API
    const decryptedKey = await getDecryptedKey();
    const service = new AIService(selectedProvider, decryptedKey);
    const result = await service.validateKey();

    setKeyValid(result.valid, result.error);

    if (result.valid) {
      setApiKeyInput(''); // Clear input on success
      if (!hasShownSecurityNotice) {
        markSecurityNoticeShown();
      }
    }
  };

  // Handle security notice dismiss
  const handleDismissSecurityNotice = () => {
    setShowSecurityNotice(false);
    markSecurityNoticeShown();
  };

  // Mask API key for display
  const getMaskedKey = () => {
    if (!isKeyValid) return '';
    return '••••••••••••••••••••';
  };

  const availableModels = getAvailableModels(selectedProvider);

  return (
    <div className="py-6 px-6 max-w-xl mx-auto">
      {/* Security Notice Modal */}
      {showSecurityNotice && (
        <div className="mb-6 p-4 border border-[var(--accent)] bg-[var(--accent-bg)]">
          <p className="text-[11px] leading-relaxed mb-4">
            Your API key is encrypted and stored locally on this device. It will
            automatically expire after your chosen time period. We recommend setting a
            spending limit on your API key through your provider&apos;s dashboard.
          </p>
          <button
            onClick={handleDismissSecurityNotice}
            className="text-[11px] uppercase tracking-wider hover:opacity-70 transition-opacity underline"
          >
            I understand
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Provider Selection */}
        <div className="py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="block text-[11px] uppercase tracking-wider mb-3 text-[var(--text-secondary)]">
            Provider
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleProviderChange('anthropic')}
              className={`flex-1 min-w-[80px] py-2 px-3 text-[10px] uppercase tracking-wider border transition-colors ${
                selectedProvider === 'anthropic'
                  ? 'border-app-black dark:border-app-white bg-app-black dark:bg-app-white text-app-white dark:text-app-black'
                  : 'border-app-gray-300 dark:border-app-gray-700 hover:opacity-70'
              }`}
            >
              Anthropic
            </button>
            <button
              onClick={() => handleProviderChange('openai')}
              className={`flex-1 min-w-[80px] py-2 px-3 text-[10px] uppercase tracking-wider border transition-colors ${
                selectedProvider === 'openai'
                  ? 'border-app-black dark:border-app-white bg-app-black dark:bg-app-white text-app-white dark:text-app-black'
                  : 'border-app-gray-300 dark:border-app-gray-700 hover:opacity-70'
              }`}
            >
              OpenAI
            </button>
            <button
              onClick={() => handleProviderChange('openrouter')}
              className={`flex-1 min-w-[80px] py-2 px-3 text-[10px] uppercase tracking-wider border transition-colors ${
                selectedProvider === 'openrouter'
                  ? 'border-app-black dark:border-app-white bg-app-black dark:bg-app-white text-app-white dark:text-app-black'
                  : 'border-app-gray-300 dark:border-app-gray-700 hover:opacity-70'
              }`}
            >
              OpenRouter
            </button>
          </div>
          {/* Provider description */}
          <p className="mt-2 text-[9px] text-[var(--text-tertiary)]">
            {getProviderInfo(selectedProvider).description}
          </p>
        </div>

        {/* API Key Input */}
        <div className="py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="block text-[11px] uppercase tracking-wider mb-3 text-[var(--text-secondary)]">
            API Key
          </span>

          {isKeyValid ? (
            // Key is validated - show masked version
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 py-2 px-3 border border-app-gray-300 dark:border-app-gray-700 text-[11px] tracking-wider text-[var(--text-tertiary)]">
                  {getMaskedKey()}
                </div>
              </div>
              <p className="text-[10px] text-[var(--accent)]">
                Key validated • Expires in {getKeyExpirationRemaining()}
              </p>
            </div>
          ) : (
            // Key not validated - show input
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={getProviderInfo(selectedProvider).keyPlaceholder}
                  className="flex-1 py-2 px-3 border border-app-gray-300 dark:border-app-gray-700 bg-transparent text-[11px] tracking-wider focus:outline-none focus:border-app-black dark:focus:border-app-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleValidateKey();
                  }}
                />
                <button
                  onClick={handleValidateKey}
                  disabled={!apiKeyInput.trim() || isValidating}
                  className="py-2 px-4 text-[11px] uppercase tracking-wider border border-app-black dark:border-app-white bg-app-black dark:bg-app-white text-app-white dark:text-app-black hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidating ? '...' : 'Validate'}
                </button>
              </div>
              {validationError && (
                <p className="text-[10px] text-[var(--accent)]">{validationError}</p>
              )}
            </div>
          )}
        </div>

        {/* Settings Section - only show when key is valid */}
        {isKeyValid && (
          <>
            <div className="py-3 border-b border-app-gray-200 dark:border-app-gray-800">
              <span className="block text-[11px] uppercase tracking-wider mb-4 text-[var(--text-secondary)]">
                Settings
              </span>

              {/* Save Conversations */}
              <div className="flex items-center justify-between py-2">
                <span className="text-[11px] uppercase tracking-wider">
                  Save Conversations
                </span>
                <button
                  onClick={() =>
                    updateSettings({
                      persistConversations: !settings.persistConversations,
                    })
                  }
                  className="text-[11px] uppercase tracking-wider hover:opacity-70 transition-opacity"
                >
                  {settings.persistConversations ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Key Expiration */}
              <div className="flex items-center justify-between py-2">
                <span className="text-[11px] uppercase tracking-wider">
                  Key Expiration
                </span>
                <select
                  value={settings.keyExpirationHours}
                  onChange={(e) =>
                    updateSettings({ keyExpirationHours: Number(e.target.value) })
                  }
                  className="py-1 px-2 text-[11px] uppercase tracking-wider bg-transparent border border-app-gray-300 dark:border-app-gray-700 focus:outline-none cursor-pointer"
                >
                  {EXPIRATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Selection */}
              <div className="flex items-center justify-between py-2">
                <span className="text-[11px] uppercase tracking-wider">Model</span>
                <select
                  value={settings.modelPreference}
                  onChange={(e) => updateSettings({ modelPreference: e.target.value })}
                  className="py-1 px-2 text-[11px] uppercase tracking-wider bg-transparent border border-app-gray-300 dark:border-app-gray-700 focus:outline-none cursor-pointer max-w-[180px]"
                >
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="py-3 space-y-3">
              {/* Clear Conversations */}
              {conversations.length > 0 && (
                <div>
                  {showClearConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                        Clear {conversations.length} conversation
                        {conversations.length > 1 ? 's' : ''}?
                      </span>
                      <button
                        onClick={() => {
                          clearAllConversations();
                          setShowClearConfirm(false);
                        }}
                        className="text-[10px] uppercase tracking-wider text-[var(--accent)] hover:opacity-70"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="text-[10px] uppercase tracking-wider hover:opacity-70"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="text-[11px] uppercase tracking-wider hover:opacity-70 transition-opacity text-[var(--text-secondary)]"
                    >
                      Clear All Conversations
                    </button>
                  )}
                </div>
              )}

              {/* Remove API Key */}
              <div>
                {showRemoveKeyConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                      Remove API key?
                    </span>
                    <button
                      onClick={() => {
                        clearApiKey();
                        setShowRemoveKeyConfirm(false);
                      }}
                      className="text-[10px] uppercase tracking-wider text-[var(--accent)] hover:opacity-70"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setShowRemoveKeyConfirm(false)}
                      className="text-[10px] uppercase tracking-wider hover:opacity-70"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRemoveKeyConfirm(true)}
                    className="text-[11px] uppercase tracking-wider hover:opacity-70 transition-opacity text-[var(--text-secondary)]"
                  >
                    Remove API Key
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
