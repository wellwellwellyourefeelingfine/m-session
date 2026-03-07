/**
 * ClockNoteModal Component
 * Near-full-screen modal for capturing timestamped notes during active sessions.
 * Opens when user taps the large elapsed time clock.
 * Saves notes to journal with "CLOCK NOTE — HH:MM:SS" as the title.
 * Includes PNG export via canvas for saving to device photos.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { useSessionStore } from '../../stores/useSessionStore';

/**
 * Export clock note as a PNG image via canvas
 */
async function exportClockNoteAsPNG(frozenTime, noteText) {
  const scale = 3;
  const WIDTH = 390;
  const SIDE_PAD = 28;
  const TEXT_WIDTH = WIDTH - SIDE_PAD * 2;

  const isDark = document.documentElement.classList.contains('dark');
  const bg = isDark ? '#1A1A1A' : '#F5F5F0';
  const textPrimary = isDark ? '#E5E5E5' : '#3A3A3A';
  const textSecondary = isDark ? '#AAAAAA' : '#777777';
  const textTertiary = isDark ? '#666666' : '#999999';
  const border = isDark ? '#333333' : '#D0D0D0';

  await document.fonts.ready;

  // Measure height needed for word-wrapped note
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  measureCtx.font = '14px monospace';

  const lineHeight = 20;
  const lines = [];
  if (noteText.trim()) {
    const paragraphs = noteText.split('\n');
    for (const paragraph of paragraphs) {
      if (paragraph.trim() === '') {
        lines.push('');
        continue;
      }
      const words = paragraph.split(' ');
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (measureCtx.measureText(testLine).width > TEXT_WIDTH) {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
    }
  }

  // Calculate total height
  const HEADER_Y = 60;       // timestamp top
  const PROMPT_Y = 100;      // prompt text
  const DIVIDER_Y = 125;     // divider line
  const NOTE_START_Y = 148;  // note text start
  const noteHeight = Math.max(lines.length * lineHeight, 40);
  const FOOTER_Y = NOTE_START_Y + noteHeight + 30;
  const TOTAL_HEIGHT = FOOTER_Y + 30;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH * scale;
  canvas.height = TOTAL_HEIGHT * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, TOTAL_HEIGHT);

  // Frozen timestamp
  ctx.fillStyle = textPrimary;
  ctx.font = '32px "DM Serif Text", serif';
  ctx.textAlign = 'center';
  ctx.fillText(frozenTime, WIDTH / 2, HEADER_Y);

  // Prompt text
  ctx.fillStyle = textSecondary;
  ctx.font = '12px monospace';
  ctx.fillText('note what\'s happening now:', WIDTH / 2, PROMPT_Y);

  // Divider
  ctx.strokeStyle = border;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(SIDE_PAD, DIVIDER_Y);
  ctx.lineTo(WIDTH - SIDE_PAD, DIVIDER_Y);
  ctx.stroke();

  // Note text (word-wrapped)
  ctx.fillStyle = textPrimary;
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], SIDE_PAD, NOTE_START_Y + i * lineHeight);
  }

  // Footer
  ctx.fillStyle = textTertiary;
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  ctx.fillText(
    `CLOCK NOTE · ${now.toLocaleDateString()} · ${timeStr}`,
    WIDTH / 2,
    FOOTER_Y
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

export default function ClockNoteModal({ _isOpen, onClose, frozenTime }) {
  const [noteText, setNoteText] = useState('');
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const textareaRef = useRef(null);

  const addEntry = useJournalStore((state) => state.addEntry);
  const sessionId = useSessionStore((state) => state.session?.id);

  // Fade in on mount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setEntered(true);
      });
    });
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Auto-focus textarea after fade-in
  useEffect(() => {
    if (entered && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [entered]);

  // Save note to journal
  const saveNote = useCallback(() => {
    const trimmed = noteText.trim();
    if (!trimmed) return;

    const content = `CLOCK NOTE — ${frozenTime}\n\n${trimmed}`;
    addEntry({
      content,
      source: 'session',
      sessionId: sessionId || null,
      moduleTitle: `Clock Note — ${frozenTime}`,
    });
  }, [noteText, frozenTime, addEntry, sessionId]);

  // Single close handler — auto-saves, then fades out
  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);

    saveNote();

    setTimeout(() => {
      onClose();
    }, 300);
  }, [saveNote, onClose]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // Export as PNG
  const handleExport = async () => {
    try {
      const blob = await exportClockNoteAsPNG(frozenTime, noteText);
      const file = new File([blob], `clock-note-${frozenTime.replace(/:/g, '-')}.png`, {
        type: 'image/png',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        // Desktop fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // User cancelled share — that's fine
    }
  };

  const opacity = entered && !closing ? 1 : 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ transition: 'opacity 300ms ease', opacity }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={handleClose}
      />

      {/* Content */}
      <div
        className="relative flex flex-col bg-[var(--color-bg)] border border-[var(--color-border)] rounded-sm"
        style={{
          width: 'calc(100% - 48px)',
          height: 'calc(100% - 250px)',
          maxWidth: 430,
          maxHeight: 682,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
          {/* X close button (left) */}
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Export button (right) */}
          <button
            onClick={handleExport}
            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Export as image"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 10V12.5C3 12.776 3.224 13 3.5 13H12.5C12.776 13 13 12.776 13 12.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 3V10M8 3L5 6M8 3L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Frozen timestamp */}
        <div className="text-center px-4 pt-2 pb-1 flex-shrink-0">
          <p
            className="text-4xl text-[var(--color-text-primary)]"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {frozenTime}
          </p>
        </div>

        {/* Textarea */}
        <div className="flex-1 px-4 py-3 min-h-0">
          <textarea
            ref={textareaRef}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full h-full bg-transparent text-[var(--color-text-primary)] resize-none outline-none text-sm leading-relaxed"
            placeholder="Note what's happening now..."
            style={{ fontFamily: 'monospace' }}
          />
        </div>

        {/* Save button */}
        <div className="flex justify-center pb-8 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-[10px] rounded-sm shadow-lg active:scale-95 transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
