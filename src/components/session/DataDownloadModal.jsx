/**
 * DataDownloadModal Component
 * Modal for downloading session data (text) and images
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { downloadSessionData, downloadSessionImages } from '../../utils/downloadSessionData';
import { useJournalStore } from '../../stores/useJournalStore';
import { useSessionStore } from '../../stores/useSessionStore';
import { OrigamiIcon, CircleSkipIcon } from '../shared/Icons';

// Matches the slideDownOut / fadeOut animation duration in index.css.
const CLOSE_ANIMATION_MS = 350;

export default function DataDownloadModal({ onClose }) {
  const journalEntries = useJournalStore((s) => s.entries);
  const hasImages = journalEntries.some((e) => e.hasImage && e.source === 'session');
  const recordDataExport = useSessionStore((s) => s.recordDataExport);

  const [isClosing, setIsClosing] = useState(false);

  // Run the close animation, then fire onClose. onClose unmounts the modal,
  // so we keep it mounted for the animation duration first.
  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onClose, CLOSE_ANIMATION_MS);
  };

  const handleDownloadText = () => {
    downloadSessionData();
    recordDataExport();
    handleClose();
  };

  const handleDownloadImages = async () => {
    await downloadSessionImages();
    handleClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Portal to document.body so the overlay escapes any ancestor stacking
  // context (e.g. the TransitionModule's fixed-positioned wrapper, which
  // would otherwise trap the z-50 overlay below the z-40 header and the
  // fixed tab bar). Portaling puts the modal in the root stacking context
  // so it covers the full viewport as intended.
  return createPortal(
    // Backdrop and modal are siblings (not parent/child) so the backdrop's
    // fade-in/out animation doesn't cascade opacity onto the modal — the
    // modal only slides, never fades.
    <div className="fixed inset-0 flex items-end justify-center z-50">
      <div
        className={`absolute inset-0 bg-black/25 ${
          isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
        }`}
        onClick={handleBackdropClick}
      />
      {/* pb-20 reserves space at the bottom so the Cancel button sits
          comfortably above the safe area / tab-bar height. */}
      <div
        className={`relative bg-[var(--color-bg)] w-full max-w-md rounded-t-2xl p-6 pb-20 ${
          isClosing ? 'animate-slideDownOut' : 'animate-slideUp'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <OrigamiIcon size={28} strokeWidth={2.5} className="flex-shrink-0 text-[var(--accent)]" />
            <h3
              className="mb-0 text-lg text-[var(--color-text-primary)]"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              Download Session Data
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-2 -m-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <CircleSkipIcon size={22} />
          </button>
        </div>

        <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed text-sm">
          Download your session record including journal entries,
          reflections, and notes.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleDownloadText}
            className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
          >
            Download Session Record
          </button>
          <button
            onClick={handleDownloadImages}
            disabled={!hasImages}
            className="w-full py-3 border border-[var(--color-text-tertiary)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:border-[var(--color-text-primary)] transition-colors disabled:opacity-30 disabled:cursor-default disabled:hover:border-[var(--color-text-tertiary)]"
          >
            {hasImages ? 'Download Images' : 'No Images to Export'}
          </button>
          <button
            onClick={handleClose}
            className="w-full py-3 text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
