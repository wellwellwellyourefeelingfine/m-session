/**
 * HelperButton
 * A heart-icon button rendered in the Header that opens the HelperModal.
 * Mirrors the structural pattern of SessionMenu (the hamburger button) for
 * consistent vertical alignment within the header.
 *
 * Visibility is gated by sessionPhase — only renders during phases where the
 * helper modal is meaningful (pre-session, active, completed).
 *
 * When the modal is open, the button fades to opacity 0 and disables pointer
 * events so the modal visually "replaces" it.
 */

import { useSessionStore } from '../../stores/useSessionStore';
import { useHelperStore } from '../../stores/useHelperStore';
import { HeartIcon } from '../shared/Icons';

const VALID_PHASES = ['pre-session', 'active', 'completed'];

export default function HelperButton() {
  const sessionPhase = useSessionStore((state) => state.sessionPhase);
  const isOpen = useHelperStore((state) => state.isOpen);
  const openHelper = useHelperStore((state) => state.openHelper);

  if (!VALID_PHASES.includes(sessionPhase)) return null;

  return (
    <div className="h-full flex items-end pb-2">
      <button
        type="button"
        onClick={openHelper}
        className="w-10 h-10 flex items-center justify-center touch-target transition-opacity duration-200"
        style={{
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? 'none' : 'auto',
        }}
        aria-label="Open support menu"
      >
        <HeartIcon size={22} strokeWidth={3} className="text-[var(--accent)]" />
      </button>
    </div>
  );
}
