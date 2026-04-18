/**
 * DataDownloadBlock — Triggers the existing DataDownloadModal.
 *
 * Config:
 *   { type: 'data-download', buttonLabel: 'Download Session Data' }
 */

import { useState } from 'react';
import DataDownloadModal from '../../DataDownloadModal';

export default function DataDownloadBlock({ block }) {
  const [showModal, setShowModal] = useState(false);

  const label = block.buttonLabel || 'Download Session Data';

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="w-full py-3 border border-[var(--color-text-tertiary)] text-[var(--color-text-primary)]
          text-sm hover:border-[var(--color-text-primary)] transition-colors"
      >
        {label}
      </button>

      {showModal && (
        <DataDownloadModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
