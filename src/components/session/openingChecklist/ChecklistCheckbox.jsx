/**
 * ChecklistCheckbox — Tappable row for the Opening Checklist's Setting step.
 *
 * Visual: a 24px circle icon (unchecked) crossfading to a circle-with-check
 * icon (checked). Both icons are absolutely stacked so they swap without
 * layout shift. Snappy 200ms opacity transition.
 *
 * Props:
 *   label: string — the checklist item text
 *   checked: boolean
 *   onToggle: () => void
 */

import { CircleIcon, CircleCheckBigIcon } from '../../shared/Icons';

const ICON_SIZE = 22;

export default function ChecklistCheckbox({ label, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-start gap-4 py-3 text-left group"
    >
      {/* Icon stack — two icons overlaid, opacity crossfade on check state */}
      <span
        className="relative flex-shrink-0 mt-[1px]"
        style={{ width: ICON_SIZE, height: ICON_SIZE }}
      >
        {/* Unchecked — plain circle, tertiary color */}
        <span
          className="absolute inset-0 transition-opacity duration-200"
          style={{
            opacity: checked ? 0 : 1,
            color: 'var(--color-text-tertiary)',
          }}
        >
          <CircleIcon size={ICON_SIZE} />
        </span>

        {/* Checked — circle with check, accent color */}
        <span
          className="absolute inset-0 transition-opacity duration-200"
          style={{
            opacity: checked ? 1 : 0,
            color: 'var(--accent)',
          }}
        >
          <CircleCheckBigIcon size={ICON_SIZE} />
        </span>
      </span>

      {/* Label — inherits app default uppercase + mono for consistency with
          the rest of the checklist/app chrome */}
      <span
        className={`text-xs tracking-wider leading-relaxed transition-colors duration-200 ${
          checked
            ? 'text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]'
        }`}
      >
        {label}
      </span>
    </button>
  );
}
