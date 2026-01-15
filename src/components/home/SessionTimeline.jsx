/**
 * SessionTimeline Component
 * Displays the session timeline with current progress during active session
 * Shows phase-based view with completed, active, and upcoming modules
 */

import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';

export default function SessionTimeline() {
  const [elapsedDisplay, setElapsedDisplay] = useState('0m');

  const modules = useSessionStore((state) => state.modules);
  const timeline = useSessionStore((state) => state.timeline);
  const sessionPhase = useSessionStore((state) => state.sessionPhase);
  const getSessionProgress = useSessionStore((state) => state.getSessionProgress);
  const getCurrentModule = useSessionStore((state) => state.getCurrentModule);
  const getElapsedMinutes = useSessionStore((state) => state.getElapsedMinutes);
  const pauseSession = useSessionStore((state) => state.pauseSession);
  const resumeSession = useSessionStore((state) => state.resumeSession);

  const progress = getSessionProgress();
  const currentModule = getCurrentModule();
  const currentPhase = timeline.currentPhase;

  // Update elapsed time display
  useEffect(() => {
    const updateElapsed = () => {
      const minutes = getElapsedMinutes();
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours > 0) {
        setElapsedDisplay(`${hours}h ${mins}m`);
      } else {
        setElapsedDisplay(`${mins}m`);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000);
    return () => clearInterval(interval);
  }, [getElapsedMinutes]);

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getModuleStatus = (status) => {
    switch (status) {
      case 'completed':
        return { symbol: '+', color: 'text-green-500' };
      case 'skipped':
        return { symbol: '-', color: 'text-[var(--color-text-tertiary)]' };
      case 'active':
        return { symbol: '>', color: 'text-[var(--color-text-primary)]' };
      default:
        return { symbol: 'o', color: 'text-[var(--color-text-tertiary)]' };
    }
  };

  const getPhaseName = (phase) => {
    switch (phase) {
      case 'come-up':
        return 'Come-Up';
      case 'peak':
        return 'Peak';
      case 'integration':
        return 'Integration';
      default:
        return phase;
    }
  };

  const moduleItems = modules?.items || [];
  const comeUpModules = moduleItems.filter((m) => m.phase === 'come-up').sort((a, b) => a.order - b.order);
  const peakModules = moduleItems.filter((m) => m.phase === 'peak').sort((a, b) => a.order - b.order);
  const integrationModules = moduleItems.filter((m) => m.phase === 'integration').sort((a, b) => a.order - b.order);

  const renderPhaseSection = (phase, phaseModules) => {
    const isCurrentPhase = currentPhase === phase;
    const isPastPhase =
      (phase === 'come-up' && (currentPhase === 'peak' || currentPhase === 'integration')) ||
      (phase === 'peak' && currentPhase === 'integration');

    return (
      <div key={phase} className={`mb-6 ${isPastPhase ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`uppercase tracking-wider text-sm ${isCurrentPhase ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}`}>
            {getPhaseName(phase)}
          </h3>
          {isCurrentPhase && (
            <span className="text-xs px-2 py-1 bg-[var(--color-bg-secondary)] rounded">
              Current
            </span>
          )}
        </div>

        {phaseModules.length === 0 ? (
          <p className="text-[var(--color-text-tertiary)] text-sm py-2">
            No activities scheduled
          </p>
        ) : (
          <div className="space-y-2">
            {phaseModules.map((module) => {
              const status = getModuleStatus(module.status);
              const isActive = module.instanceId === currentModule?.instanceId;

              return (
                <div
                  key={module.instanceId}
                  className={`flex items-center space-x-3 py-2 px-3 transition-colors ${
                    isActive ? 'bg-[var(--color-bg-secondary)] border-l-2 border-[var(--color-text-primary)]' : ''
                  }`}
                >
                  <span className={`font-mono ${status.color}`}>
                    {status.symbol}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`truncate ${isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                      {module.title}
                    </p>
                  </div>
                  <span className="text-[var(--color-text-tertiary)] text-sm">
                    {formatTime(module.duration)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto px-6 py-8">
      {/* Session header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-serif text-lg">Session Timeline</h2>
          {sessionPhase === 'active' ? (
            <button
              onClick={pauseSession}
              className="px-3 py-1 uppercase tracking-wider border border-[var(--color-border)] hover:opacity-70 transition-opacity"
            >
              Pause
            </button>
          ) : sessionPhase === 'paused' ? (
            <button
              onClick={resumeSession}
              className="px-3 py-1 uppercase tracking-wider bg-[var(--color-text-primary)] text-[var(--color-bg)] hover:opacity-80 transition-opacity"
            >
              Resume
            </button>
          ) : null}
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[var(--color-text-tertiary)] mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}% - {elapsedDisplay} elapsed</span>
          </div>
          <div className="w-full bg-[var(--color-border)] h-px">
            <div
              className="bg-[var(--color-text-primary)] h-px transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current phase indicator */}
        <div className="flex items-center space-x-4 mb-4">
          <PhaseIndicator label="Come-Up" active={currentPhase === 'come-up'} completed={currentPhase !== 'come-up'} />
          <span className="text-[var(--color-text-tertiary)]">→</span>
          <PhaseIndicator label="Peak" active={currentPhase === 'peak'} completed={currentPhase === 'integration'} />
          <span className="text-[var(--color-text-tertiary)]">→</span>
          <PhaseIndicator label="Integration" active={currentPhase === 'integration'} />
        </div>

        {/* Current module highlight */}
        {currentModule && sessionPhase === 'active' && (
          <div className="p-4 border-l-2 border-[var(--color-text-primary)] bg-[var(--color-bg-secondary)]">
            <p className="uppercase tracking-wider text-[var(--color-text-tertiary)] text-xs mb-1">
              Now Active
            </p>
            <p className="text-[var(--color-text-primary)]">
              {currentModule.title}
            </p>
            <p className="text-[var(--color-text-tertiary)] text-sm">
              {formatTime(currentModule.duration)}
            </p>
          </div>
        )}

        {sessionPhase === 'paused' && (
          <div className="p-4 border border-[var(--color-border)]">
            <p className="text-[var(--color-text-secondary)]">
              Session paused. Resume when you're ready to continue.
            </p>
          </div>
        )}
      </div>

      {/* Phase sections */}
      <div className="border-t border-[var(--color-border)] pt-6">
        {renderPhaseSection('come-up', comeUpModules)}
        {renderPhaseSection('peak', peakModules)}
        {renderPhaseSection('integration', integrationModules)}
      </div>

      {/* Session actions */}
      <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
        <p className="text-[var(--color-text-tertiary)] text-center">
          Go to the Active tab to engage with your current module
        </p>
      </div>
    </div>
  );
}

function PhaseIndicator({ label, active, completed }) {
  return (
    <div className={`text-sm ${active ? 'text-[var(--color-text-primary)]' : completed ? 'text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-tertiary)]'}`}>
      <span className={active ? 'font-medium' : ''}>{label}</span>
      {active && <span className="ml-1">●</span>}
      {completed && !active && <span className="ml-1">✓</span>}
    </div>
  );
}
