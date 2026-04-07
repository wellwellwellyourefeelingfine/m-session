/**
 * ActivitySuggestions
 * Shows contextual intro text + activity cards + "I need more help" escalation.
 * Reuses the timeline ModuleCard component for visual consistency with the home timeline.
 *
 * Cards are wrapped in `.helper-activity-card` so we can apply a slightly reduced
 * padding override here without touching ModuleCard itself. This keeps the size
 * tweak local to the helper modal context.
 */

import ModuleCard from '../timeline/ModuleCard';
import { getModuleById } from '../../content/modules';

// Scoped style overrides for ModuleCard when rendered inside the helper modal.
// Reduces the inner padding and clamps the description to 2 lines so the box
// is shorter, without changing font sizes, icon size, line-height, or gap.
const helperCardStyles = `
  .helper-activity-card > div > div {
    padding-top: 0.125rem !important;
    padding-bottom: 0.25rem !important;
    padding-left: 0.625rem !important;
    padding-right: 0.625rem !important;
  }
  /* Clamp the description from 3 lines (default) to 2 lines */
  .helper-activity-card .line-clamp-3 {
    -webkit-line-clamp: 2 !important;
  }
`;

export default function ActivitySuggestions({ introText, activities, onSelectActivity, onNeedMoreHelp }) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <style>{helperCardStyles}</style>
      {introText && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {introText}
        </p>
      )}

      <div className="space-y-2">
        {activities.map((activity) => {
          const libraryModule = getModuleById(activity.id);
          if (!libraryModule) return null;
          // Construct a synthetic module instance object that ModuleCard expects.
          // We're not in an active session context here — just rendering a read-only card.
          const syntheticModule = {
            instanceId: `helper-${activity.id}`,
            libraryId: activity.id,
            title: libraryModule.title,
            duration: libraryModule.defaultDuration,
            status: 'upcoming',
            isBoosterModule: false,
            startedAt: null,
            completedAt: null,
          };
          return (
            <div key={activity.id} className="helper-activity-card">
              <ModuleCard
                module={syntheticModule}
                isActiveSession={false}
                isCurrentModule={false}
                canRemove={false}
                isEditMode={false}
                onClick={() => onSelectActivity(activity)}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-center" style={{ marginTop: '-0.25rem' }}>
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
