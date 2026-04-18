/**
 * SessionHistoryModal Component
 * Accordion-style panel for browsing archived sessions.
 * Matches the toolbar accordion pattern from ToolPanel/ToolsView.
 */

import { useState, useEffect, useCallback, Fragment } from 'react';
import { useSessionHistoryStore } from '../../stores/useSessionHistoryStore';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';

/**
 * Format a timestamp to a readable date string
 */
function formatDate(timestamp) {
  if (!timestamp) return 'Unknown date';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
}

/**
 * Format a timestamp to a time string (e.g. "2:30 PM")
 */
function formatTime(timestamp) {
  if (!timestamp) return null;
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

/**
 * Format duration in seconds to short string
 */
function formatDuration(seconds) {
  if (!seconds) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Get a display-friendly status label
 */
function getStatusLabel(metadata) {
  if (!metadata) return 'Unknown';
  const phase = metadata.sessionPhase;
  if (phase === 'completed') return 'Completed';
  if (phase === 'active' || phase === 'paused') return 'In Progress';
  if (phase === 'intake' || phase === 'pre-session' || phase === 'substance-checklist') return 'Setup';
  return 'Started';
}

/**
 * Get status color class (for inverted background context)
 */
function getStatusColor(metadata) {
  const phase = metadata?.sessionPhase;
  if (phase === 'completed') return 'text-[var(--accent)]';
  return 'text-[var(--color-text-tertiary)]';
}

/**
 * Build dose display string from session data
 */
function formatDoseString(dosageMg, booster) {
  if (!dosageMg) return null;
  let str = `${dosageMg}mg`;
  if (booster?.status === 'taken' && booster.boosterDoseMg) {
    str += ` + ${booster.boosterDoseMg}mg booster`;
  }
  return str;
}

/**
 * Count completed activities grouped by phase
 */
function countActivitiesByPhase(modules) {
  if (!modules?.items?.length) return null;
  const counts = {};
  for (const item of modules.items) {
    if (item.status === 'completed') {
      const phase = item.phase;
      counts[phase] = (counts[phase] || 0) + 1;
    }
  }
  if (Object.keys(counts).length === 0) return null;
  const labels = { 'come-up': 'Come-up', 'peak': 'Peak', 'integration': 'Synthesis' };
  return Object.entries(counts)
    .map(([phase, count]) => `${labels[phase] || phase}: ${count}`)
    .join(' · ');
}

/**
 * Get progress description
 */
function getProgressLabel(sessionPhase, currentPhase) {
  if (sessionPhase === 'completed') return 'Completed';
  if (sessionPhase === 'active' || sessionPhase === 'paused') {
    const phaseLabels = { 'come-up': 'come-up phase', 'peak': 'peak phase', 'integration': 'synthesis phase' };
    const label = phaseLabels[currentPhase] || currentPhase;
    return `In progress — ${label}`;
  }
  if (sessionPhase === 'intake') return 'Intake';
  if (sessionPhase === 'pre-session') return 'Pre-session setup';
  if (sessionPhase === 'substance-checklist') return 'Substance checklist';
  return 'Started';
}

export default function SessionHistoryModal({ onClose, onLoad }) {
  const sessions = useSessionHistoryStore((s) => s.sessions);
  const sessionPhase = useSessionStore((s) => s.sessionPhase);
  const journalEntries = useJournalStore((s) => s.entries);

  const [expandedId, setExpandedId] = useState(null);
  const [closingId, setClosingId] = useState(null);
  const [confirmSessionId, setConfirmSessionId] = useState(null);
  const [isClosingModal, setIsClosingModal] = useState(false);

  const hasCurrentData = sessionPhase !== 'not-started' || journalEntries.length > 0;

  const handleClose = useCallback(() => {
    if (isClosingModal) return;
    setIsClosingModal(true);
    setTimeout(() => onClose(), 180);
  }, [onClose, isClosingModal]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Escape key handling
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (confirmSessionId) {
          setConfirmSessionId(null);
        } else if (expandedId) {
          handleCollapse(expandedId);
        } else {
          handleClose();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- avoids re-registering listener on every handleCollapse change
  }, [handleClose, confirmSessionId, expandedId]);

  const handleCollapse = useCallback((sessionId) => {
    setClosingId(sessionId);
    setTimeout(() => {
      setExpandedId(null);
      setClosingId(null);
    }, 500);
  }, []);

  const handleToggle = useCallback((sessionId) => {
    if (expandedId === sessionId) {
      handleCollapse(sessionId);
    } else if (expandedId) {
      // Collapse current, then expand new
      setClosingId(expandedId);
      setTimeout(() => {
        setClosingId(null);
        setExpandedId(sessionId);
      }, 500);
    } else {
      setExpandedId(sessionId);
    }
  }, [expandedId, handleCollapse]);

  const handleLoad = (sessionId) => {
    if (hasCurrentData) {
      setConfirmSessionId(sessionId);
    } else {
      // Parent (SessionMenu) wraps the load in a fade-overlay transition and closes this modal
      onLoad(sessionId);
    }
  };

  const handleConfirmLoad = () => {
    const id = confirmSessionId;
    setConfirmSessionId(null);
    // Parent (SessionMenu) wraps the load in a fade-overlay transition and closes this modal
    onLoad(id);
  };

  // Sort sessions newest first
  const sortedSessions = [...sessions].sort((a, b) => b.archivedAt - a.archivedAt);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop — separate element so it never covers content */}
      <div
        className="absolute inset-0 bg-black/25"
        onClick={handleClose}
        style={{
          animation: isClosingModal ? 'historyFadeOut 180ms ease-in forwards' : 'historyBackdropIn 180ms ease-out',
        }}
      />

      {/* Content — sits above backdrop */}
      <div
        className="relative z-10 w-full max-w-md max-h-[80vh] flex flex-col mx-auto mt-20 px-4"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: isClosingModal ? 'historyFadeOut 180ms ease-in forwards' : 'historyFadeIn 180ms ease-out' }}
      >
        {/* Accordion container */}
        <div className="overflow-y-auto" style={{ borderTop: '2px solid var(--color-text-primary)', borderLeft: '2px solid var(--color-text-primary)', borderRight: '2px solid var(--color-text-primary)', backgroundColor: 'var(--color-bg)' }}>
          {/* Header */}
          <div
            className="relative flex items-center justify-center px-4 sticky top-0 z-10"
            style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-text-primary)', minHeight: '52px' }}
          >
            <h2
              className="uppercase tracking-widest text-[11px]"
              style={{ fontFamily: 'Azeret Mono, monospace', marginBottom: 0 }}
            >
              Past Sessions
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center hover:opacity-70 transition-opacity"
              style={{ color: 'var(--color-text-tertiary)' }}
              aria-label="Close"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>

          {/* Session List */}
          {sortedSessions.length === 0 ? (
            <div
              className="px-6 py-12 text-center"
              style={{ backgroundColor: 'var(--color-bg)', borderBottom: '2px solid var(--color-text-primary)' }}
            >
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                No past sessions yet.
              </p>
            </div>
          ) : (
            sortedSessions.map((session) => {
              const { metadata, sessionState } = session;
              const displayDate = formatDate(metadata?.startedAt || session.archivedAt);
              const duration = formatDuration(metadata?.finalDurationSeconds);
              const statusLabel = getStatusLabel(metadata);
              const statusColor = getStatusColor(metadata);
              const isExpanded = expandedId === session.sessionId;
              const isClosingThis = closingId === session.sessionId;
              const isCompleted = metadata?.sessionPhase === 'completed';

              return (
                <Fragment key={session.sessionId}>
                  {/* Session Row (collapsed header) */}
                  <button
                    type="button"
                    onClick={() => handleToggle(session.sessionId)}
                    className={`w-full text-left px-4 flex items-center ${isExpanded ? 'font-medium' : ''}`}
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      color: 'var(--color-text-primary)',
                      borderBottom: '2px solid var(--color-text-primary)',
                      minHeight: '52px',
                    }}
                  >
                    <span className="flex items-center gap-2">
                      {/* Accent dot indicator */}
                      <span
                        className={`w-2 h-2 rounded-full bg-[var(--accent)] transition-opacity duration-300 flex-shrink-0 ${
                          isExpanded ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                      <span className="flex-1 flex items-center gap-2">
                        <span className="text-sm tracking-wider">{displayDate}</span>
                        <span className="text-[10px] opacity-30">—</span>
                        <span
                          className={`text-[10px] uppercase tracking-wider ${statusColor}`}
                          style={{ fontFamily: 'Azeret Mono, monospace' }}
                        >
                          {statusLabel}
                        </span>
                        {duration && (
                          <span
                            className="text-[10px] opacity-40"
                            style={{ fontFamily: 'Azeret Mono, monospace' }}
                          >
                            {duration}
                          </span>
                        )}
                      </span>
                      {/* Completed star */}
                      {isCompleted && (
                        <span className="text-[var(--accent)] text-sm flex-shrink-0">★</span>
                      )}
                    </span>
                  </button>

                  {/* Expandable Detail Panel */}
                  <div
                    className="grid relative"
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      gridTemplateRows: (isExpanded && !isClosingThis) ? '1fr' : '0fr',
                      transition: 'grid-template-rows 500ms ease-in-out',
                    }}
                  >
                    <div className="overflow-hidden">
                      {(isExpanded || isClosingThis) && (
                        <div
                          className="px-5 py-5 space-y-3"
                          style={{
                            backgroundColor: 'var(--color-bg)',
                            color: 'var(--color-text-primary)',
                            opacity: isClosingThis ? 0 : 1,
                            transition: isClosingThis
                              ? 'opacity 200ms ease-in-out'
                              : 'opacity 200ms ease-in-out 200ms',
                          }}
                        >
                          <SessionDetail
                            sessionState={sessionState}
                            metadata={metadata}
                          />

                          {/* Load button */}
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLoad(session.sessionId);
                              }}
                              className="w-full py-3 uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: 'var(--color-text-primary)', color: 'var(--color-bg)' }}
                            >
                              Load This Session
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Bottom border outside overflow-hidden so it tracks the expanding edge */}
                    {(isExpanded || isClosingThis) && (
                      <div
                        className="absolute bottom-0 left-0 right-0"
                        style={{ borderBottom: '2px solid var(--color-text-primary)' }}
                      />
                    )}
                  </div>
                </Fragment>
              );
            })
          )}
        </div>
      </div>

      {/* Load confirmation overlay */}
      {confirmSessionId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25 px-6"
          onClick={() => setConfirmSessionId(null)}
        >
          <div
            className="bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-sm p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'historyFadeIn 200ms ease-out' }}
          >
            <p className="text-[12px] uppercase tracking-wider font-bold mb-4">Load Session?</p>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Your current session will be automatically saved at its current position, including all journal entries.
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              You can switch back to it at any time from this menu.
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleConfirmLoad}
                className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
              >
                Save Current & Load
              </button>
              <button
                type="button"
                onClick={() => setConfirmSessionId(null)}
                className="w-full py-2 text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider hover:text-[var(--color-text-secondary)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes historyFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes historyFadeOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.97); }
        }
        @keyframes historyBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/**
 * SessionDetail — renders the expanded detail content for a session
 */
function SessionDetail({ sessionState, metadata }) {
  if (!sessionState) return null;

  const doseStr = formatDoseString(metadata?.dosageMg, sessionState.booster);
  const startTime = formatTime(metadata?.startedAt);
  const endTime = formatTime(metadata?.closedAt);
  const activities = countActivitiesByPhase(sessionState.modules);
  const progress = getProgressLabel(
    metadata?.sessionPhase,
    sessionState.timeline?.currentPhase
  );
  // Dual-fallback: v24 archives have sessionProfile; v23 archives still have
  // intake.responses until they're loaded and re-archived. Either shape works.
  const intention = sessionState.sessionProfile?.holdingQuestion ?? sessionState.intake?.responses?.holdingQuestion;

  const rows = [];

  if (doseStr) {
    rows.push({ label: 'Dose', value: doseStr });
  }
  if (startTime) {
    let timeStr = `start: ${startTime}`;
    if (endTime) timeStr += ` - end: ${endTime}`;
    rows.push({ label: 'Time', value: timeStr });
  }
  rows.push({ label: 'Progress', value: progress });
  if (activities) {
    rows.push({ label: 'Activities', value: activities });
  }
  if (intention) {
    rows.push({ label: 'Intention', value: intention });
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-tertiary)]">
        No session details available.
      </p>
    );
  }

  return (
    <>
      {rows.map((row) => (
        <div key={row.label}>
          <p
            className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-0.5"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {row.label}
          </p>
          <p className="text-sm text-[var(--color-text-primary)]">
            {row.value}
          </p>
        </div>
      ))}
    </>
  );
}
