/**
 * ActivitySuggestions
 * Shows contextual intro text + activity cards + "I need more help" escalation.
 */

export default function ActivitySuggestions({ introText, activities, onSelectActivity, onNeedMoreHelp }) {
  return (
    <div className="space-y-4 animate-fadeIn">
      {introText && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {introText}
        </p>
      )}

      <div className="space-y-2">
        {activities.map((activity) => (
          <button
            key={activity.id}
            type="button"
            onClick={() => onSelectActivity(activity)}
            className="w-full text-left p-4 border transition-colors"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {activity.label}
            </p>
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
              {activity.description}
            </p>
          </button>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onNeedMoreHelp}
          className="text-xs uppercase tracking-wider underline"
          style={{ color: 'var(--accent)' }}
        >
          I need more help
        </button>
      </div>
    </div>
  );
}
