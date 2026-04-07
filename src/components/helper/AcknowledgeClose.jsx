/**
 * AcknowledgeClose
 * Pure display component for the category-specific acknowledgment text (rating 0).
 * No auto-close, no tap-to-close — the user retains control via the modal's
 * close and back buttons.
 */

export default function AcknowledgeClose({ text }) {
  return (
    <div className="animate-fadeIn">
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {text}
      </p>
    </div>
  );
}
