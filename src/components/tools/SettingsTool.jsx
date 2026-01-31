/**
 * SettingsTool Component
 * Accessibility and app preferences
 */

import { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useToolsStore } from '../../stores/useToolsStore';
import { downloadSessionData } from '../../utils/downloadSessionData';

export default function SettingsTool() {
  const darkMode = useAppStore((state) => state.darkMode);
  const toggleDarkMode = useAppStore((state) => state.toggleDarkMode);
  const preferences = useAppStore((state) => state.preferences);
  const setPreference = useAppStore((state) => state.setPreference);
  const resetSession = useSessionStore((state) => state.resetSession);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(null); // null | 'txt' | 'json'

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
                // Turning on: request permission
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
    </div>
  );
}
