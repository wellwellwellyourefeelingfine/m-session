/**
 * TimelineSummary Component
 * Shows total duration and module count for the timeline
 */

export default function TimelineSummary({ totalDuration, moduleCount }) {
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  return (
    <div className="mt-2 px-4 pt-4 pb-2 border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="text-[var(--color-text-tertiary)] text-sm">Total Activities</p>
          <p className="text-[var(--color-text-primary)] text-lg leading-tight">{moduleCount}</p>
        </div>
        <div className="text-right">
          <p className="text-[var(--color-text-tertiary)] text-sm">Scheduled Time</p>
          <p className="text-[var(--color-text-primary)] text-lg leading-tight">
            {formatDuration(totalDuration)}
          </p>
        </div>
      </div>

      <p className="text-[var(--color-text-secondary)] text-xs">
        A typical MDMA session usually lasts between 4-6 hours. You can always alter your timeline and add or remove activities during the session.
      </p>
    </div>
  );
}
