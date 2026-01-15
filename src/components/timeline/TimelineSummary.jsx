/**
 * TimelineSummary Component
 * Shows total duration and module count for the timeline
 */

export default function TimelineSummary({ totalDuration, targetDuration, moduleCount }) {
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  return (
    <div className="mt-8 p-4 border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[var(--color-text-tertiary)] text-sm">Total Activities</p>
          <p className="text-[var(--color-text-primary)] text-lg">{moduleCount}</p>
        </div>
        <div className="text-right">
          <p className="text-[var(--color-text-tertiary)] text-sm">Scheduled Time</p>
          <p className="text-[var(--color-text-primary)] text-lg">
            {formatDuration(totalDuration)}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
        <p className="text-[var(--color-text-tertiary)] text-sm">
          Session target: {formatDuration(targetDuration)}
        </p>
        <p className="text-[var(--color-text-secondary)] text-xs mt-1">
          Your session will continue even after all activities are complete,
          until you choose to end it.
        </p>
      </div>
    </div>
  );
}
