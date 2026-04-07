/**
 * PreSessionContent
 * Informational text shown during pre-session phase.
 * No interactive elements — just introduces the Helper button concept.
 */

import { HeartIcon } from '../shared/Icons';

export default function PreSessionContent() {
  return (
    <div className="animate-fadeIn">
      <p
        className="text-sm leading-relaxed inline-flex flex-wrap items-center gap-1"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <span>During your session, you can navigate any difficult feelings that arise through this Helper</span>
        <HeartIcon size={14} strokeWidth={2} className="text-[var(--accent)] inline-block align-middle" />
        <span>button.</span>
      </p>
    </div>
  );
}
