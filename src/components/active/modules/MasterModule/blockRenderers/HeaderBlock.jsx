/**
 * HeaderBlock — Title text + centered animation
 *
 * Renders a serif title and a centered animation component below it.
 * The animation defaults to AsciiMoon but can be configured to any registered animation.
 *
 * Optional props on the block config:
 *   animation: 'ascii-moon' | 'morphing-shapes' | 'ascii-diamond' | 'leaf' | 'compass' | 'wave'
 *   animationProps: { size, strokeWidth, ... } — passed directly to the animation component
 *   titleClassName: override for the title's className (e.g., larger text for meditation headers)
 */

import AsciiMoon from '../../../capabilities/animations/AsciiMoon';
import MorphingShapes from '../../../capabilities/animations/MorphingShapes';
import AsciiDiamond from '../../../capabilities/animations/AsciiDiamond';
import LeafDrawV2 from '../../../capabilities/animations/LeafDrawV2';
import CompassV2 from '../../../capabilities/animations/CompassV2';
import WaveLoop from '../../../capabilities/animations/WaveLoop';
import Sunrise from '../../../capabilities/animations/Sunrise';
import FullSun from '../../../capabilities/animations/FullSun';
import Sunset from '../../../capabilities/animations/Sunset';
import Moonrise from '../../../capabilities/animations/Moonrise';
import { renderLineWithMarkup } from '../utils/renderContentLines';

export const ANIMATION_MAP = {
  'ascii-moon': AsciiMoon,
  'morphing-shapes': MorphingShapes,
  'ascii-diamond': AsciiDiamond,
  'leaf': LeafDrawV2,
  'compass': CompassV2,
  'wave': WaveLoop,
  'sunrise': Sunrise,
  'full-sun': FullSun,
  'sunset': Sunset,
  'moonrise': Moonrise,
};

export default function HeaderBlock({ block, accentTerms }) {
  // animation: undefined → default to ascii-moon. animation: null → no animation.
  const animationKey = block.animation === null ? null : (block.animation || 'ascii-moon');
  const Animation = animationKey ? ANIMATION_MAP[animationKey] : null;
  const titleClassName = block.titleClassName || 'text-xl font-light mb-2 text-center';
  const animationProps = block.animationProps || {};

  return (
    <>
      {block.title && (
        <h2
          className={titleClassName}
          style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
        >
          {renderLineWithMarkup(block.title, accentTerms)}
        </h2>
      )}
      {Animation && (
        <div className="flex justify-center mb-4">
          <Animation {...animationProps} />
        </div>
      )}
    </>
  );
}
