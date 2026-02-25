/**
 * SessionMenu Component
 * Hamburger menu in the header for session management:
 * - Start a new session (archive current + reset)
 * - Browse past sessions
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useSessionHistoryStore } from '../../stores/useSessionHistoryStore';
import { useAppStore } from '../../stores/useAppStore';
import SessionHistoryModal from '../history/SessionHistoryModal';
import DataDownloadModal from '../session/DataDownloadModal';

export default function SessionMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosingMenu, setIsClosingMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const menuRef = useRef(null);

  const sessionPhase = useSessionStore((s) => s.sessionPhase);
  const journalEntries = useJournalStore((s) => s.entries);
  const archiveAndReset = useSessionHistoryStore((s) => s.archiveAndReset);
  const archivedSessions = useSessionHistoryStore((s) => s.sessions);
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);

  const hasData = sessionPhase !== 'not-started' || journalEntries.length > 0;
  const hasImages = journalEntries.some((e) => e.hasImage);

  // Close menu with animation
  const closeMenu = useCallback(() => {
    setIsClosingMenu(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosingMenu(false);
    }, 150);
  }, []);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, closeMenu]);

  const handleToggle = () => {
    if (isOpen) {
      closeMenu();
    } else {
      setIsOpen(true);
    }
  };

  const handleNewSession = () => {
    closeMenu();
    if (!hasData) {
      // Nothing to archive — already at a fresh state
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmNewSession = () => {
    archiveAndReset();
    setShowConfirm(false);
  };

  const handleShowHistory = () => {
    closeMenu();
    setShowHistory(true);
  };

  const handleExport = () => {
    closeMenu();
    setShowDownload(true);
  };

  // Warning message based on session phase
  const getWarningMessage = () => {
    if (sessionPhase === 'active' || sessionPhase === 'paused') {
      return 'Your session is still in progress. It will be saved in its current state and can be resumed later.';
    }
    if (sessionPhase === 'completed') {
      return 'Your current session will be saved. Any remaining follow-up activities can be accessed by loading this session later.';
    }
    return 'Your current session data will be saved and a new session will be started.';
  };

  return (
    <div ref={menuRef} className="relative h-full flex items-end pb-2">
      {/* Hamburger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-10 h-10 flex flex-col items-center justify-center gap-[5px] touch-target"
        aria-label="Session menu"
        aria-expanded={isOpen}
      >
        <span
          className="block w-[18px] h-[1.5px] bg-[var(--color-text-tertiary)] transition-all duration-200"
          style={isOpen ? { transform: 'translateY(6.5px) rotate(45deg)' } : {}}
        />
        <span
          className="block w-[18px] h-[1.5px] bg-[var(--color-text-tertiary)] transition-all duration-200"
          style={isOpen ? { opacity: 0 } : {}}
        />
        <span
          className="block w-[18px] h-[1.5px] bg-[var(--color-text-tertiary)] transition-all duration-200"
          style={isOpen ? { transform: 'translateY(-6.5px) rotate(-45deg)' } : {}}
        />
      </button>

      {/* Dropdown Menu — slides out from under the header */}
      {isOpen && (
        <div
          className="absolute right-0 z-50 overflow-hidden"
          style={{ top: 'calc(100% + 1px)' }}
        >
          <div
            className="w-48 bg-[var(--color-bg)] border border-t-0 border-[var(--color-border)] shadow-lg"
            style={{
              animation: isClosingMenu ? 'menuSlideUp 150ms ease-in forwards' : 'menuSlideDown 200ms ease-out forwards',
            }}
          >
          {/* Dark/Light mode toggle + version */}
          <div
            className="w-full px-4 py-3 flex items-center justify-between"
          >
            <button
              type="button"
              onClick={toggleDarkMode}
              className="relative flex-shrink-0"
              style={{ width: '36px', height: '20px' }}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {/* Track */}
              <span
                className="absolute inset-0 rounded-full transition-colors duration-200"
                style={{ backgroundColor: darkMode ? '#9D8CD9' : '#E8A87C' }}
              />
              {/* Thumb */}
              <span
                className="absolute top-[2px] rounded-full bg-white transition-transform duration-200 shadow-sm"
                style={{
                  width: '16px',
                  height: '16px',
                  left: '2px',
                  transform: darkMode ? 'translateX(16px)' : 'translateX(0)',
                }}
              />
            </button>
            <span
              className="text-[9px] tracking-wider text-[var(--color-text-tertiary)]"
              style={{ fontFamily: 'Azeret Mono, monospace' }}
            >
              m-session v1.0
            </span>
          </div>
          <div className="border-t border-[var(--color-border)]" />
          <button
            type="button"
            onClick={handleNewSession}
            disabled={!hasData}
            className="w-full px-4 py-3 text-left uppercase tracking-wider text-[10px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-30 disabled:cursor-default"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            New Session
          </button>
          <div className="border-t border-[var(--color-border)]" />
          <button
            type="button"
            onClick={handleShowHistory}
            disabled={archivedSessions.length === 0}
            className="w-full px-4 py-3 text-left uppercase tracking-wider text-[10px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-30 disabled:cursor-default"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            Past Sessions
            {archivedSessions.length > 0 && (
              <span className="ml-2 text-[var(--color-text-tertiary)]">
                ({archivedSessions.length})
              </span>
            )}
          </button>
          <div className="border-t border-[var(--color-border)]" />
          <button
            type="button"
            onClick={handleExport}
            disabled={!hasData}
            className="w-full px-4 py-3 text-left uppercase tracking-wider text-[10px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-30 disabled:cursor-default"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            Export Session
          </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-sm rounded-lg p-6 shadow-lg">
            <h3 className="mb-4 text-[var(--color-text-primary)]">Start New Session?</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4">
              {getWarningMessage()}
            </p>
            {hasImages && (
              <p className="text-[var(--color-text-tertiary)] text-xs mb-4 italic">
                Note: Any images attached to journal entries won't be carried over. Download them before starting a new session.
              </p>
            )}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleConfirmNewSession}
                className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
              >
                Save & Start New
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="w-full py-2 text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider hover:text-[var(--color-text-secondary)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session History Modal */}
      {showHistory && (
        <SessionHistoryModal onClose={() => setShowHistory(false)} />
      )}

      {/* Data Download Modal */}
      {showDownload && (
        <DataDownloadModal onClose={() => setShowDownload(false)} />
      )}

      {/* Menu animation keyframes (injected once) */}
      <style>{`
        @keyframes menuSlideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        @keyframes menuSlideUp {
          from { transform: translateY(0); }
          to { transform: translateY(-100%); }
        }
      `}</style>
    </div>
  );
}
