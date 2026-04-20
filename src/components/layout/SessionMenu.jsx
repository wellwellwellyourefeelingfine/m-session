/**
 * SessionMenu Component
 * Hamburger menu in the header for session management:
 * - Start a new session (archive current + reset)
 * - Browse past sessions
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useSessionHistoryStore } from '../../stores/useSessionHistoryStore';
import { useAppStore } from '../../stores/useAppStore';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { useAppUpdaterContext } from '../shared/AppUpdaterContext';
import { ArrowUpRightIcon } from '../shared/Icons';
import SessionHistoryModal from '../history/SessionHistoryModal';
import DataDownloadModal from '../session/DataDownloadModal';
import { APP_VERSION, BUILD_SHA } from '../../constants';
import { setTutorialDelay } from '../timeline/tutorialRevealFlag';

// Banner ID must match the one used in TimelineEditor/TimelineTutorial
const TUTORIAL_BANNER_ID = 'timeline-tutorial';

export default function SessionMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosingMenu, setIsClosingMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showFullVersion, setShowFullVersion] = useState(false);
  const [newSessionOverlay, setNewSessionOverlay] = useState(null); // null | 'fading-in' | 'fading-out'
  const menuRef = useRef(null);

  const sessionPhase = useSessionStore((s) => s.sessionPhase);
  const journalEntries = useJournalStore((s) => s.entries);
  const archiveAndReset = useSessionHistoryStore((s) => s.archiveAndReset);
  const loadSession = useSessionHistoryStore((s) => s.loadSession);
  const archivedSessions = useSessionHistoryStore((s) => s.sessions);
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const setShowInstallPrompt = useAppStore((s) => s.setShowInstallPrompt);
  const undismissBanner = useAppStore((s) => s.undismissBanner);
  const setCurrentTab = useAppStore((s) => s.setCurrentTab);
  const { canPromptNatively, promptNativeInstall, isStandalone } = useInstallPrompt();
  const showInstallButton = !isStandalone;
  const { checkStatus, updateAvailable, checkForUpdate, applyUpdate } = useAppUpdaterContext();

  const hasData = sessionPhase !== 'not-started' || journalEntries.length > 0;

  // Close menu with animation
  const closeMenu = useCallback(() => {
    setIsClosingMenu(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosingMenu(false);
      setShowFullVersion(false); // reset version reveal so each open starts at brand
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

  // Covers the screen with a full-bleed overlay that fades in, runs the session-swap
  // action behind the cover, then fades out to reveal the new session state.
  const runSessionTransition = (action) => {
    setNewSessionOverlay('fading-in');
    // Two rAFs to guarantee the initial opacity-0 paint before transitioning to 1
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setNewSessionOverlay('visible');
      });
    });
    setTimeout(() => {
      action();
      // Small pause so the new session state commits before we reveal it
      setTimeout(() => {
        setNewSessionOverlay('fading-out');
        setTimeout(() => setNewSessionOverlay(null), 300);
      }, 100);
    }, 250);
  };

  const handleConfirmNewSession = () => {
    setShowConfirm(false);
    runSessionTransition(archiveAndReset);
  };

  const handleLoadSession = (sessionId) => {
    setShowHistory(false);
    runSessionTransition(() => loadSession(sessionId));
  };

  const handleShowHistory = () => {
    closeMenu();
    setShowHistory(true);
  };

  const handleExport = () => {
    closeMenu();
    setShowDownload(true);
  };

  const handleInstall = async () => {
    closeMenu();
    if (canPromptNatively) {
      try {
        const result = await promptNativeInstall();
        if (result?.outcome === 'accepted') return;
      } catch {
        // Native prompt failed — fall through to manual instructions
      }
    }
    setShowInstallPrompt(true);
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
            <button
              type="button"
              onClick={() => setShowFullVersion((v) => !v)}
              className="relative tracking-wider text-[var(--color-text-tertiary)] cursor-pointer"
              style={{
                fontFamily: 'Azeret Mono, monospace',
                minWidth: '110px',
                height: '14px',
              }}
              aria-label={showFullVersion ? 'Hide version details' : 'Show version details'}
            >
              {/* Brand state — larger to fill the space now that there's no
                  version next to it. Absolutely positioned so the two states
                  crossfade in place. */}
              <span
                className="absolute inset-0 flex items-center justify-end text-[11px] transition-opacity duration-200"
                style={{ opacity: showFullVersion ? 0 : 1 }}
              >
                m-session
              </span>
              {/* Version state — smaller because the version + hash string is
                  longer and needs to fit comfortably in the same space. */}
              <span
                className="absolute inset-0 flex items-center justify-end text-[9px] transition-opacity duration-200"
                style={{ opacity: showFullVersion ? 1 : 0 }}
              >
                v{APP_VERSION}{BUILD_SHA ? ` · ${BUILD_SHA}` : ' · no hash'}
              </span>
            </button>
          </div>
          <div className="border-t border-[var(--color-border)]" />
          <button
            type="button"
            onClick={async () => {
              if (updateAvailable) {
                // New version waiting — activate and reload
                applyUpdate();
              } else {
                // Re-run a check (lets users force a fresh check; cheap and useful)
                await checkForUpdate();
              }
            }}
            disabled={checkStatus === 'checking'}
            className="w-full px-4 py-3 text-left uppercase tracking-wider text-[10px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-30 disabled:cursor-default"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {checkStatus === 'checking'
              ? 'Checking…'
              : updateAvailable
                ? 'Update App'
                : checkStatus === 'error'
                  ? 'Error - Try Again'
                  : 'App Up-to-Date'}
          </button>
          {showInstallButton && (
            <>
              <div className="border-t border-[var(--color-border)]" />
              <button
                type="button"
                onClick={handleInstall}
                className="w-full px-4 py-3 text-left uppercase tracking-wider text-[10px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                style={{ fontFamily: 'Azeret Mono, monospace' }}
              >
                Install App
              </button>
            </>
          )}
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
          <div className="border-t border-[var(--color-border)]" />
          <button
            type="button"
            onClick={() => {
              setTutorialDelay(50);
              closeMenu();
              undismissBanner(TUTORIAL_BANNER_ID);
              setCurrentTab('home');
            }}
            disabled={sessionPhase === 'not-started' || sessionPhase === 'intake'}
            className="w-full px-4 py-3 text-left uppercase tracking-wider text-[10px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-30 disabled:cursor-default"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            Show Tutorial
          </button>
          <div className="border-t border-[var(--color-border)]" />
          <a
            href={`https://tally.so/r/BzG9qN?app_version=${encodeURIComponent(APP_VERSION)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMenu}
            className="block w-full px-4 py-3 text-left uppercase tracking-wider text-[10px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors no-underline"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            Give Feedback <ArrowUpRightIcon size={12} strokeWidth={2.5} className="inline-block ml-0.5 -mt-px text-[var(--color-text-tertiary)]" />
          </a>
          <div className="border-t border-[var(--color-border)]" />
          <a
            href={`${window.location.origin}/`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMenu}
            className="block w-full px-4 py-3 text-left uppercase tracking-wider text-[10px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors no-underline"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            Landing Page <ArrowUpRightIcon size={12} strokeWidth={2.5} className="inline-block ml-0.5 -mt-px text-[var(--color-text-tertiary)]" />
          </a>
          </div>
        </div>
      )}

      {/* Modals portaled to body to escape header's backdrop-filter stacking context */}
      {showConfirm && createPortal(
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50 px-6">
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-sm rounded-lg p-6 shadow-lg">
            <h3
              className="mb-4 text-2xl text-[var(--color-text-primary)]"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              Start New Session?
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-6 leading-relaxed">
              {getWarningMessage()}
            </p>
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
        </div>,
        document.body
      )}

      {/* New-session transition overlay — covers app while reset happens */}
      {newSessionOverlay && createPortal(
        <div
          className="fixed inset-0 z-[60] bg-[var(--color-bg)]"
          style={{
            opacity: newSessionOverlay === 'visible' ? 1 : 0,
            transition: newSessionOverlay === 'fading-out'
              ? 'opacity 300ms ease-out'
              : 'opacity 250ms ease-out',
          }}
        />,
        document.body
      )}

      {showHistory && createPortal(
        <SessionHistoryModal
          onClose={() => setShowHistory(false)}
          onLoad={handleLoadSession}
        />,
        document.body
      )}

      {showDownload && createPortal(
        <DataDownloadModal onClose={() => setShowDownload(false)} />,
        document.body
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
