import { useEffect, useRef, useId, memo } from 'react';

// Canvas
const VIEWBOX_W       = 120;
const VIEWBOX_H       = 120;
const STROKE_WIDTH    = 6;

// Main wave (sine path sampled across the full width)
const WAVE_BASELINE_Y = 75;   // horizon line — slightly below center, more sky than water
const WAVE_AMPLITUDE  = 3;    // swapped from wave 3 (gentler, slower feel)
const WAVE_WAVELENGTH = 60;   // 2 visible crests across the 120-wide canvas
const WAVE_PHASE      = WAVE_WAVELENGTH / 2;  // swapped from wave 3
const WAVE_SAMPLES    = 60;
const WAVE_CYCLES_PER_LOOP = 2;  // wave must complete a whole number of cycles per loop for a seamless seam

// Second wave (shorter, centered beneath the main wave, same frequency with phase offset)
const WAVE2_BASELINE_Y = 93;
const WAVE2_AMPLITUDE  = 4;                       // unchanged
const WAVE2_WAVELENGTH = WAVE_WAVELENGTH;          // same frequency as main — loops seamlessly
const WAVE2_PHASE      = WAVE_WAVELENGTH / 4;      // quarter-wavelength offset so crests don't align
const WAVE2_MARGIN     = 15;
const WAVE2_START_X    = WAVE2_MARGIN;
const WAVE2_END_X      = VIEWBOX_W - WAVE2_MARGIN;
const WAVE2_SAMPLES    = 40;

// Third wave (shortest, centered beneath the second wave)
const WAVE3_BASELINE_Y = 111;
const WAVE3_AMPLITUDE  = 4;                        // swapped from wave 1 (more active)
const WAVE3_WAVELENGTH = WAVE_WAVELENGTH;           // same frequency — loops seamlessly
const WAVE3_PHASE      = 0;                         // swapped from wave 1 (no offset)
const WAVE3_MARGIN     = 30;
const WAVE3_START_X    = WAVE3_MARGIN;
const WAVE3_END_X      = VIEWBOX_W - WAVE3_MARGIN;
const WAVE3_SAMPLES    = 30;

// Sun (orbits in an ellipse centered on the horizon line)
const SUN_RADIUS      = 10;
const SUN_ORBIT_CX    = 60;
const SUN_ORBIT_CY    = WAVE_BASELINE_Y;
const SUN_ORBIT_RX    = 40;
const SUN_ORBIT_RY    = 35;

// Timeline
const HIDDEN_DUR      = 3;       // sun travels invisibly under the horizon
const VISIBLE_DUR     = 6;       // continuous arc: left horizon → apex → right horizon
const TOTAL           = HIDDEN_DUR + VISIBLE_DUR;  // 9s
const APEX_RESIDUAL   = 0.7;     // 0 = full stop at apex, higher = more residual motion

// Derive WAVE_PERIOD from TOTAL so the wave always completes a whole number of cycles
// per loop — this guarantees a seamless wave seam regardless of timeline tweaks.
const WAVE_PERIOD     = TOTAL / WAVE_CYCLES_PER_LOOP;

const TWO_PI = Math.PI * 2;

function buildWavePath(waveOffset, startX = 0, endX = VIEWBOX_W, baselineY = WAVE_BASELINE_Y, amplitude = WAVE_AMPLITUDE, wavelength = WAVE_WAVELENGTH, samples = WAVE_SAMPLES) {
  let d = '';
  for (let i = 0; i <= samples; i++) {
    const x = startX + (i / samples) * (endX - startX);
    const y = baselineY + amplitude * Math.sin(((x + waveOffset) / wavelength) * TWO_PI);
    d += (i === 0 ? 'M ' : ' L ') + x.toFixed(2) + ' ' + y.toFixed(2);
  }
  return d;
}

// Closed polygon: top-left → top-right → trace wave right→left → close.
// Everything inside this region is "sky" (visible to the clipped sun).
function buildSkyClipPath(waveOffset) {
  let d = 'M 0 0 L ' + VIEWBOX_W + ' 0';
  // Trace the wave from right to left so it closes back to (0, 0)
  for (let i = WAVE_SAMPLES; i >= 0; i--) {
    const x = (i / WAVE_SAMPLES) * VIEWBOX_W;
    const y = WAVE_BASELINE_Y + WAVE_AMPLITUDE * Math.sin(((x + waveOffset) / WAVE_WAVELENGTH) * TWO_PI);
    d += ' L ' + x.toFixed(2) + ' ' + y.toFixed(2);
  }
  d += ' Z';
  return d;
}

function computeSunAngle(elapsed) {
  if (elapsed < HIDDEN_DUR) {
    // π → 2π : sun travels invisibly under the horizon from right back around to left
    return Math.PI + (elapsed / HIDDEN_DUR) * Math.PI;
  }

  // Continuous arc from 0 → π. Quadratic ease-in-out on the angle blended with a constant
  // linear angular velocity so the sun never fully stops — it drifts horizontally through
  // the apex. The linear term is uniform across the whole arc (no kink at the apex).
  const t = (elapsed - HIDDEN_DUR) / VISIBLE_DUR;
  const b = APEX_RESIDUAL;

  // Quadratic ease-in-out mapped to [0, 1]
  const eased = t < 0.5
    ? 2 * t - 2 * t * t              // ease-out: fast start, decelerates to midpoint
    : 0.5 + (2 * t - 1) ** 2 * 0.5;  // ease-in: midpoint, accelerates to end

  return ((1 - b) * eased + b * t) * Math.PI;
}

// Compute the elapsed=0 ("sun fully set, just past the right horizon") frame values
// so the JSX initial render matches the first RAF tick — avoids any first-paint flicker.
const INITIAL_WAVE_PATH  = buildWavePath(WAVE_PHASE);
const INITIAL_WAVE2_PATH = buildWavePath(WAVE2_PHASE, WAVE2_START_X, WAVE2_END_X, WAVE2_BASELINE_Y, WAVE2_AMPLITUDE, WAVE2_WAVELENGTH, WAVE2_SAMPLES);
const INITIAL_WAVE3_PATH = buildWavePath(WAVE3_PHASE, WAVE3_START_X, WAVE3_END_X, WAVE3_BASELINE_Y, WAVE3_AMPLITUDE, WAVE3_WAVELENGTH, WAVE3_SAMPLES);
const INITIAL_CLIP_PATH  = buildSkyClipPath(WAVE_PHASE);
const INITIAL_SUN_ANGLE = computeSunAngle(0);
const INITIAL_SUN_X = SUN_ORBIT_CX - Math.cos(INITIAL_SUN_ANGLE) * SUN_ORBIT_RX;
const INITIAL_SUN_Y = SUN_ORBIT_CY - Math.sin(INITIAL_SUN_ANGLE) * SUN_ORBIT_RY;

export default memo(function WaveLoopAnimation({ size = 120 }) {
  const waveRef    = useRef(null);
  const wave2Ref   = useRef(null);
  const wave3Ref   = useRef(null);
  const skyClipRef = useRef(null);
  const sunRef     = useRef(null);
  const rafRef     = useRef(null);
  const startRef   = useRef(null);

  // Unique clipPath id per instance so multiple WaveLoops don't collide.
  const reactId = useId();
  const clipId  = `waveloop-sky-${reactId.replace(/:/g, '')}`;

  useEffect(() => {
    function animate(timestamp) {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = ((timestamp - startRef.current) / 1000) % TOTAL;

      const waveOffset = (elapsed / WAVE_PERIOD) * WAVE_WAVELENGTH;
      const wavePath   = buildWavePath(waveOffset + WAVE_PHASE);
      const wave2Path  = buildWavePath(waveOffset + WAVE2_PHASE, WAVE2_START_X, WAVE2_END_X, WAVE2_BASELINE_Y, WAVE2_AMPLITUDE, WAVE2_WAVELENGTH, WAVE2_SAMPLES);
      const wave3Path  = buildWavePath(waveOffset + WAVE3_PHASE, WAVE3_START_X, WAVE3_END_X, WAVE3_BASELINE_Y, WAVE3_AMPLITUDE, WAVE3_WAVELENGTH, WAVE3_SAMPLES);
      const clipPath   = buildSkyClipPath(waveOffset + WAVE_PHASE);

      const sunAngle = computeSunAngle(elapsed);
      // -cos so angle 0 starts at the LEFT horizon; -sin so positive sin moves UP visually
      const sunX = SUN_ORBIT_CX - Math.cos(sunAngle) * SUN_ORBIT_RX;
      const sunY = SUN_ORBIT_CY - Math.sin(sunAngle) * SUN_ORBIT_RY;

      if (waveRef.current)    waveRef.current.setAttribute('d', wavePath);
      if (wave2Ref.current)   wave2Ref.current.setAttribute('d', wave2Path);
      if (wave3Ref.current)   wave3Ref.current.setAttribute('d', wave3Path);
      if (skyClipRef.current) skyClipRef.current.setAttribute('d', clipPath);
      if (sunRef.current) {
        sunRef.current.setAttribute('cx', sunX);
        sunRef.current.setAttribute('cy', sunY);
      }

      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      width={size}
      height={size}
      style={{ overflow: 'visible', color: 'var(--accent)', opacity: 0.7 }}
    >
      <defs>
        <clipPath id={clipId}>
          <path ref={skyClipRef} d={INITIAL_CLIP_PATH} />
        </clipPath>
      </defs>

      {/* Sun — clipped to the sky region so the wave occludes its lower portion */}
      <g clipPath={`url(#${clipId})`}>
        <circle
          ref={sunRef}
          cx={INITIAL_SUN_X}
          cy={INITIAL_SUN_Y}
          r={SUN_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE_WIDTH}
        />
      </g>

      {/* Main wave */}
      <path
        ref={waveRef}
        d={INITIAL_WAVE_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Second wave — shorter, centered beneath, phase-offset */}
      <path
        ref={wave2Ref}
        d={INITIAL_WAVE2_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Third wave — shortest, centered beneath the second */}
      <path
        ref={wave3Ref}
        d={INITIAL_WAVE3_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});
