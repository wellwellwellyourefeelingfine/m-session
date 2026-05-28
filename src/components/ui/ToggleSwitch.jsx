/**
 * ToggleSwitch Component
 * Minimal toggle matching the SessionMenu dark mode switch.
 * ON = accent-colored track, OFF = muted grey track.
 */

export default function ToggleSwitch({ checked, onChange, ariaLabel, alwaysAccent }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="relative flex-shrink-0"
      style={{ width: '36px', height: '20px' }}
      aria-label={ariaLabel}
      role="switch"
      aria-checked={!!checked}
    >
      {/* Track */}
      <span
        className="absolute inset-0 rounded-full transition-colors duration-200"
        style={{ backgroundColor: (checked || alwaysAccent) ? 'var(--accent)' : 'var(--color-border)' }}
      />
      {/* Thumb */}
      <span
        className="absolute top-[2px] rounded-full bg-white transition-transform duration-200 shadow-sm"
        style={{
          width: '16px',
          height: '16px',
          left: '2px',
          transform: checked ? 'translateX(16px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}
