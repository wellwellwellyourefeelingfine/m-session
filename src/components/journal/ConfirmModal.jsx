/**
 * ConfirmModal Component
 * Reusable confirmation dialog
 * Monochrome design - primary/secondary button contrast
 */

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn px-6">
      <div className="bg-[var(--color-bg)] w-full max-w-sm rounded-lg p-6 animate-fadeIn">
        {/* Title */}
        <h3 className="mb-3">
          {title}
        </h3>

        {/* Message */}
        <p
          className="text-[var(--color-text-secondary)] mb-6"
          style={{ textTransform: 'none' }}
        >
          {message}
        </p>

        {/* Actions - monochrome design */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors uppercase tracking-wider text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-sm transition-opacity hover:opacity-80"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
