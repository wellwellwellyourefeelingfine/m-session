/**
 * MeditationLoadingScreen Component
 *
 * Renders a brief "Preparing meditation..." screen between the idle screen
 * and the active playback screen. Driven by useMeditationPlayback's
 * `transitionStage`: enters on 'preparing', exits on 'preparing-leaving'.
 *
 * Layout mirrors the active playback screen so the AsciiMoon lands in the
 * same vertical slot that MorphingShapes occupies during playback — a silent
 * invisible title spacer on top handles that. When the transition to active
 * happens, the visual center of gravity stays put.
 *
 * A minimum display time in the playback hook prevents this from flashing
 * when audio loads quickly from cache — the user always registers that
 * a controlled transition is happening.
 */

import AsciiMoon from './animations/AsciiMoon';

export default function MeditationLoadingScreen({ isLeaving = false }) {
  return (
    <div
      className={`flex flex-col items-center text-center w-full px-4 ${
        isLeaving ? 'animate-fadeOut' : 'animate-fadeIn'
      }`}
      style={{
        alignSelf: 'stretch',
        minHeight: 'var(--meditation-page-min-height)',
        animationDuration: '400ms',
      }}
    >
      {/* Invisible title spacer — matches the active screen's <h2> so the
          AsciiMoon below lines up exactly with MorphingShapes' position. */}
      <div
        aria-hidden="true"
        className="text-xl font-light mb-4 invisible select-none"
        style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none', marginTop: 0 }}
      >
        &nbsp;
      </div>

      {/* Nudge AsciiMoon up so its vertical center lines up with where
          MorphingShapes' center sits. AsciiMoon (~149px tall) is ~29px
          taller than MorphingShapes (120px); half of that difference. */}
      <div style={{ marginTop: '-15px' }}>
        <AsciiMoon />
      </div>

      <p
        className="mt-6 text-[var(--color-text-tertiary)] text-sm uppercase tracking-wider"
        aria-live="polite"
      >
        Preparing meditation...
      </p>
    </div>
  );
}
