/**
 * AISettingsPanel Component
 * In-modal settings for viewing and customizing AI context
 * Shows system prompt and allows toggling context elements
 */

import { useState, useEffect } from 'react';
import { useAIStore } from '../../stores/useAIStore';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { buildSystemPrompt, buildMinimalSystemPrompt } from '../../utils/buildSystemPrompt';

export default function AISettingsPanel({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('context'); // 'context' | 'prompt'

  // AI Store
  const settings = useAIStore((state) => state.settings);
  const updateSettings = useAIStore((state) => state.updateSettings);

  // Session context toggles - use local state for pending changes
  const savedContextSettings = settings.contextSettings || {
    includeSessionStatus: true,
    includeTimeSinceIngestion: true,
    includeDosage: true,
    includeCurrentModule: true,
    includeProgress: true,
    includeJournal: true,
    includeIntention: true,
  };

  // Local state for pending changes (before Apply)
  const [localContextSettings, setLocalContextSettings] = useState(savedContextSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset local state when panel opens
  useEffect(() => {
    if (isOpen) {
      setLocalContextSettings(savedContextSettings);
      setHasChanges(false);
    }
  }, [isOpen]);

  const updateLocalContextSettings = (key, value) => {
    setLocalContextSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleApply = () => {
    updateSettings({
      contextSettings: localContextSettings,
    });
    setHasChanges(false);
  };

  const handleClose = () => {
    // Auto-apply changes on close
    if (hasChanges) {
      handleApply();
    }
    onClose();
  };

  // Get current system prompt for display (using local settings for preview)
  const sessionState = useSessionStore.getState();
  const journalState = useJournalStore.getState();
  const isInActiveSession = sessionState.sessionPhase === 'active';
  const systemPrompt = isInActiveSession
    ? buildSystemPrompt(sessionState, journalState, localContextSettings)
    : buildMinimalSystemPrompt();

  // Handle click outside to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const contextOptions = [
    { key: 'includeSessionStatus', label: 'Session Status', description: 'Current phase (come-up, peak, integration)' },
    { key: 'includeTimeSinceIngestion', label: 'Time Since Ingestion', description: 'How long since substance was taken' },
    { key: 'includeDosage', label: 'Dosage Information', description: 'Reported dosage and intensity' },
    { key: 'includeCurrentModule', label: 'Current Activity', description: 'What module/activity is active' },
    { key: 'includeProgress', label: 'Session Progress', description: 'Completed modules and check-ins' },
    { key: 'includeJournal', label: 'Journal Entries', description: 'Recent journal entries (last 3)' },
    { key: 'includeIntention', label: 'User Intention', description: 'Focus area and holding question from intake' },
  ];

  return (
    <div
      className="fixed inset-0 top-16 z-[80] flex items-start justify-center bg-black/50 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-lg mx-4 mt-8 bg-[var(--bg-primary)] border border-[var(--border)] animate-slideDown max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <span className="text-[11px] uppercase tracking-wider">AI Settings</span>
          <button
            onClick={handleClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-lg"
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab('context')}
            className={`flex-1 py-2 text-[10px] uppercase tracking-wider transition-colors ${
              activeTab === 'context'
                ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Context Settings
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex-1 py-2 text-[10px] uppercase tracking-wider transition-colors ${
              activeTab === 'prompt'
                ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            View System Prompt
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'context' ? (
            <div className="space-y-1">
              <p className="text-[10px] text-[var(--text-tertiary)] mb-4">
                Control what information is shared with the AI to provide context about your session.
                Disabling options may reduce the AI's ability to provide relevant support.
              </p>

              {contextOptions.map((option) => (
                <div
                  key={option.key}
                  className="flex items-start justify-between py-3 border-b border-[var(--border-subtle)]"
                >
                  <div className="flex-1 pr-4">
                    <span className="block text-[11px] uppercase tracking-wider">
                      {option.label}
                    </span>
                    <span className="block text-[9px] text-[var(--text-tertiary)] mt-0.5">
                      {option.description}
                    </span>
                  </div>
                  <button
                    onClick={() => updateLocalContextSettings(option.key, !localContextSettings[option.key])}
                    className={`
                      px-3 py-1 text-[10px] uppercase tracking-wider
                      border transition-colors
                      ${localContextSettings[option.key]
                        ? 'border-[var(--accent)] text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--text-tertiary)]'
                      }
                    `}
                  >
                    {localContextSettings[option.key] ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}

              {/* Apply button */}
              <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                <p className="text-[9px] text-[var(--text-tertiary)] flex-1">
                  Changes apply to new messages only.
                </p>
                <button
                  onClick={handleApply}
                  disabled={!hasChanges}
                  className={`
                    px-4 py-2 text-[10px] uppercase tracking-wider
                    border transition-colors
                    ${hasChanges
                      ? 'border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-bg)]'
                      : 'border-[var(--border)] text-[var(--text-tertiary)] cursor-not-allowed'
                    }
                  `}
                >
                  {hasChanges ? 'Apply' : 'Applied'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[10px] text-[var(--text-tertiary)]">
                This is the system prompt that guides the AI's responses. It includes your
                enabled context settings and cannot be modified directly.
              </p>

              <div className="bg-[var(--bg-secondary)] p-4 max-h-96 overflow-y-auto">
                <pre className="text-[10px] leading-relaxed whitespace-pre-wrap break-words font-mono text-[var(--text-secondary)]">
                  {systemPrompt}
                </pre>
              </div>

              <p className="text-[9px] text-[var(--text-tertiary)]">
                {isInActiveSession
                  ? 'Full context is included because you are in an active session.'
                  : 'Minimal context is shown because no session is active.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
