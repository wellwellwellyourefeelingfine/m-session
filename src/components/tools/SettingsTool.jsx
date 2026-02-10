/**
 * SettingsTool Component
 * Accessibility, app preferences, and AI assistant configuration
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useToolsStore } from '../../stores/useToolsStore';
import { useAIStore } from '../../stores/useAIStore';
import { downloadSessionData } from '../../utils/downloadSessionData';
import { AIService, getAvailableModels, getProviderInfo } from '../../services/aiService';
import DebugModeTool from './DebugModeTool';

const EXPIRATION_OPTIONS = [
  { value: 12, label: '12 HOURS' },
  { value: 24, label: '24 HOURS' },
  { value: 48, label: '48 HOURS' },
  { value: 168, label: '1 WEEK' },
  { value: 0, label: 'NEVER' },
];

export default function SettingsTool() {
  // App store
  const darkMode = useAppStore((state) => state.darkMode);
  const toggleDarkMode = useAppStore((state) => state.toggleDarkMode);
  const preferences = useAppStore((state) => state.preferences);
  const setPreference = useAppStore((state) => state.setPreference);
  const resetSession = useSessionStore((state) => state.resetSession);

  // AI store state
  const provider = useAIStore((state) => state.provider);
  const isKeyValid = useAIStore((state) => state.isKeyValid);
  const isValidating = useAIStore((state) => state.isValidating);
  const validationError = useAIStore((state) => state.validationError);
  const aiSettings = useAIStore((state) => state.settings);
  const hasShownSecurityNotice = useAIStore((state) => state.hasShownSecurityNotice);
  const conversations = useAIStore((state) => state.conversations);

  // AI store actions
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(null); // null | 'txt' | 'json'
  const [selectedProvider, setSelectedProvider] = useState(provider || 'anthropic');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showSecurityNotice, setShowSecurityNotice] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRemoveKeyConfirm, setShowRemoveKeyConfirm] = useState(false);
  const [showBugReportConfirm, setShowBugReportConfirm] = useState(false);
  const [showDebugMode, setShowDebugMode] = useState(false);

  // Show security notice on first use
  useEffect(() => {
    if (!hasShownSecurityNotice && !isKeyValid) {
      setShowSecurityNotice(true);
    }
  }, [hasShownSecurityNotice, isKeyValid]);

  const handleReset = () => {
    resetSession();
    useJournalStore.setState({ entries: [], navigation: { currentView: 'editor', activeEntryId: null } });
    useToolsStore.setState({ openTools: [], timerDuration: 0, timerRemaining: 0, timerActive: false, timerStartTime: null });
    setShowResetConfirm(false);
  };

  const handleDownloadConfirm = (format) => {
    downloadSessionData(format);
    setShowDownloadConfirm(null);
  };

  // AI handlers
  const handleProviderChange = (newProvider) => {
    setSelectedProvider(newProvider);
    if (isKeyValid) {
      clearApiKey();
      setApiKeyInput('');
    }
  };

  const handleValidateKey = async () => {
    if (!apiKeyInput.trim()) return;

    setValidating(true);

    const saved = await setApiKey(selectedProvider, apiKeyInput.trim());
    if (!saved) {
      setKeyValid(false, 'Failed to save API key');
      return;
    }

    if (apiKeyInput.trim() === 'dummy-test-key') {
      setKeyValid(true);
      setApiKeyInput('');
      if (!hasShownSecurityNotice) {
        markSecurityNoticeShown();
      }
      return;
    }

    const decryptedKey = await getDecryptedKey();
    const service = new AIService(selectedProvider, decryptedKey);
    const result = await service.validateKey();

    setKeyValid(result.valid, result.error);

    if (result.valid) {
      setApiKeyInput('');
      if (!hasShownSecurityNotice) {
        markSecurityNoticeShown();
      }
    }
  };

  const handleDismissSecurityNotice = () => {
    setShowSecurityNotice(false);
    markSecurityNoticeShown();
  };

  const getMaskedKey = () => {
    if (!isKeyValid) return '';
    return '••••••••••••••••••••';
  };

  const availableModels = getAvailableModels(selectedProvider);

  return (
    <div className="py-6 px-6 max-w-xl mx-auto">
      <div className="space-y-6">
        {/* Dark Mode */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Appearance</span>
          <button
            onClick={toggleDarkMode}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {darkMode ? 'DARK' : 'LIGHT'}
          </button>
        </div>

        {/* Auto-Advance Modules */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Auto-Advance</span>
          <button
            onClick={() => setPreference('autoAdvance', !preferences.autoAdvance)}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {preferences.autoAdvance ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Notifications</span>
          <button
            onClick={async () => {
              if (!preferences.notificationsEnabled) {
                if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                  const permission = await Notification.requestPermission();
                  if (permission === 'granted') {
                    setPreference('notificationsEnabled', true);
                  }
                } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                  setPreference('notificationsEnabled', true);
                }
              } else {
                setPreference('notificationsEnabled', false);
              }
            }}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {preferences.notificationsEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Reduce Motion */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Reduce Motion</span>
          <button
            onClick={() => setPreference('reduceMotion', !preferences.reduceMotion)}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {preferences.reduceMotion ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Timer Sound */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Timer Sound</span>
          <button
            onClick={() => setPreference('timerSound', !preferences.timerSound)}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {preferences.timerSound ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Download Data */}
        <div className="py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] uppercase tracking-wider">Download Data</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDownloadConfirm('txt')}
              className="flex-1 py-2 text-[11px] uppercase tracking-wider hover:opacity-70 transition-opacity border border-[var(--color-border)]"
              style={{ fontFamily: 'Azeret Mono, monospace' }}
            >
              Text File
            </button>
            <button
              onClick={() => setShowDownloadConfirm('json')}
              className="flex-1 py-2 text-[11px] uppercase tracking-wider hover:opacity-70 transition-opacity border border-[var(--color-border)]"
              style={{ fontFamily: 'Azeret Mono, monospace' }}
            >
              JSON File
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* AI ASSISTANT */}
        {/* ============================================ */}
        <div className="py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="block text-[12px] uppercase tracking-wider mb-4">
            AI Assistant
          </span>

          {/* Security Notice */}
          {showSecurityNotice && (
            <div className="mb-4 p-4 border border-[var(--accent)] bg-[var(--accent-bg)]">
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

          {/* Provider Selection */}
          <div className="mb-4">
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
            <p className="mt-2 text-[9px] text-[var(--text-tertiary)]">
              {getProviderInfo(selectedProvider).description}
            </p>
          </div>

          {/* API Key Input */}
          <div className="mb-4">
            <span className="block text-[11px] uppercase tracking-wider mb-3 text-[var(--text-secondary)]">
              API Key
            </span>

            {isKeyValid ? (
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

          {/* AI Settings - only show when key is valid */}
          {isKeyValid && (
            <>
              {/* Save Conversations */}
              <div className="flex items-center justify-between py-2">
                <span className="text-[11px] uppercase tracking-wider">
                  Save Conversations
                </span>
                <button
                  onClick={() =>
                    updateSettings({
                      persistConversations: !aiSettings.persistConversations,
                    })
                  }
                  className="text-[11px] uppercase tracking-wider hover:opacity-70 transition-opacity"
                >
                  {aiSettings.persistConversations ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Key Expiration */}
              <div className="flex items-center justify-between py-2">
                <span className="text-[11px] uppercase tracking-wider">
                  Key Expiration
                </span>
                <select
                  value={aiSettings.keyExpirationHours}
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
                  value={aiSettings.modelPreference}
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

              {/* Clear Conversations */}
              {conversations.length > 0 && (
                <div className="pt-3">
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
              <div className="pt-3">
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
            </>
          )}
        </div>

        {/* Reset Session */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Reset Session</span>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--accent)' }}
          >
            RESET
          </button>
        </div>

        {/* Report a Bug */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Report a Bug</span>
          <button
            onClick={() => setShowBugReportConfirm(true)}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            REPORT
          </button>
        </div>

        {/* Debug Mode */}
        <div className="py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <button
            onClick={() => setShowDebugMode(!showDebugMode)}
            className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
          >
            <span className="text-[12px] uppercase tracking-wider">Debug Mode</span>
            <span
              className="text-[12px] tracking-wider transition-transform duration-200"
              style={{ fontFamily: 'Azeret Mono, monospace', transform: showDebugMode ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              +
            </span>
          </button>
          {showDebugMode && <DebugModeTool />}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm p-6 space-y-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <p className="text-[12px] uppercase tracking-wider font-bold">Reset Session</p>
            <p style={{ color: 'var(--text-primary)' }}>
              This will reset the entire app and permanently delete all data, including your intake responses, session progress, and journal entries.
            </p>
            <p style={{ color: 'var(--text-tertiary)' }}>
              This action cannot be undone.
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleReset}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                Yes, reset everything
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-70"
                style={{ border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Confirmation Modal */}
      {showDownloadConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm p-6 space-y-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <p className="text-[12px] uppercase tracking-wider font-bold">Download Session Data</p>
            <p style={{ color: 'var(--text-primary)' }}>
              Your download will include:
            </p>
            <ul className="text-[13px] space-y-1" style={{ color: 'var(--text-secondary)' }}>
              <li>• All journal entries (session & personal)</li>
              <li>• Intention and touchstone</li>
              <li>• Transition reflections (peak, integration, closing)</li>
              <li>• Check-in responses</li>
              <li>• Completed activities</li>
              <li>• Follow-up reflections (if completed)</li>
            </ul>
            <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              {showDownloadConfirm === 'txt'
                ? 'Text format is human-readable.'
                : 'JSON format is useful for backup or import.'}
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleDownloadConfirm(showDownloadConfirm)}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                Yes, download {showDownloadConfirm === 'txt' ? 'text file' : 'JSON file'}
              </button>
              <button
                onClick={() => setShowDownloadConfirm(null)}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-70"
                style={{ border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bug Report Confirmation Modal */}
      {showBugReportConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm p-6 space-y-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <p className="text-[12px] uppercase tracking-wider font-bold">Report a Bug</p>
            <p style={{ color: 'var(--text-primary)' }}>
              You&apos;ll be taken to our GitHub page to submit a bug report. A short form will help you describe what happened.
            </p>
            <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              A free GitHub account is required to submit.
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  window.open(
                    'https://github.com/wellwellwellyourefeelingfine/m-session/issues/new?template=bug_report.yml&labels=bug',
                    '_blank',
                    'noopener,noreferrer'
                  );
                  setShowBugReportConfirm(false);
                }}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                Continue to GitHub
              </button>
              <button
                onClick={() => setShowBugReportConfirm(false)}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-70"
                style={{ border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
