/**
 * DataDownloadModal Component
 * Modal for downloading session data (text) and images
 */

import { downloadSessionData, downloadSessionImages } from '../../utils/downloadSessionData';
import { useJournalStore } from '../../stores/useJournalStore';

export default function DataDownloadModal({ onClose }) {
  const journalEntries = useJournalStore((s) => s.entries);
  const hasImages = journalEntries.some((e) => e.hasImage && e.source === 'session');

  const handleDownloadText = () => {
    downloadSessionData();
    onClose();
  };

  const handleDownloadImages = async () => {
    await downloadSessionImages();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-end justify-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg)] w-full max-w-md rounded-t-2xl p-6 pb-8 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[var(--color-text-primary)]" style={{ marginBottom: 0 }}>
            Download Session Data
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors p-2 -m-2"
          >
            <span className="text-xl">−</span>
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
            onClick={onClose}
            className="w-full py-3 text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
