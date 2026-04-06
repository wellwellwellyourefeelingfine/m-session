/**
 * AcknowledgeClose
 * Shows category-specific acknowledgment text for rating 0.
 * Auto-closes after ~2s or on tap.
 */

import { useEffect } from 'react';

export default function AcknowledgeClose({ text, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="animate-fadeIn cursor-pointer" onClick={onClose}>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {text}
      </p>
    </div>
  );
}
