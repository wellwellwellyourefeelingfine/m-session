/**
 * TranscriptModal Component
 *
 * Full-screen scrollable modal showing the complete text of a guided meditation.
 * Follows the same pattern as AllRecommendationsModal in MusicListeningModule.
 * Pure UI overlay — has no interaction with audio playback state.
 */

import { useState, useEffect, useCallback } from 'react';

export const FADE_MS = 400;

export function TranscriptIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="1" width="10" height="14" rx="1" />
      <line x1="5.5" y1="4.5" x2="10.5" y2="4.5" />
      <line x1="5.5" y1="7" x2="10.5" y2="7" />
      <line x1="5.5" y1="9.5" x2="8.5" y2="9.5" />
    </svg>
  );
}

export default function TranscriptModal({ isOpen, closing, onClose, title, prompts }) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    setEntered(false);
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleExport = useCallback(() => {
    if (!prompts?.length) return;
    const text = `${title}\n\n${prompts.map((p) => p.text).join('\n\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-').toLowerCase()}-transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [title, prompts]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-[var(--color-bg)] flex flex-col"
      style={{
        opacity: closing ? 0 : entered ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: closing ? 'none' : 'auto',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))',
          paddingBottom: '0.75rem',
        }}
      >
        <button
          onClick={onClose}
          className="text-[var(--color-text-secondary)] text-sm w-8 h-8 flex items-center justify-center"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
          Transcript
        </span>
        <button
          onClick={handleExport}
          className="text-[var(--color-text-secondary)] text-sm w-8 h-8 flex items-center justify-center"
          title="Save transcript"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 1v9" />
            <path d="M3.5 7L7 10.5 10.5 7" />
            <line x1="2" y1="13" x2="12" y2="13" />
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-6 pb-12 pt-2 max-w-sm mx-auto">
          <h2
            className="text-[var(--color-text-primary)] text-lg mb-6 text-center"
            style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
          >
            {title}
          </h2>

          <div className="space-y-4">
            {prompts?.map((prompt, index) => (
              <p
                key={prompt.id || index}
                className="text-[var(--color-text-secondary)] text-sm leading-relaxed"
                style={{ textTransform: 'none' }}
              >
                {prompt.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
