import { useEffect, useRef, useId, memo } from 'react';

// Canvas
const VIEWBOX_W    = 120;
const VIEWBOX_H    = 120;
const STROKE_WIDTH = 6;

// Wave shape — shifted well below Sunrise / WaveLoop so the larger sun has
// clearance from the top edge AND a generous gap above the waves at full sky.
const WAVE_BASELINE_Y  = 89;
const WAVE_AMPLITUDE   = 4;
const WAVE_WAVELENGTH  = 120;
const WAVE2_WAVELENGTH = 90;
const WAVE_SAMPLES     = 60;

const WAVE_SPEED       = 1;
const WAVE2_BASELINE_Y = 107;
const WAVE2_SPEED      = 1.5;
const WAVE2_MARGIN     = 15;
const WAVE2_START_X    = WAVE2_MARGIN;
const WAVE2_END_X      = VIEWBOX_W - WAVE2_MARGIN;

// Sun — same R as Sunrise so it picks up exactly where Sunrise leaves off.
// SUN_DRAW_Y tracks the wave baseline so the sun is still "half behind waves"
// at draw position. SUN_FULL_SKY_Y stays high to maximize the rise — gap above
// the wave crest grows from ~3 units to ~13 units.
const SUN_CX           = 60;
const SUN_RADIUS       = 32;
const SUN_DRAW_Y       = 92;   // sun line-draws here, half behind the waves
const SUN_FULL_SKY_Y   = 37;   // sun's "fully in the sky" position

// Sun line-draw path — circle traced clockwise starting from the bottom point,
// which sits behind the waves at the draw position. Two semicircular arcs:
// bottom → left → top, then top → right → bottom. The dasharray reveal makes
// the line emerge from behind the wave on the left, trace over the top, then
// disappear behind the wave on the right.
const SUN_PATH = `M ${SUN_CX},${SUN_DRAW_Y + SUN_RADIUS} A ${SUN_RADIUS},${SUN_RADIUS} 0 0,1 ${SUN_CX},${SUN_DRAW_Y - SUN_RADIUS} A ${SUN_RADIUS},${SUN_RADIUS} 0 0,1 ${SUN_CX},${SUN_DRAW_Y + SUN_RADIUS}`;

// Pollen dot — same size as Sunrise; this time drawn at the sun's center.
const DOT_R              = 1.5;
const DOT_HOME_X         = SUN_CX;
const DOT_HOME_Y         = SUN_FULL_SKY_Y;
const DOT_PATH           = `M${DOT_HOME_X},${DOT_HOME_Y - DOT_R} A${DOT_R},${DOT_R} 0 1,1 ${DOT_HOME_X},${DOT_HOME_Y + DOT_R} A${DOT_R},${DOT_R} 0 1,1 ${DOT_HOME_X},${DOT_HOME_Y - DOT_R}`;
const DOT_FALL_DISTANCE  = 63;   // from y=37 down to y=100 — well behind the lower wave 1 dip
const DOT_SWAY_AMPLITUDE = 8;
const DOT_SWAY_CYCLES    = 1.25;
const DOT_SWAY_ONSET     = 0.4;  // sway ramps in over the first 40% of the fall

// Timeline (seconds). Sequenced as the user described:
//   draw → rise → hold → dot draws → both visible → sun fades → dot holds → dot drifts → hidden
const SUN_DRAW_DUR    = 3.75;  // relaxed line draw over the waves
const SUN_RISE_DUR    = 3.0;   // smooth, lazy trapezoidal rise to full sky
const PRE_DOT_HOLD    = 1.0;   // sun holds at top for a beat before the dot draws
const DOT_DRAW_DUR    = 0.75;
const PRE_FADE_HOLD   = 1.0;   // both visible — sun lingers before fading out
const SUN_FADE_DUR    = 1.5;
const POST_FADE_HOLD  = 0.25;
const DOT_FALL_DUR    = 4.5;
const HIDDEN_DUR      = 1.0;

const TOTAL = SUN_DRAW_DUR + SUN_RISE_DUR + PRE_DOT_HOLD + DOT_DRAW_DUR + PRE_FADE_HOLD + SUN_FADE_DUR + POST_FADE_HOLD + DOT_FALL_DUR + HIDDEN_DUR;
// = 16.75s — wave shifts by exactly one wavelength per loop (seamless seam),
// flow speed ~7.2 u/s (calm, fitting the more meditative pace).

// Phase boundaries (cumulative)
const SUN_DRAW_END    = SUN_DRAW_DUR;                       // 2.5
const SUN_RISE_END    = SUN_DRAW_END + SUN_RISE_DUR;        // 4.5
const DOT_DRAW_START  = SUN_RISE_END + PRE_DOT_HOLD;        // 5.0
const DOT_DRAW_END    = DOT_DRAW_START + DOT_DRAW_DUR;      // 5.75
const SUN_FADE_START  = DOT_DRAW_END + PRE_FADE_HOLD;       // 6.25
const SUN_FADE_END    = SUN_FADE_START + SUN_FADE_DUR;      // 7.75
const DOT_FALL_START  = SUN_FADE_END + POST_FADE_HOLD;      // 8.0
const DOT_FALL_END    = DOT_FALL_START + DOT_FALL_DUR;      // 12.5

// Wave seam: shift by exact integer wavelengths per loop (no snap at restart).
const WAVE_VISUAL_CYCLES_PER_LOOP = 1;

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

function buildSkyClipPath(waveOffset) {
  let d = 'M 0 0 L ' + VIEWBOX_W + ' 0';
  for (let i = WAVE_SAMPLES; i >= 0; i--) {
    const x = (i / WAVE_SAMPLES) * VIEWBOX_W;
    const y = WAVE_BASELINE_Y + WAVE_AMPLITUDE * Math.sin(((x + waveOffset) / WAVE_WAVELENGTH) * TWO_PI);
    d += ' L ' + x.toFixed(2) + ' ' + y.toFixed(2);
  }
  d += ' Z';
  return d;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

// Trapezoidal velocity profile: ramp up over the first `ramp` of the duration,
// cruise at constant velocity through the middle, ramp down over the last
// `ramp`. With ramp=0.3 the peak velocity is ~1.43× the average — much lazier
// than easeInOutCubic (3×) or easeInOutSine (1.57×). The constant middle is
// what gives the "smooth, lazy speed" feel without an accelerating crescendo.
const RISE_RAMP = 0.3;
const RISE_PEAK_V = 1 / (1 - RISE_RAMP);
function easeTrapezoid(t) {
  if (t < RISE_RAMP)     return 0.5 * RISE_PEAK_V * t * t / RISE_RAMP;
  if (t < 1 - RISE_RAMP) return 0.5 * RISE_PEAK_V * RISE_RAMP + RISE_PEAK_V * (t - RISE_RAMP);
  const r = 1 - t;
  return 1 - 0.5 * RISE_PEAK_V * r * r / RISE_RAMP;
}

function computeSunY(elapsed) {
  if (elapsed < SUN_DRAW_END) return SUN_DRAW_Y;
  if (elapsed < SUN_RISE_END) {
    const t = (elapsed - SUN_DRAW_END) / SUN_RISE_DUR;
    return SUN_DRAW_Y + (SUN_FULL_SKY_Y - SUN_DRAW_Y) * easeTrapezoid(t);
  }
  return SUN_FULL_SKY_Y;
}

function computeSunDrawProgress(elapsed) {
  if (elapsed < SUN_DRAW_END) return smoothstep(elapsed / SUN_DRAW_DUR);
  return 1;
}

function computeSunOpacity(elapsed) {
  if (elapsed < SUN_FADE_START) return 1;
  if (elapsed < SUN_FADE_END) {
    const t = (elapsed - SUN_FADE_START) / SUN_FADE_DUR;
    return 1 - smoothstep(t);
  }
  return 0;
}

function computeDotState(elapsed, dotPathLength) {
  if (elapsed < DOT_DRAW_START) {
    return { dashOffset: dotPathLength, translateX: 0, translateY: 0 };
  }
  if (elapsed < DOT_DRAW_END) {
    const t = (elapsed - DOT_DRAW_START) / DOT_DRAW_DUR;
    return { dashOffset: dotPathLength * (1 - smoothstep(t)), translateX: 0, translateY: 0 };
  }
  if (elapsed < DOT_FALL_START) {
    return { dashOffset: 0, translateX: 0, translateY: 0 };
  }
  if (elapsed < DOT_FALL_END) {
    const t = (elapsed - DOT_FALL_START) / DOT_FALL_DUR;
    const ty = smoothstep(t) * DOT_FALL_DISTANCE;
    const swayOnset = smoothstep(Math.min(1, t / DOT_SWAY_ONSET));
    const tx = Math.sin(t * TWO_PI * DOT_SWAY_CYCLES) * DOT_SWAY_AMPLITUDE * swayOnset * (1 - t);
    return { dashOffset: 0, translateX: tx, translateY: ty };
  }
  return { dashOffset: 0, translateX: 0, translateY: DOT_FALL_DISTANCE };
}

// Pre-compute elapsed=0 frame so first paint matches the first RAF tick.
const INITIAL_WAVE_PATH  = buildWavePath(0);
const INITIAL_WAVE2_PATH = buildWavePath(0, WAVE2_START_X, WAVE2_END_X, WAVE2_BASELINE_Y, WAVE_AMPLITUDE, WAVE2_WAVELENGTH);
const INITIAL_CLIP_PATH  = buildSkyClipPath(0);

export default memo(function FullSun({ size = 120 }) {
  const waveRef     = useRef(null);
  const wave2Ref    = useRef(null);
  const skyClipRef  = useRef(null);
  const sunPathRef  = useRef(null);
  const sunGroupRef = useRef(null);
  const dotPathRef  = useRef(null);
  const dotGroupRef = useRef(null);
  const rafRef      = useRef(null);
  const startRef    = useRef(null);

  const reactId = useId();
  const clipId  = `fullsun-sky-${reactId.replace(/:/g, '')}`;

  useEffect(() => {
    // Measure both paths so we can drive draw-in via stroke-dashoffset.
    const sunPath = sunPathRef.current;
    const dotPath = dotPathRef.current;
    let sunLen = 0;
    let dotLen = 0;
    if (sunPath) {
      sunLen = sunPath.getTotalLength();
      sunPath.style.strokeDasharray = sunLen;
      sunPath.style.strokeDashoffset = sunLen;  // hidden initially
    }
    if (dotPath) {
      dotLen = dotPath.getTotalLength();
      dotPath.style.strokeDasharray = dotLen;
      dotPath.style.strokeDashoffset = dotLen;  // hidden initially
    }
    if (sunGroupRef.current) sunGroupRef.current.setAttribute('opacity', 1);
    if (dotGroupRef.current) dotGroupRef.current.setAttribute('opacity', 1);

    function animate(timestamp) {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = ((timestamp - startRef.current) / 1000) % TOTAL;

      const baseOffset = (elapsed / TOTAL) * WAVE_WAVELENGTH * WAVE_VISUAL_CYCLES_PER_LOOP;
      const wavePath   = buildWavePath(baseOffset * WAVE_SPEED);
      const wave2Path  = buildWavePath(baseOffset * WAVE2_SPEED, WAVE2_START_X, WAVE2_END_X, WAVE2_BASELINE_Y, WAVE_AMPLITUDE, WAVE2_WAVELENGTH);
      const clipPath   = buildSkyClipPath(baseOffset * WAVE_SPEED);

      const sunY            = computeSunY(elapsed);
      const sunDrawProgress = computeSunDrawProgress(elapsed);
      const sunOpacity      = computeSunOpacity(elapsed);
      const dot             = computeDotState(elapsed, dotLen);

      if (waveRef.current)    waveRef.current.setAttribute('d', wavePath);
      if (wave2Ref.current)   wave2Ref.current.setAttribute('d', wave2Path);
      if (skyClipRef.current) skyClipRef.current.setAttribute('d', clipPath);

      if (sunPath) sunPath.style.strokeDashoffset = sunLen * (1 - sunDrawProgress);
      if (sunGroupRef.current) {
        sunGroupRef.current.setAttribute('opacity', sunOpacity);
        const dy = sunY - SUN_DRAW_Y;
        if (dy !== 0) {
          sunGroupRef.current.setAttribute('transform', `translate(0, ${dy})`);
        } else {
          sunGroupRef.current.removeAttribute('transform');
        }
      }

      if (dotPath) dotPath.style.strokeDashoffset = dot.dashOffset;
      if (dotGroupRef.current) {
        if (dot.translateX !== 0 || dot.translateY !== 0) {
          dotGroupRef.current.setAttribute('transform', `translate(${dot.translateX}, ${dot.translateY})`);
        } else {
          dotGroupRef.current.removeAttribute('transform');
        }
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

      {/* Sun + dot — both clipped so the waves naturally occlude them */}
      <g clipPath={`url(#${clipId})`}>
        {/* Sun group — opacity for fade-out, transform for the rise.
            Inner path reveals via stroke-dashoffset (line-draw effect). */}
        <g ref={sunGroupRef} opacity={0}>
          <path
            ref={sunPathRef}
            d={SUN_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Dot group — gated until the effect primes the dasharray. */}
        <g ref={dotGroupRef} opacity={0}>
          <path
            ref={dotPathRef}
            d={DOT_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
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

      {/* Second wave — shorter, centered beneath */}
      <path
        ref={wave2Ref}
        d={INITIAL_WAVE2_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});
