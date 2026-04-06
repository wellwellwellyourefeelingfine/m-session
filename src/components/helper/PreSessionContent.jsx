/**
 * PreSessionContent
 * Informational text shown during pre-session phase.
 * No interactive elements — just introduces the Helper tab concept.
 */

export default function PreSessionContent() {
  return (
    <div className="animate-fadeIn">
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        During your session, you can navigate any difficult feelings that arise through this Helper tab.
      </p>
    </div>
  );
}
