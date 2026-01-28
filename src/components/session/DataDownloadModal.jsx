/**
 * DataDownloadModal Component
 * Modal for selecting session data download format
 */

import { downloadSessionData } from '../../utils/downloadSessionData';

export default function DataDownloadModal({ onClose }) {
  const handleDownloadText = () => {
    downloadSessionData('txt');
    onClose();
  };

  const handleDownloadJson = () => {
    downloadSessionData('json');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg)] w-full max-w-md rounded-t-2xl p-6 pb-8 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors p-2 -m-2"
          >
            <span className="text-xl">−</span>
          </button>
        </div>

        <h3 className="mb-4 text-[var(--color-text-primary)]">
          Download Session Data
        </h3>

        <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed text-sm">
          Choose a format to download your session data. This includes your journal entries,
          reflections, and any notes you made during your session.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleDownloadText}
            className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
          >
            Download as Text
          </button>
          <button
            onClick={handleDownloadJson}
            className="w-full py-3 border border-[var(--color-text-tertiary)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:border-[var(--color-text-primary)] transition-colors"
          >
            Download as JSON
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Cancel
          </button>
        </div>

        <p className="text-[var(--color-text-tertiary)] text-xs mt-4 text-center">
          Text format is human-readable. JSON format is useful for backup or import.
        </p>
      </div>
    </div>
  );
}
