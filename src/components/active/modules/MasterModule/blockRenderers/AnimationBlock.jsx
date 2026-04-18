/**
 * AnimationBlock — Decorative/transitional screen
 *
 * Renders an animation component with optional header and text lines.
 * Used for closing screens, transitions, and visual breaks.
 */

import AsciiDiamond from '../../../capabilities/animations/AsciiDiamond';
import AsciiMoon from '../../../capabilities/animations/AsciiMoon';
import MorphingShapes from '../../../capabilities/animations/MorphingShapes';
import LeafDrawV2 from '../../../capabilities/animations/LeafDrawV2';
import CompassV2 from '../../../capabilities/animations/CompassV2';
import WaveLoop from '../../../capabilities/animations/WaveLoop';
import Sunrise from '../../../capabilities/animations/Sunrise';
import FullSun from '../../../capabilities/animations/FullSun';
import Sunset from '../../../capabilities/animations/Sunset';
import Moonrise from '../../../capabilities/animations/Moonrise';
import renderContentLines from '../utils/renderContentLines';

const ANIMATION_MAP = {
  'ascii-diamond': AsciiDiamond,
  'ascii-moon': AsciiMoon,
  'morphing-shapes': MorphingShapes,
  'leaf': LeafDrawV2,
  'compass': CompassV2,
  'wave': WaveLoop,
  'sunrise': Sunrise,
  'full-sun': FullSun,
  'sunset': Sunset,
  'moonrise': Moonrise,
};

export default function AnimationBlock({ screen, accentTerms }) {
  const AnimationComponent = ANIMATION_MAP[screen.animation];

  return (
    <div className="text-center">
      {screen.header && (
        <p
          className="text-lg mb-4 text-[var(--color-text-primary)]"
          style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
        >
          {screen.header}
        </p>
      )}

      {AnimationComponent && (
        <div className="flex justify-center mb-4">
          <AnimationComponent />
        </div>
      )}

      {screen.lines && screen.lines.length > 0 && (
        <div className="text-left">
          {renderContentLines(screen.lines, accentTerms)}
        </div>
      )}
    </div>
  );
}
