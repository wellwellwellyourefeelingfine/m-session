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
        className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
      >
        {label}
      </button>

      {showModal && (
        <DataDownloadModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
