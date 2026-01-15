/**
 * SafetyWarning Component
 * Displays safety warnings based on intake responses
 */

export default function SafetyWarning({ showMedicationWarning, showSafetyWarnings }) {
  return (
    <div className="space-y-4 p-4 border border-[var(--color-border)]">
      <p className="uppercase tracking-wider text-[var(--color-text-tertiary)]">
        Important Notes
      </p>

      {showSafetyWarnings && (
        <div className="text-[var(--color-text-secondary)] space-y-2">
          <p>
            Based on your responses, please ensure you have addressed safety considerations before proceeding.
          </p>
          <p>
            Consider having a trusted person available or on-call during your session.
          </p>
        </div>
      )}

      {showMedicationWarning && (
        <div className="text-[var(--color-text-secondary)] space-y-2">
          <p>
            You indicated you are taking medications. Please ensure you have researched potential interactions.
          </p>
          <p>
            Consult with a healthcare provider if you have any concerns.
          </p>
        </div>
      )}
    </div>
  );
}
