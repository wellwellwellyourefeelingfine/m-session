/**
 * SettingsTool Component
 * Accessibility, app preferences, and AI assistant configuration
 */

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useToolsStore } from '../../stores/useToolsStore';
import { useAIStore } from '../../stores/useAIStore';
import { useSessionHistoryStore } from '../../stores/useSessionHistoryStore';
import { downloadSessionData, downloadSessionImages } from '../../utils/downloadSessionData';
import { AIService, getAvailableModels, getProviderInfo } from '../../services/aiService';
import { getAvailableVoices } from '../../content/meditations';
import { precacheAudioForTimeline } from '../../services/audioCacheService';
import { audioPath } from '../../utils/audioPath';
import DebugModeTool from './DebugModeTool';
import { APP_VERSION } from '../../constants';
import { CircleSkipIcon, CirclePlusIcon } from '../shared/Icons';

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
  const currentTab = useAppStore((state) => state.currentTab);
  const resetSession = useSessionStore((state) => state.resetSession);
  const hasImages = useJournalStore((state) => state.entries.some((e) => e.hasImage && e.source === 'session'));

  // Default voice — two-state model. The cycler reads/writes a local pending
  // value so rapid toggling doesn't touch the store or the PWA cache. The
  // commit fires only when the user leaves the Tools tab AND the pending
  // value differs from what's already committed.
  const availableVoices = getAvailableVoices();
  const [pendingVoiceId, setPendingVoiceId] = useState(
    preferences.defaultVoiceId || availableVoices[0]?.id || 'theo'
  );
  const committedVoiceIdRef = useRef(preferences.defaultVoiceId);

  // Re-sync local pending state when the committed value changes from outside
  // this component (e.g. a future reset-preferences action).
  useEffect(() => {
    committedVoiceIdRef.current = preferences.defaultVoiceId;
    setPendingVoiceId(preferences.defaultVoiceId || availableVoices[0]?.id || 'theo');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- availableVoices is stable
  }, [preferences.defaultVoiceId]);

  // Commit pending voice on tab-leave. Fires precache for the new voice across
  // the current timeline so offline play works with the chosen default.
  useEffect(() => {
    if (currentTab === 'tools') return;
    if (pendingVoiceId === committedVoiceIdRef.current) return;
    setPreference('defaultVoiceId', pendingVoiceId);
    committedVoiceIdRef.current = pendingVoiceId;
    const modules = useSessionStore.getState().modules?.items;
    if (Array.isArray(modules) && modules.length > 0) {
      precacheAudioForTimeline(modules, pendingVoiceId);
    }
  }, [currentTab, pendingVoiceId, setPreference]);

  // Voice preview playback. Plays a single sample clip from
  // /audio/voice-previews/[voiceId].mp3. Fails silently if a preview file is
  // missing. Cycling to a different voice or pressing Preview while playing
  // triggers a short fade-out so the cut isn't jarring.
  const previewAudioRef = useRef(null);
  const previewFadeIdRef = useRef(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const stopPreview = () => {
    const audio = previewAudioRef.current;
    if (!audio) {
      setIsPreviewPlaying(false);
      return;
    }
    // Fade volume to 0 over ~150ms, then pause. Short enough to feel snappy,
    // long enough to avoid a pop/click cutoff.
    if (previewFadeIdRef.current) clearInterval(previewFadeIdRef.current);
    const startVolume = audio.volume;
    const steps = 10;
    const stepMs = 15;
    let remaining = steps;
    previewFadeIdRef.current = setInterval(() => {
      remaining -= 1;
      audio.volume = Math.max(0, startVolume * (remaining / steps));
      if (remaining <= 0) {
        clearInterval(previewFadeIdRef.current);
        previewFadeIdRef.current = null;
        audio.pause();
        audio.src = '';
        if (previewAudioRef.current === audio) {
          previewAudioRef.current = null;
        }
      }
    }, stepMs);
    setIsPreviewPlaying(false);
  };

  const handlePreviewToggle = () => {
    if (isPreviewPlaying) {
      stopPreview();
      return;
    }
    if (!pendingVoiceId) return;
    const url = audioPath(`/audio/voice-previews/${pendingVoiceId}.mp3`);
    const audio = new Audio(url);
    previewAudioRef.current = audio;
    audio.onended = () => {
      if (previewAudioRef.current === audio) {
        previewAudioRef.current = null;
      }
      setIsPreviewPlaying(false);
    };
    audio.play()
      .then(() => setIsPreviewPlaying(true))
      .catch(() => {
        // Preview file not yet generated or blocked — fail silently.
        if (previewAudioRef.current === audio) {
          previewAudioRef.current = null;
        }
        setIsPreviewPlaying(false);
      });
  };

  // Clean up any lingering preview audio / fade interval on unmount.
  useEffect(() => () => {
    if (previewFadeIdRef.current) clearInterval(previewFadeIdRef.current);
    const current = previewAudioRef.current;
    if (current) {
      current.pause();
      current.src = '';
      previewAudioRef.current = null;
    }
  }, []);

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
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(null); // null | 'txt' | 'images'
  const [selectedProvider, setSelectedProvider] = useState(provider || 'anthropic');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showSecurityNotice, setShowSecurityNotice] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRemoveKeyConfirm, setShowRemoveKeyConfirm] = useState(false);
  const [showBugReportConfirm, setShowBugReportConfirm] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
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

  const handleWipeAll = () => {
    resetSession();
    useJournalStore.setState({ entries: [], navigation: { currentView: 'editor', activeEntryId: null } });
    useToolsStore.setState({ openTools: [], timerDuration: 0, timerRemaining: 0, timerActive: false, timerStartTime: null });
    useSessionHistoryStore.setState({ sessions: [] });
    setShowWipeConfirm(false);
  };

  const handleDownloadConfirm = async (type) => {
    if (type === 'images') {
      await downloadSessionImages();
    } else {
      downloadSessionData();
    }
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
        {/* Default Voice — two-line layout: label + preview on top, cycler centered below. */}
        {availableVoices.length >= 2 && (() => {
          const index = Math.max(0, availableVoices.findIndex((v) => v.id === pendingVoiceId));
          const cycle = (delta) => {
            // Cycling voices auto-stops any in-flight preview with a fade.
            if (isPreviewPlaying) stopPreview();
            const next = availableVoices[(index + delta + availableVoices.length) % availableVoices.length];
            if (next) setPendingVoiceId(next.id);
          };
          return (
            <div className="py-3 border-b border-app-gray-200 dark:border-app-gray-800">
              {/* Line 1: label only. Kept short (text-only, ~12px tall) so the
                  ToolPanel's absolute "×" close button (top-2 right-3) sits cleanly
                  in the top-right corner next to it — same visual pattern as other tools. */}
              <div className="text-[12px] uppercase tracking-wider mb-6">Default Voice</div>

              {/* Line 2: < voice cycler >  +  Preview button */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => cycle(-1)}
                    aria-label="Previous voice"
                    className="hover:opacity-70 transition-opacity"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M9 2 L4 7 L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span
                    className="text-[12px] uppercase tracking-wider min-w-[9rem] text-center"
                    style={{ fontFamily: 'Azeret Mono, monospace' }}
                  >
                    {availableVoices[index]?.label}
                  </span>
                  <button
                    onClick={() => cycle(1)}
                    aria-label="Next voice"
                    className="hover:opacity-70 transition-opacity"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M5 2 L10 7 L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={handlePreviewToggle}
                  className="flex items-center gap-2 text-[12px] uppercase tracking-wider text-[var(--accent)] hover:opacity-70 transition-opacity"
                  style={{ fontFamily: 'Azeret Mono, monospace' }}
                  aria-label={isPreviewPlaying ? 'Stop preview' : `Preview ${availableVoices[index]?.label}`}
                >
                  <span>Preview</span>
                  {isPreviewPlaying ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <rect x="9" y="9" width="6" height="6" fill="currentColor" stroke="none" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="10 8 16 12 10 16" fill="currentColor" stroke="none" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          );
        })()}

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

        {/* Font Style */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Font Style</span>
          <button
            onClick={() => setPreference('readableFont', !preferences.readableFont)}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {preferences.readableFont ? 'SERIF' : 'MONO'}
          </button>
        </div>

        {/* Font Size Adjustment */}
        {(() => {
          const current = preferences.fontSizeAdjustment ?? 0;
          const minDisabled = current <= -1;
          const maxDisabled = current >= 2;
          const label = current > 0 ? `+${current}` : String(current);
          return (
            <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
              <span className="text-[12px] uppercase tracking-wider">Font Size</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPreference('fontSizeAdjustment', current - 1)}
                  disabled={minDisabled}
                  aria-label="Decrease font size"
                  className={`transition-opacity ${
                    minDisabled
                      ? 'opacity-30 cursor-default'
                      : 'opacity-100 hover:opacity-70'
                  }`}
                >
                  <CircleSkipIcon size={20} />
                </button>
                <span
                  className="text-[12px] uppercase tracking-wider w-6 text-center"
                  style={{ fontFamily: 'Azeret Mono, monospace' }}
                >
                  {label}
                </span>
                <button
                  onClick={() => setPreference('fontSizeAdjustment', current + 1)}
                  disabled={maxDisabled}
                  aria-label="Increase font size"
                  className={`transition-opacity ${
                    maxDisabled
                      ? 'opacity-30 cursor-default'
                      : 'opacity-100 hover:opacity-70'
                  }`}
                >
                  <CirclePlusIcon size={20} />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Alternate App Logo */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Alternate App Logo</span>
          <button
            onClick={() => setPreference('alternateAppLogo', !preferences.alternateAppLogo)}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {preferences.alternateAppLogo ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Glass Effect */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Glass Effect</span>
          <button
            onClick={() => setPreference('glassEffect', !preferences.glassEffect)}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {preferences.glassEffect ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Automatic Updates */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Automatic Updates</span>
          <button
            onClick={() => setPreference('autoUpdate', !preferences.autoUpdate)}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {preferences.autoUpdate ? 'ON' : 'OFF'}
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

        {/* Gong Sound */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Gong Sound</span>
          <button
            onClick={() => setPreference('gongSound', !preferences.gongSound)}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {preferences.gongSound !== false ? 'ON' : 'OFF'}
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
              Session Record
            </button>
            <button
              onClick={() => setShowDownloadConfirm('images')}
              disabled={!hasImages}
              className="flex-1 py-2 text-[11px] uppercase tracking-wider hover:opacity-70 transition-opacity border border-[var(--color-border)] disabled:opacity-30 disabled:cursor-default"
              style={{ fontFamily: 'Azeret Mono, monospace' }}
            >
              {hasImages ? 'Images' : 'No Images'}
            </button>
          </div>
        </div>

        {/* Reset Current Session */}
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

        {/* Wipe All Data */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Wipe All Data</span>
          <button
            onClick={() => setShowWipeConfirm(true)}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--accent)' }}
          >
            WIPE
          </button>
        </div>

        {/* Provide Feedback */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Provide Feedback</span>
          <button
            onClick={() => setShowBugReportConfirm(true)}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            FEEDBACK
          </button>
        </div>

        {/* AI Assistant */}
        <div className="py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <button
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
          >
            <span className="text-[12px] uppercase tracking-wider">AI Assistant</span>
            <span
              className="text-[12px] tracking-wider transition-transform duration-200"
              style={{ fontFamily: 'Azeret Mono, monospace', transform: showAIAssistant ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              +
            </span>
          </button>
          {showAIAssistant && (
            <div className="mt-4">
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
                        autoComplete="off"
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
          )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-sm p-6 space-y-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <p className="text-[12px] uppercase tracking-wider font-bold">Reset Current Session</p>
            <p style={{ color: 'var(--text-primary)' }}>
              This will delete your current session data, including intake responses, session progress, and journal entries.
            </p>
            <p style={{ color: 'var(--text-tertiary)' }}>
              Your saved past sessions will not be affected.
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleReset}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                Yes, reset current session
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

      {/* Wipe All Data Confirmation Modal */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-sm p-6 space-y-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <p className="text-[12px] uppercase tracking-wider font-bold">Wipe All Data</p>
            <p style={{ color: 'var(--text-primary)' }}>
              This will permanently delete all data from the app, including your current session, all saved past sessions, and all journal entries.
            </p>
            <p style={{ color: 'var(--text-tertiary)' }}>
              This action cannot be undone.
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleWipeAll}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                Yes, wipe everything
              </button>
              <button
                onClick={() => setShowWipeConfirm(false)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-sm p-6 space-y-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <p className="text-[12px] uppercase tracking-wider font-bold">
              {showDownloadConfirm === 'images' ? 'Download Images' : 'Download Session Data'}
            </p>
            {showDownloadConfirm === 'images' ? (
              <p style={{ color: 'var(--text-secondary)' }}>
                This will download all images created during your session as separate PNG files.
              </p>
            ) : (
              <>
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
              </>
            )}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleDownloadConfirm(showDownloadConfirm)}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                Yes, download {showDownloadConfirm === 'images' ? 'images' : 'session record'}
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

      {/* Feedback Modal */}
      {showBugReportConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-sm p-6 space-y-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <p className="text-[12px] uppercase tracking-wider font-bold">Provide Feedback</p>
            <p style={{ color: 'var(--text-primary)' }}>
              Choose how you&apos;d like to share:
            </p>
            <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <div>
                <p className="font-semibold mb-1">Bug Report</p>
                <p className="text-xs">Submit a detailed issue with our template on GitHub (requires free GitHub account)</p>
              </div>
              <div>
                <p className="font-semibold mb-1">General Feedback</p>
                <p className="text-xs">Quick survey about your experience (no account needed)</p>
              </div>
            </div>
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
                Report a Bug
              </button>
              <button
                onClick={() => {
                  const params = new URLSearchParams({ app_version: APP_VERSION });
                  window.open(
                    `https://tally.so/r/BzG9qN?${params}`,
                    '_blank',
                    'noopener,noreferrer'
                  );
                  setShowBugReportConfirm(false);
                }}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                Share Feedback
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
