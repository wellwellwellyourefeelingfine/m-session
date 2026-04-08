import { useEffect, useRef, useId, memo } from 'react';

// Canvas
const VIEWBOX_W       = 120;
const VIEWBOX_H       = 120;
const STROKE_WIDTH    = 6;

// Wave (sine path sampled across the full width)
const WAVE_BASELINE_Y = 75;   // horizon line — slightly below center, more sky than water
const WAVE_AMPLITUDE  = 4;
const WAVE_WAVELENGTH = 60;   // 2 visible crests across the 120-wide canvas
const WAVE_PERIOD     = 5;    // seconds for the wave to advance one full wavelength
const WAVE_SAMPLES    = 60;

// Sun (orbits in an ellipse centered on the horizon line)
const SUN_RADIUS      = 10;
const SUN_ORBIT_CX    = 60;
const SUN_ORBIT_CY    = WAVE_BASELINE_Y;
const SUN_ORBIT_RX    = 40;
const SUN_ORBIT_RY    = 35;

// Timeline (TOTAL = 15s = 3 × WAVE_PERIOD for a perfectly seamless wave seam)
const HIDDEN_DUR      = 3;    // sun travels invisibly under the horizon
const RISE_DUR        = 4;    // sun arcs from left horizon → apex (cubic ease-out)
const APEX_HOLD       = 4;    // sun holds at the apex (with ray-dot embellishment)
const DESCEND_DUR     = 4;    // sun arcs from apex → right horizon (cubic ease-in)
const TOTAL           = HIDDEN_DUR + RISE_DUR + APEX_HOLD + DESCEND_DUR;

const TWO_PI = Math.PI * 2;

// Ray-dot embellishment that briefly appears around the sun during the apex hold.
const SUN_APEX_X = SUN_ORBIT_CX;
const SUN_APEX_Y = SUN_ORBIT_CY - SUN_ORBIT_RY;
const RAY_DOT_OFFSET = 20;
const RAY_DOT_RADIUS = 2;
const RAY_DOTS = [
  { cx: SUN_APEX_X,                  cy: SUN_APEX_Y - RAY_DOT_OFFSET },  // top
  { cx: SUN_APEX_X + RAY_DOT_OFFSET, cy: SUN_APEX_Y                  },  // right
  { cx: SUN_APEX_X - RAY_DOT_OFFSET, cy: SUN_APEX_Y                  },  // left
];

// Ray-dot timing (relative to start of the apex hold)
const RAY_DOT_INITIAL_DELAY = 0.5;
const RAY_DOT_STAGGER       = 0.20;
const RAY_DOT_FADE_DUR      = 0.15;
const RAY_DOT_HOLD_DUR      = 1.90;
const RAY_DOT_OUT_STAGGER   = 0.15;

const RAY_DOT_TIMES = RAY_DOTS.map((_, i) => {
  const fadeInStart   = RAY_DOT_INITIAL_DELAY + i * RAY_DOT_STAGGER;
  const fadeInEnd     = fadeInStart + RAY_DOT_FADE_DUR;
  const lastFadeInEnd = RAY_DOT_INITIAL_DELAY + (RAY_DOTS.length - 1) * RAY_DOT_STAGGER + RAY_DOT_FADE_DUR;
  const holdEnd       = lastFadeInEnd + RAY_DOT_HOLD_DUR;
  const fadeOutStart  = holdEnd + i * RAY_DOT_OUT_STAGGER;
  const fadeOutEnd    = fadeOutStart + RAY_DOT_FADE_DUR;
  return { fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd };
});

function rayDotOpacity(apexElapsed, times) {
  if (apexElapsed < times.fadeInStart) return 0;
  if (apexElapsed < times.fadeInEnd) return (apexElapsed - times.fadeInStart) / RAY_DOT_FADE_DUR;
  if (apexElapsed < times.fadeOutStart) return 1;
  if (apexElapsed < times.fadeOutEnd) return 1 - (apexElapsed - times.fadeOutStart) / RAY_DOT_FADE_DUR;
  return 0;
}

function buildWavePath(waveOffset) {
  let d = '';
  for (let i = 0; i <= WAVE_SAMPLES; i++) {
    const x = (i / WAVE_SAMPLES) * VIEWBOX_W;
    const y = WAVE_BASELINE_Y + WAVE_AMPLITUDE * Math.sin(((x + waveOffset) / WAVE_WAVELENGTH) * TWO_PI);
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

  const visibleElapsed = elapsed - HIDDEN_DUR;

  if (visibleElapsed < RISE_DUR) {
    // Cubic ease-out on sin(angle) (= proportion of vertical travel from horizon to apex):
    // visible vertical velocity is at its maximum coming off the wave-line clip and smoothly
    // decelerates to a complete stop at the apex. No "pop" because the sun is moving fast
    // through the wave-line crossing — it doesn't linger.
    const t = visibleElapsed / RISE_DUR;
    const sinAngle = 1 - (1 - t) ** 3;
    return Math.asin(sinAngle);
  }

  if (visibleElapsed < RISE_DUR + APEX_HOLD) {
    return Math.PI / 2;
  }

  // Cubic ease-in on sin(angle): smooth start out of the apex, accelerating to its maximum
  // vertical velocity as it descends back through the wave-line clip. Mirror of the rise.
  const t = (visibleElapsed - RISE_DUR - APEX_HOLD) / DESCEND_DUR;
  const sinAngle = 1 - t ** 3;
  return Math.PI - Math.asin(sinAngle);
}

// Compute the elapsed=0 ("sun fully set, just past the right horizon") frame values
// so the JSX initial render matches the first RAF tick — avoids any first-paint flicker.
const INITIAL_WAVE_PATH = buildWavePath(0);
const INITIAL_CLIP_PATH = buildSkyClipPath(0);
const INITIAL_SUN_ANGLE = computeSunAngle(0);
const INITIAL_SUN_X = SUN_ORBIT_CX - Math.cos(INITIAL_SUN_ANGLE) * SUN_ORBIT_RX;
const INITIAL_SUN_Y = SUN_ORBIT_CY - Math.sin(INITIAL_SUN_ANGLE) * SUN_ORBIT_RY;

export default memo(function WaveLoopAnimation({ size = 120 }) {
  const waveRef    = useRef(null);
  const skyClipRef = useRef(null);
  const sunRef     = useRef(null);
  const rayDotRefs = useRef([]);
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
      const wavePath   = buildWavePath(waveOffset);
      const clipPath   = buildSkyClipPath(waveOffset);

      const sunAngle = computeSunAngle(elapsed);
      // -cos so angle 0 starts at the LEFT horizon; -sin so positive sin moves UP visually
      const sunX = SUN_ORBIT_CX - Math.cos(sunAngle) * SUN_ORBIT_RX;
      const sunY = SUN_ORBIT_CY - Math.sin(sunAngle) * SUN_ORBIT_RY;

      if (waveRef.current)    waveRef.current.setAttribute('d', wavePath);
      if (skyClipRef.current) skyClipRef.current.setAttribute('d', clipPath);
      if (sunRef.current) {
        sunRef.current.setAttribute('cx', sunX);
        sunRef.current.setAttribute('cy', sunY);
      }

      // Ray dots are visible only during the apex hold
      const visibleElapsed = elapsed - HIDDEN_DUR;
      const inApex = visibleElapsed >= RISE_DUR && visibleElapsed < RISE_DUR + APEX_HOLD;
      const apexElapsed = visibleElapsed - RISE_DUR;
      for (let i = 0; i < RAY_DOTS.length; i++) {
        const op = inApex ? rayDotOpacity(apexElapsed, RAY_DOT_TIMES[i]) : 0;
        const dot = rayDotRefs.current[i];
        if (dot) dot.setAttribute('opacity', op);
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

      {/* Wave on top */}
      <path
        ref={waveRef}
        d={INITIAL_WAVE_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ray dots — appear briefly around the sun during the apex hold */}
      {RAY_DOTS.map((dot, i) => (
        <circle
          key={i}
          ref={el => { rayDotRefs.current[i] = el; }}
          cx={dot.cx}
          cy={dot.cy}
          r={RAY_DOT_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          opacity={0}
        />
      ))}
    </svg>
  );
});
