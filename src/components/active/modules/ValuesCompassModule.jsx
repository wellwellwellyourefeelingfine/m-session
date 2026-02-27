/**
 * ValuesCompassModule Component
 *
 * An ACT Matrix exercise with progressive quadrant building:
 * 1. Introduction (5 screens — overview, quadrants, axes, placement, big picture)
 * 2. Four quadrant-building phases — add chips via free-text or examples, drag to position
 * 3. Matrix reveal — full-screen modal with assembled 4-quadrant view
 * 4. Journaling (observer-self interstitial + 8 screens)
 * 5. Closing screen
 *
 * No audio/meditation component. Self-paced, ~20-30 minutes.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useJournalStore } from '../../../stores/useJournalStore';
import { useSessionStore } from '../../../stores/useSessionStore';

import ModuleLayout from '../capabilities/ModuleLayout';
import ModuleControlBar, { SlotButton } from '../capabilities/ModuleControlBar';
import CompassAnimation from '../capabilities/animations/Compass';
import RevealOverlay from '../capabilities/animations/RevealOverlay';

import {
  INTRO_SCREENS,
  QUADRANT_CONFIG,
  QUADRANT_ORDER,
  REVEAL_CONTENT,
  OBSERVER_SELF_CONTENT,
  JOURNALING_SCREENS,
  CLOSING_CONTENT,
  AXIS_LABELS,
  QUADRANT_LABELS,
} from '../../../content/modules/valuesCompassContent';

import { saveImage } from '../../../utils/imageStorage';

// Shared matrix components (extracted for reuse in follow-up modules)
import DraggableChip from './shared/matrix/DraggableChip';
import MatrixGrid from './shared/matrix/MatrixGrid';
import MatrixModal, { QuadrantWorkArea, ReferenceChips, ViewMatrixIcon } from './shared/matrix/MatrixModal';
import { MatrixSchematic, FocusedMatrixSchematic } from './shared/matrix/MatrixSchematics';
import LoopArrowAnimation from './shared/matrix/LoopArrowAnimation';
import { exportMatrixAsPNG } from './shared/matrix/exportMatrixAsPNG';

// ─── Constants ──────────────────────────────────────────────────────────────

const FADE_MS = 400;
const PHASE_SEQUENCE = [
  'idle', 'intro-a', 'intro-b', 'intro-c', 'intro-d', 'intro-e',
  'q1', 'q1-transition',
  'q2', 'q2-transition',
  'q3', 'q3-transition',
  'q4', 'q4-transition',
  'reveal-prompt', 'reveal-modal',
  'observer-self',
  'journal-a', 'journal-b', 'journal-c', 'journal-d', 'journal-e', 'journal-f', 'journal-g', 'journal-h',
  'closing',
];

// ─── Render helpers ─────────────────────────────────────────────────────────

function renderContentLines(lines, { small, spaced } = {}) {
  const textClass = small
    ? 'text-[var(--color-text-primary)] text-xs leading-relaxed'
    : 'text-[var(--color-text-primary)] text-sm leading-relaxed';

  return (
    <div className={spaced ? 'space-y-2' : 'space-y-0'}>
      {lines.map((line, i) => {
        if (line === '§') {
          return (
            <div key={i} className="flex justify-center my-4">
              <div className="circle-spacer" />
            </div>
          );
        }
        // Structured line with serif title + body
        if (typeof line === 'object' && line.title) {
          return (
            <p key={i} className={textClass}>
              <span className="font-serif text-sm text-[var(--accent)]">{line.title}</span>{' '}
              {line.body}
            </p>
          );
        }
        return (
          <p key={i} className={textClass}>
            {line}
          </p>
        );
      })}
    </div>
  );
}

const PLACEMENT_DESCRIPTIONS = {
  q1: 'Items in the far bottom-right are your deepest internal values and the most powerful \u201CNorth Stars\u201D for moving you toward the life you want.',
  q2: 'Items in the far bottom-left are your core hooks\u2014the oldest, deepest internal stories that most strongly push you toward defensive reactions.',
  q3: 'Items in the far top-left are your strongest avoidance habits, representing significant energy spent trying to escape discomfort.',
  q4: 'Items in the far top-right are your boldest actions, representing moments where you are most actively living out your values.',
};

// ─── exportMatrixAsPNG — imported from shared/matrix/exportMatrixAsPNG ───────

// ─── ViewMatrixIcon — imported from shared/matrix/MatrixModal ────────────────

// ─── MatrixSchematic, FocusedMatrixSchematic — imported from shared/matrix/MatrixSchematics

// ─── Focused Single Quadrant (zoomed view of one quadrant with chips) ────────

function FocusedSingleQuadrant({ quadrantId, quadrants }) {
  const containerRef = useRef(null);
  const chips = quadrants[quadrantId] || [];

  return (
    <div className="relative max-w-[60vw] mx-auto" style={{ aspectRatio: '1 / 1' }}>
      {/* Subtle gradient */}
      <div
        className="absolute inset-0 pointer-events-none rounded-sm"
        style={{
          background: 'radial-gradient(circle at 50% 50%, var(--accent) 0%, transparent 70%)',
          opacity: 0.08,
        }}
      />

      {/* Quadrant label */}
      <span
        className="absolute top-2 left-2 font-serif text-[11px] tracking-wide pointer-events-none opacity-60"
        style={{ color: 'var(--color-text-secondary)', textTransform: 'none' }}
      >
        {QUADRANT_LABELS[quadrantId]}
      </span>

      {/* Chips */}
      <div ref={containerRef} className="absolute inset-0 overflow-visible">
        {chips.map((chip) => (
          <DraggableChip
            key={chip.id}
            chip={chip}
            onMove={undefined}
            onRemove={null}
            containerRef={containerRef}
            disabled
            editMode={false}
            matrixView
          />
        ))}
      </div>

      {/* Border edges to indicate position in matrix */}
      {(quadrantId === 'q3' || quadrantId === 'q4') && (
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '1px', backgroundColor: 'color-mix(in srgb, var(--accent) 25%, transparent)' }} />
      )}
      {(quadrantId === 'q1' || quadrantId === 'q2') && (
        <div className="absolute top-0 left-0 right-0" style={{ height: '1px', backgroundColor: 'color-mix(in srgb, var(--accent) 25%, transparent)' }} />
      )}
      {(quadrantId === 'q3' || quadrantId === 'q2') && (
        <div className="absolute top-0 right-0 bottom-0" style={{ width: '1px', backgroundColor: 'color-mix(in srgb, var(--accent) 25%, transparent)' }} />
      )}
      {(quadrantId === 'q4' || quadrantId === 'q1') && (
        <div className="absolute top-0 left-0 bottom-0" style={{ width: '1px', backgroundColor: 'color-mix(in srgb, var(--accent) 25%, transparent)' }} />
      )}
    </div>
  );
}

// ─── LoopArrowAnimation — imported from shared/matrix/LoopArrowAnimation ─────

// ─── Cross-Quadrant Arrow (diagonal tension line) ───────────────────────────

function CrossQuadrantArrow({ visible }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms ease',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        style={{ color: 'var(--accent)' }}
      >
        {/* Diagonal line */}
        <line
          className="vc-cross-draw"
          x1="25" y1="25" x2="75" y2="75"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Chevron arrowhead at bottom-right (pointing down-right) */}
        <polyline
          className="vc-cross-head"
          points="69,79 76,76 79,69"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Chevron arrowhead at top-left (pointing up-left) */}
        <polyline
          className="vc-cross-head"
          points="31,21 24,24 21,31"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <style>{`
        .vc-cross-draw {
          stroke-dasharray: 72;
          stroke-dashoffset: 72;
          animation: vc-cross-draw-in 1s ease-out forwards;
        }
        .vc-cross-head {
          opacity: 0;
          animation: vc-cross-head-in 300ms ease-out 900ms forwards;
        }
        @keyframes vc-cross-draw-in {
          to { stroke-dashoffset: 0; }
        }
        @keyframes vc-cross-head-in {
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Tension Schematic (full matrix with highlighted quadrants) ──────────────

function TensionSchematic() {
  return (
    <div className="relative w-full aspect-square max-w-[240px] mx-auto">
      {/* Highlighted quadrants: top-left (q3) and bottom-right (q1) */}
      <div
        className="absolute top-0 left-0 w-1/2 h-1/2 rounded-tl-sm"
        style={{ backgroundColor: 'var(--accent)', opacity: 0.08 }}
      />
      <div
        className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-br-sm"
        style={{ backgroundColor: 'var(--accent)', opacity: 0.08 }}
      />

      {/* Vertical axis line */}
      <div
        className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2"
        style={{ width: '1px', backgroundColor: 'color-mix(in srgb, var(--accent) 35%, transparent)' }}
      />
      {/* Horizontal axis line */}
      <div
        className="absolute top-1/2 left-0 right-0 -translate-y-1/2"
        style={{ height: '1px', backgroundColor: 'color-mix(in srgb, var(--accent) 35%, transparent)' }}
      />

      {/* Quadrant labels */}
      <span className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 font-serif text-sm text-[var(--color-text-primary)] text-center leading-tight" style={{ textTransform: 'none' }}>
        Away<br />Moves
      </span>
      <span className="absolute top-1/4 left-3/4 -translate-x-1/2 -translate-y-1/2 font-serif text-sm text-[var(--color-text-primary)] text-center leading-tight" style={{ textTransform: 'none' }}>
        Toward<br />Moves
      </span>
      <span className="absolute top-3/4 left-1/4 -translate-x-1/2 -translate-y-1/2 font-serif text-sm text-[var(--color-text-primary)] text-center leading-tight" style={{ textTransform: 'none' }}>
        Inner<br />Obstacles
      </span>
      <span className="absolute top-3/4 left-3/4 -translate-x-1/2 -translate-y-1/2 font-serif text-sm text-[var(--color-text-primary)] text-center leading-tight" style={{ textTransform: 'none' }}>
        What<br />Matters
      </span>

      {/* Axis labels */}
      <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-1 text-[9px] text-[var(--color-text-primary)] uppercase tracking-wider">
        Actions
      </span>
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-1 text-[9px] text-[var(--color-text-primary)] uppercase tracking-wider whitespace-nowrap">
        Inner Experience
      </span>
      <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-1.5 text-[9px] text-[var(--color-text-primary)] uppercase tracking-wider">
        Away
      </span>
      <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-1.5 text-[9px] text-[var(--color-text-primary)] uppercase tracking-wider">
        Toward
      </span>
    </div>
  );
}

// ─── Animation Icon (eye open/closed toggle) ────────────────────────────────

function AnimationIcon({ visible }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {visible ? (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  );
}

// ─── Schematic Modal (shows matrix key before reveal) ────────────────────────

function SchematicModal({ isOpen, closing, onClose }) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Trigger fade-in on next frame
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    setEntered(false);
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

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
          Matrix Key
        </span>
        <div className="w-8" />
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="min-h-full px-6 py-6 flex flex-col items-center">
          <div className="my-auto w-full flex flex-col items-center">
            {/* Top definitions: Toward Moves, then Away Moves */}
            <div className="w-full max-w-[320px] space-y-3 mb-10 text-left">
              <div>
                <span className="font-serif text-[14px] text-[var(--accent)]">Toward Moves</span>
                <p className="text-[12px] text-[var(--color-text-secondary)] leading-snug mt-0.5">
                  Items in the far top-right are your boldest actions, representing moments where you are most actively living out your values.
                </p>
              </div>
              <div>
                <span className="font-serif text-[14px] text-[var(--accent)]">Away Moves</span>
                <p className="text-[12px] text-[var(--color-text-secondary)] leading-snug mt-0.5">
                  Items in the far top-left are your strongest avoidance habits, representing significant energy spent trying to escape discomfort.
                </p>
              </div>
            </div>

            <MatrixSchematic maxWidth="max-w-[240px]" />

            {/* Bottom definitions: What Matters, then Inner Obstacles */}
            <div className="w-full max-w-[320px] space-y-3 mt-14 text-left">
              <div>
                <span className="font-serif text-[14px] text-[var(--accent)]">What Matters</span>
                <p className="text-[12px] text-[var(--color-text-secondary)] leading-snug mt-0.5">
                  Items in the far bottom-right are your deepest internal values and the most powerful {'\u201C'}North Stars{'\u201D'} for moving you toward the life you want.
                </p>
              </div>
              <div>
                <span className="font-serif text-[14px] text-[var(--accent)]">Inner Obstacles</span>
                <p className="text-[12px] text-[var(--color-text-secondary)] leading-snug mt-0.5">
                  Items in the far bottom-left are your core hooks{'\u2014'}the oldest, deepest internal stories that most strongly push you toward defensive reactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Module Component ──────────────────────────────────────────────────

export default function ValuesCompassModule({ onComplete, onSkip, onTimerUpdate }) {
  // ── Phase state ──
  const [phase, setPhase] = useState('idle');
  const [isVisible, setIsVisible] = useState(true);

  // ── Quadrant data ──
  const [quadrants, setQuadrants] = useState({ q1: [], q2: [], q3: [], q4: [] });

  // ── Journal text ──
  const [journalFirstImpression, setJournalFirstImpression] = useState('');
  const [journalStuckLoop, setJournalStuckLoop] = useState('');
  const [journalVitalLoop, setJournalVitalLoop] = useState('');
  const [journalTension, setJournalTension] = useState('');
  const [journalTowardMove, setJournalTowardMove] = useState('');
  const [journalCompassion, setJournalCompassion] = useState('');
  const [journalWholeness, setJournalWholeness] = useState('');
  const [journalMessageFromHere, setJournalMessageFromHere] = useState('');

  // ── Animation toggle state (per-screen) ──
  const [showStuckLoopArrows, setShowStuckLoopArrows] = useState(true);
  const [showVitalLoopArrows, setShowVitalLoopArrows] = useState(true);
  const [showTensionArrow, setShowTensionArrow] = useState(true);
  // ── Matrix modal ──
  const [showMatrix, setShowMatrix] = useState(false);
  const [matrixClosing, setMatrixClosing] = useState(false);
  const [showRevealOverlay, setShowRevealOverlay] = useState(false);
  const [revealKey, setRevealKey] = useState(0);

  // ── Schematic modal (pre-reveal matrix key) ──
  const [showSchematic, setShowSchematic] = useState(false);
  const [schematicClosing, setSchematicClosing] = useState(false);

  // ── Store hooks ──
  const addEntry = useJournalStore((s) => s.addEntry);
  const ingestionTime = useSessionStore((s) => s.substanceChecklist.ingestionTime);
  const updateCapture = useSessionStore((s) => s.updateValuesCompassCapture);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;

  // ── Hide timer for all phases ──
  useEffect(() => {
    onTimerUpdate?.({ showTimer: false, progress: 0, elapsed: 0, total: 0, isPaused: false });
  }, [onTimerUpdate]);

  // ── Phase transitions ──
  const fadeToPhase = useCallback((nextPhase) => {
    setIsVisible(false);
    setTimeout(() => {
      window.scrollTo(0, 0);
      setPhase(nextPhase);
      setIsVisible(true);
    }, FADE_MS);
  }, []);

  // ── Chip management ──
  const addChip = useCallback((quadrantId, text) => {
    const chip = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      x: 0.2 + Math.random() * 0.5,
      y: 0.2 + Math.random() * 0.5,
    };
    setQuadrants((prev) => ({
      ...prev,
      [quadrantId]: [...prev[quadrantId], chip],
    }));
  }, []);

  const moveChip = useCallback((quadrantId, chipId, x, y) => {
    setQuadrants((prev) => ({
      ...prev,
      [quadrantId]: prev[quadrantId].map((c) =>
        c.id === chipId ? { ...c, x, y } : c
      ),
    }));
  }, []);

  const removeChip = useCallback((quadrantId, chipId) => {
    setQuadrants((prev) => ({
      ...prev,
      [quadrantId]: prev[quadrantId].filter((c) => c.id !== chipId),
    }));
  }, []);

  const updateChipPosition = useCallback((quadrantId, chipId, x, y) => {
    moveChip(quadrantId, chipId, x, y);
  }, [moveChip]);

  // ── Journal save ──
  const saveJournalEntry = useCallback(async () => {
    let content = 'VALUES COMPASS\n';
    let hasContent = false;
    const hasQuadrantData = QUADRANT_ORDER.some((qId) => quadrants[qId].length > 0);

    const quadrantLabels = {
      q1: 'What Matters',
      q2: 'What Gets in the Way',
      q3: 'What I Do When Hooked',
      q4: 'What I\'d Do Instead',
    };

    for (const qId of QUADRANT_ORDER) {
      const chips = quadrants[qId];
      if (chips.length > 0) {
        content += `\n${quadrantLabels[qId]}:\n`;
        chips.forEach((c) => { content += `  - ${c.text}\n`; });
        hasContent = true;
      }
    }

    const journalSections = [
      { value: journalFirstImpression, label: 'First impression' },
      { value: journalStuckLoop, label: 'The stuck loop' },
      { value: journalVitalLoop, label: 'The vital loop' },
      { value: journalTension, label: 'The tension' },
      { value: journalTowardMove, label: 'One toward move' },
      { value: journalCompassion, label: 'Self-compassion note' },
      { value: journalWholeness, label: 'Wholeness' },
      { value: journalMessageFromHere, label: 'A message from here' },
    ];

    for (const { value, label } of journalSections) {
      if (value.trim()) {
        content += `\n${label}:\n${value.trim()}\n`;
        hasContent = true;
      }
    }

    if (hasContent) {
      const entry = addEntry({
        content: content.trim(),
        source: 'session',
        sessionId,
        moduleTitle: 'Values Compass',
        hasImage: hasQuadrantData,
      });

      // Generate and save matrix PNG to IndexedDB
      if (hasQuadrantData) {
        try {
          const blob = await exportMatrixAsPNG(quadrants);
          await saveImage(entry.id, blob);
        } catch (err) {
          console.warn('Failed to save matrix image:', err);
        }
      }
    }

    // Save quadrant data to store for potential reconstruction
    updateCapture('quadrants', quadrants);
    updateCapture('completedAt', Date.now());
    updateCapture('journalTowardMove', journalTowardMove);
    updateCapture('journalMessageFromHere', journalMessageFromHere);
  }, [quadrants, journalFirstImpression, journalStuckLoop, journalVitalLoop, journalTension, journalTowardMove, journalCompassion, journalWholeness, journalMessageFromHere, addEntry, sessionId, updateCapture]);

  // ── Completion ──
  const handleComplete = useCallback(async () => {
    await saveJournalEntry();
    onComplete();
  }, [saveJournalEntry, onComplete]);

  const handleSkip = useCallback(async () => {
    await saveJournalEntry();
    onSkip();
  }, [saveJournalEntry, onSkip]);

  // ── Current quadrant helper ──
  const currentQuadrantId = phase.startsWith('q') && !phase.includes('transition') ? phase : null;
  const currentQuadrantConfig = currentQuadrantId ? QUADRANT_CONFIG[currentQuadrantId] : null;
  const currentQuadrantChips = currentQuadrantId ? quadrants[currentQuadrantId] : [];


  // ── Previous quadrants for reference chips ──
  const previousQuadrants = useMemo(() => {
    const idx = QUADRANT_ORDER.indexOf(currentQuadrantId);
    return idx > 0 ? QUADRANT_ORDER.slice(0, idx) : [];
  }, [currentQuadrantId]);

  // ── Reveal sequence ──
  const revealTimerRef = useRef(null);

  const handleReveal = useCallback(() => {
    // Clear any pending timer from a previous reveal
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    // Ensure matrix is hidden, then start fresh overlay (key forces remount)
    setShowMatrix(false);
    setRevealKey((k) => k + 1);
    setShowRevealOverlay(true);
    // Delay matrix open until overlay is fully opaque (~900ms after fade-in starts)
    revealTimerRef.current = setTimeout(() => setShowMatrix(true), 900);
  }, []);

  const handleRevealDone = useCallback(() => {
    setShowRevealOverlay(false);
    setPhase('reveal-modal');
  }, []);

  const matrixCloseTimerRef = useRef(null);

  const handleCloseMatrix = useCallback(() => {
    // Hide underlying content immediately so it doesn't show through the fading modal
    setIsVisible(false);
    setMatrixClosing(true);
    if (matrixCloseTimerRef.current) clearTimeout(matrixCloseTimerRef.current);
    matrixCloseTimerRef.current = setTimeout(() => {
      setShowMatrix(false);
      setMatrixClosing(false);
      // Jump to observer-self interstitial and fade it in (no double-fade)
      setPhase('observer-self');
      setIsVisible(true);
    }, FADE_MS);
  }, []);

  // ── View Matrix in journaling phases ──
  const handleViewMatrix = useCallback(() => {
    setShowMatrix(true);
  }, []);

  const handleCloseMatrixView = useCallback(() => {
    // Fade out the modal overlay smoothly
    setMatrixClosing(true);
    if (matrixCloseTimerRef.current) clearTimeout(matrixCloseTimerRef.current);
    matrixCloseTimerRef.current = setTimeout(() => {
      setShowMatrix(false);
      setMatrixClosing(false);
    }, FADE_MS);
  }, []);

  // ── Schematic modal (matrix key) ──
  const schematicCloseTimerRef = useRef(null);

  const handleViewSchematic = useCallback(() => {
    setShowSchematic(true);
  }, []);

  const handleCloseSchematic = useCallback(() => {
    setSchematicClosing(true);
    if (schematicCloseTimerRef.current) clearTimeout(schematicCloseTimerRef.current);
    schematicCloseTimerRef.current = setTimeout(() => {
      setShowSchematic(false);
      setSchematicClosing(false);
    }, FADE_MS);
  }, []);

  // Determine if we've passed the reveal point
  const hasRevealed = useMemo(() => {
    const revealIdx = PHASE_SEQUENCE.indexOf('reveal-modal');
    const currentIdx = PHASE_SEQUENCE.indexOf(phase);
    return currentIdx >= revealIdx;
  }, [phase]);

  // ── Journal text getters/setters ──
  const journalState = {
    'first-impression': [journalFirstImpression, setJournalFirstImpression],
    'stuck-loop': [journalStuckLoop, setJournalStuckLoop],
    'vital-loop': [journalVitalLoop, setJournalVitalLoop],
    'tension': [journalTension, setJournalTension],
    'toward-move': [journalTowardMove, setJournalTowardMove],
    'compassion': [journalCompassion, setJournalCompassion],
    'wholeness': [journalWholeness, setJournalWholeness],
    'message-from-here': [journalMessageFromHere, setJournalMessageFromHere],
  };

  // ── Back navigation ──
  const getBackPhase = useCallback(() => {
    const idx = PHASE_SEQUENCE.indexOf(phase);
    if (idx <= 0) return null;
    // Skip transition phases when going back
    let target = idx - 1;
    while (target > 0 && PHASE_SEQUENCE[target].includes('transition')) {
      target--;
    }
    return PHASE_SEQUENCE[target];
  }, [phase]);

  const handleBack = useCallback(() => {
    const backPhase = getBackPhase();
    if (backPhase) fadeToPhase(backPhase);
  }, [getBackPhase, fadeToPhase]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  const renderContent = () => {
    // ── Idle ──
    if (phase === 'idle') {
      return (
        <div className="text-center animate-fadeIn">
          <h2 className="font-serif text-2xl text-[var(--color-text-primary)] mb-4 normal-case">
            Values Compass
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-14">
            A visual guide to noticing your inner world and choosing actions that align with the person you want to be.
          </p>
          <MatrixSchematic />
          <p className="text-[var(--color-text-tertiary)] text-xs mt-14">
            Based on the ACT Matrix therapeutic model
          </p>
        </div>
      );
    }

    // ── Intro screens ──
    if (phase.startsWith('intro-')) {
      const introIndex = { 'intro-a': 0, 'intro-b': 1, 'intro-c': 2, 'intro-d': 3, 'intro-e': 4 }[phase];
      const screen = INTRO_SCREENS[introIndex];
      if (!screen) return null;

      // Page 1: compass animation + lines (original format)
      if (phase === 'intro-a') {
        return (
          <div className="space-y-0">
            <h2 className="font-serif text-xl text-[var(--color-text-primary)] mb-3 normal-case text-center">
              Values Compass
            </h2>
            <div className="flex justify-center pb-3">
              <CompassAnimation />
            </div>
            {renderContentLines(screen.lines, { small: true })}
          </div>
        );
      }

      // Pages 2-5: structured format with optional header, schematic, tip
      const schematicMaxW =
        screen.schematic === 'full' ? 'max-w-[280px]' :
        screen.schematic === 'axes-only' ? 'max-w-[180px]' :
        'max-w-[220px]';
      const schematicPadding =
        screen.schematic === 'quadrants-only' ? 'py-2' :
        screen.schematic === 'axes-only' ? 'py-10' :
        'py-8';
      return (
        <div
          className={`space-y-4 ${screen.showKeyTip ? 'pb-16' : ''}`}
          style={{ minHeight: 'calc(100vh - var(--header-height) - var(--bottom-chrome) - 4rem)' }}
        >
          {screen.header && (
            <h2 className="font-serif text-xl text-[var(--color-text-primary)] normal-case text-center mb-2">
              {screen.header}
            </h2>
          )}
          {screen.topLines && renderContentLines(screen.topLines, { small: true, spaced: screen.spaced })}
          {screen.schematic && (
            <div className={schematicPadding}>
              <MatrixSchematic
                variant={screen.schematic === 'full' ? 'full' : screen.schematic}
                maxWidth={schematicMaxW}
              />
            </div>
          )}
          {screen.bottomLines && renderContentLines(screen.bottomLines, { small: true, spaced: screen.spaced })}
          {screen.lines && renderContentLines(screen.lines, { small: true, spaced: screen.spaced })}
          {screen.showKeyTip && (
            <p className="text-[10px] text-[var(--color-text-tertiary)] text-center normal-case mt-6">
              Tip: You can view the Matrix Key at any time by pressing the{' '}
              <ViewMatrixIcon inline /> button in the bottom right of the control bar.
            </p>
          )}
        </div>
      );
    }

    // ── Quadrant building phases ──
    if (currentQuadrantId && currentQuadrantConfig) {
      return (
        <div className="space-y-4 pb-28">
          {/* Reference chips from previous quadrants */}
          <ReferenceChips quadrants={quadrants} showQuadrants={previousQuadrants} />

          {/* Title */}
          <h3 className="font-serif text-lg text-[var(--color-text-primary)] normal-case leading-snug">
            {currentQuadrantConfig.title}
          </h3>

          {/* Prompt */}
          <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed">
            {currentQuadrantConfig.prompt.split('\n\n').map((para, i) => (
              <span key={i}>
                {i > 0 && <><br /><br /></>}
                {para}
              </span>
            ))}
          </p>

          {/* Work area */}
          <QuadrantWorkArea
            chips={currentQuadrantChips}
            onAddChip={(text) => addChip(currentQuadrantId, text)}
            onMoveChip={(chipId, x, y) => moveChip(currentQuadrantId, chipId, x, y)}
            onRemoveChip={(chipId) => removeChip(currentQuadrantId, chipId)}
            config={currentQuadrantConfig}
          />

          {/* Placement description */}
          {PLACEMENT_DESCRIPTIONS[currentQuadrantId] && (
            <div className="border border-[var(--accent)] rounded-md px-2.5 pt-1.5 pb-0.5 mt-2">
              <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed text-left">
                <span className="text-[var(--accent)] tracking-wider text-[10px]">TIP: </span>
                {PLACEMENT_DESCRIPTIONS[currentQuadrantId]}
              </p>
            </div>
          )}
        </div>
      );
    }

    // ── Transition texts ──
    if (phase.includes('transition')) {
      const qId = phase.replace('-transition', '');
      const config = QUADRANT_CONFIG[qId];
      return (
        <div className="text-center">
          <div className="flex justify-center pb-6">
            <CompassAnimation />
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed italic normal-case">
            {config?.transition || ''}
          </p>
        </div>
      );
    }

    // ── Reveal prompt ──
    if (phase === 'reveal-prompt') {
      return (
        <div className="text-center">
          <h2 className="font-serif text-2xl text-[var(--color-text-primary)] normal-case mb-14">
            {REVEAL_CONTENT.title}
          </h2>

          <MatrixSchematic />

          <button
            onClick={handleReveal}
            className="mt-14 w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)]
              text-xs uppercase tracking-wider transition-all active:scale-[0.98]"
          >
            {REVEAL_CONTENT.buttonLabel}
          </button>
        </div>
      );
    }

    // ── Reveal modal phase (matrix is showing, nothing behind it) ──
    if (phase === 'reveal-modal') {
      return null;
    }

    // ── Observer Self interstitial ──
    if (phase === 'observer-self') {
      return (
        <div className="text-center">
          <div className="flex justify-center pb-6">
            <CompassAnimation />
          </div>
          {renderContentLines(OBSERVER_SELF_CONTENT.lines)}
        </div>
      );
    }

    // ── Journaling ──
    if (phase.startsWith('journal-')) {
      const journalIndex = {
        'journal-a': 0, 'journal-b': 1, 'journal-c': 2,
        'journal-d': 3, 'journal-e': 4, 'journal-f': 5,
        'journal-g': 6, 'journal-h': 7,
      }[phase];
      const screen = JOURNALING_SCREENS[journalIndex];
      if (!screen) return null;

      const [value, setter] = journalState[screen.id] || ['', null];

      return (
        <div className="space-y-4 pb-32">
          {/* Compass visual sits above the title */}
          {screen.visual === 'compass' && (
            <div className="flex justify-center py-2">
              <CompassAnimation />
            </div>
          )}

          {/* Title */}
          <h3 className="font-serif text-xl text-[var(--color-text-primary)] normal-case leading-snug">
            {screen.title}
          </h3>

          {/* Visual element */}
          {screen.visual === 'stuck-loop' && (
            <div className="relative my-5">
              <FocusedMatrixSchematic side="left" quadrants={quadrants} />
              <LoopArrowAnimation side="left" visible={showStuckLoopArrows} />
            </div>
          )}
          {screen.visual === 'vital-loop' && (
            <div className="relative my-5">
              <FocusedMatrixSchematic side="right" quadrants={quadrants} />
              <LoopArrowAnimation side="right" visible={showVitalLoopArrows} />
            </div>
          )}
          {screen.visual === 'tension' && (
            <div className="relative my-5">
              <TensionSchematic />
              <CrossQuadrantArrow visible={showTensionArrow} />
            </div>
          )}
          {screen.visual === 'toward-focus' && (
            <div className="my-5">
              <FocusedSingleQuadrant quadrantId="q4" quadrants={quadrants} />
            </div>
          )}
          {screen.visual === 'compassion-focus' && (
            <div className="my-5">
              <FocusedSingleQuadrant quadrantId="q3" quadrants={quadrants} />
            </div>
          )}
          {screen.visual === 'wholeness' && (
            <div className="my-5">
              <MatrixGrid quadrants={quadrants} mode="view" onMoveChip={() => {}} />
            </div>
          )}

          <p className="text-[var(--color-text-primary)] text-xs leading-relaxed">
            {screen.prompt.split('\n\n').map((para, i) => (
              <span key={i}>
                {i > 0 && <><br /><br /></>}
                {para}
              </span>
            ))}
          </p>
          <textarea
            value={value}
            onChange={(e) => setter?.(e.target.value)}
            placeholder={screen.placeholder}
            rows={5}
            className="w-full bg-transparent border border-[var(--color-border)] rounded-sm p-3
              text-[var(--color-text-primary)] text-sm leading-relaxed resize-none
              focus:border-[var(--accent)] focus:outline-none transition-colors
              placeholder:text-[var(--color-text-tertiary)] placeholder:normal-case"
          />
        </div>
      );
    }

    // ── Closing ──
    if (phase === 'closing') {
      return (
        <div className="text-center">
          <div className="flex justify-center pb-6">
            <CompassAnimation />
          </div>
          {renderContentLines(CLOSING_CONTENT.lines)}
        </div>
      );
    }

    return null;
  };

  // ── Control bar config per phase ──
  const matrixSlot = hasRevealed ? (
    <SlotButton icon={<ViewMatrixIcon />} label="Matrix" onClick={handleViewMatrix} />
  ) : (
    <SlotButton icon={<ViewMatrixIcon />} label="Key" onClick={handleViewSchematic} />
  );

  const getAnimationSlot = () => {
    if (phase === 'journal-b') {
      return (
        <SlotButton
          icon={<AnimationIcon visible={showStuckLoopArrows} />}
          label={showStuckLoopArrows ? 'Hide animation' : 'Show animation'}
          onClick={() => setShowStuckLoopArrows((v) => !v)}
          active={showStuckLoopArrows}
        />
      );
    }
    if (phase === 'journal-c') {
      return (
        <SlotButton
          icon={<AnimationIcon visible={showVitalLoopArrows} />}
          label={showVitalLoopArrows ? 'Hide animation' : 'Show animation'}
          onClick={() => setShowVitalLoopArrows((v) => !v)}
          active={showVitalLoopArrows}
        />
      );
    }
    if (phase === 'journal-d') {
      return (
        <SlotButton
          icon={<AnimationIcon visible={showTensionArrow} />}
          label={showTensionArrow ? 'Hide animation' : 'Show animation'}
          onClick={() => setShowTensionArrow((v) => !v)}
          active={showTensionArrow}
        />
      );
    }
    return null;
  };

  const getControlBarProps = () => {
    const base = { showSkip: true, onSkip: handleSkip, skipConfirmMessage: 'Skip this exercise?', rightSlot: matrixSlot };

    if (phase === 'idle') {
      return { ...base, phase: 'idle', primary: { label: 'Begin', onClick: () => fadeToPhase('intro-a') } };
    }
    if (phase === 'intro-a') {
      return { ...base, phase: 'active', primary: { label: 'Continue', onClick: () => fadeToPhase('intro-b') } };
    }
    if (phase === 'intro-b') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('intro-c') },
        showBack: true, onBack: () => fadeToPhase('intro-a'),
      };
    }
    if (phase === 'intro-c') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('intro-d') },
        showBack: true, onBack: () => fadeToPhase('intro-b'),
      };
    }
    if (phase === 'intro-d') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('intro-e') },
        showBack: true, onBack: () => fadeToPhase('intro-c'),
      };
    }
    if (phase === 'intro-e') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Begin', onClick: () => fadeToPhase('q1') },
        showBack: true, onBack: () => fadeToPhase('intro-d'),
      };
    }
    if (currentQuadrantId) {
      const nextPhase = `${currentQuadrantId}-transition`;
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase(nextPhase) },
        showBack: true,
        onBack: handleBack,
      };
    }
    if (phase.includes('transition')) {
      const qId = phase.replace('-transition', '');
      const qIdx = QUADRANT_ORDER.indexOf(qId);
      const nextPhase = qIdx < QUADRANT_ORDER.length - 1 ? QUADRANT_ORDER[qIdx + 1] : 'reveal-prompt';
      return { ...base, phase: 'active', primary: { label: 'Continue', onClick: () => fadeToPhase(nextPhase) } };
    }
    if (phase === 'reveal-prompt') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', disabled: true },
        showBack: true, onBack: () => fadeToPhase('q4'),
      };
    }
    if (phase === 'reveal-modal') {
      // Matrix modal handles its own controls; minimal control bar
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: handleCloseMatrix },
        rightSlot: null,
      };
    }
    if (phase === 'observer-self') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('journal-a') },
        showBack: true, onBack: () => { setShowMatrix(true); setPhase('reveal-modal'); },
      };
    }
    if (phase === 'journal-a') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('journal-b') },
        showBack: true, onBack: () => fadeToPhase('observer-self'),
      };
    }
    if (phase === 'journal-b') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('journal-c') },
        showBack: true, onBack: () => fadeToPhase('journal-a'),
        leftSlot: getAnimationSlot(),
      };
    }
    if (phase === 'journal-c') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('journal-d') },
        showBack: true, onBack: () => fadeToPhase('journal-b'),
        leftSlot: getAnimationSlot(),
      };
    }
    if (phase === 'journal-d') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('journal-e') },
        showBack: true, onBack: () => fadeToPhase('journal-c'),
        leftSlot: getAnimationSlot(),
      };
    }
    if (phase === 'journal-e') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('journal-f') },
        showBack: true, onBack: () => fadeToPhase('journal-d'),
      };
    }
    if (phase === 'journal-f') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('journal-g') },
        showBack: true, onBack: () => fadeToPhase('journal-e'),
      };
    }
    if (phase === 'journal-g') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('journal-h') },
        showBack: true, onBack: () => fadeToPhase('journal-f'),
      };
    }
    if (phase === 'journal-h') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('closing') },
        showBack: true, onBack: () => fadeToPhase('journal-g'),
      };
    }
    if (phase === 'closing') {
      return { ...base, phase: 'completed', primary: { label: 'Complete', onClick: handleComplete }, showSkip: false, showBack: true, onBack: () => fadeToPhase('journal-h') };
    }

    return base;
  };

  const controlBarProps = getControlBarProps();

  return (
    <>
      <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
        <div
          className={`transition-opacity duration-[400ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          {renderContent()}
        </div>
      </ModuleLayout>

      <ModuleControlBar {...controlBarProps} />

      {/* Matrix modal (for reveal and view-again during journaling) */}
      <MatrixModal
        isOpen={showMatrix}
        closing={matrixClosing}
        onClose={phase === 'reveal-modal' ? handleCloseMatrix : handleCloseMatrixView}
        quadrants={quadrants}
        onUpdateChipPosition={updateChipPosition}
      />

      {/* Schematic modal (matrix key, shown before reveal) */}
      <SchematicModal
        isOpen={showSchematic}
        closing={schematicClosing}
        onClose={handleCloseSchematic}
      />

      {/* Reveal overlay animation (key forces remount for fresh state on repeat) */}
      <RevealOverlay key={revealKey} isActive={showRevealOverlay} onDone={handleRevealDone} />
    </>
  );
}
