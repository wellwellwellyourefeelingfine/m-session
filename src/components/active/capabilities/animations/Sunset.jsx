import { useEffect, useRef, useId, memo } from 'react';

// Canvas
const VIEWBOX_W    = 120;
const VIEWBOX_H    = 120;
const STROKE_WIDTH = 6;

// Wave shape — identical to FullSun so the two animations share the same
// sky/water geometry and can visually pick up from each other.
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

// Sun — same radius as Sunrise / FullSun. Starts at the apex (FullSun's
// SUN_FULL_SKY_Y) and descends to FullSun's SUN_DRAW_Y so this animation
// ends exactly where FullSun begins.
const SUN_CX     = 60;
const SUN_RADIUS = 32;
const SUN_APEX_Y = 37;   // sun line-draws here (fully above the waves)
const SUN_END_Y  = 92;   // sun descends to here (half-behind the waves)

// Sun line-draw path — circle traced clockwise from the bottom point at apex.
// At apex the full path is above the waves, so the entire line-draw reveal is
// visible (no clipping). The wrapping <g>'s transform handles the descent.
const SUN_PATH = `M ${SUN_CX},${SUN_APEX_Y + SUN_RADIUS} A ${SUN_RADIUS},${SUN_RADIUS} 0 0,1 ${SUN_CX},${SUN_APEX_Y - SUN_RADIUS} A ${SUN_RADIUS},${SUN_RADIUS} 0 0,1 ${SUN_CX},${SUN_APEX_Y + SUN_RADIUS}`;

// Pollen dot — same size as Sunrise / FullSun, drawn at the sun's center.
// Only fades (no fall/sway) in this animation.
const DOT_R        = 1.5;
const DOT_HOME_X   = SUN_CX;
const DOT_HOME_Y   = SUN_APEX_Y;
const DOT_PATH     = `M${DOT_HOME_X},${DOT_HOME_Y - DOT_R} A${DOT_R},${DOT_R} 0 1,1 ${DOT_HOME_X},${DOT_HOME_Y + DOT_R} A${DOT_R},${DOT_R} 0 1,1 ${DOT_HOME_X},${DOT_HOME_Y - DOT_R}`;

// Timeline (seconds). Sequenced as the user described:
//   dot draws → sun starts drawing (dot ~80% done) → hold → dot fades → brief hold →
//   sun descends → longer hold → sun fades → hidden
const DOT_DRAW_DUR         = 1.25;  // dot draws first, alone
const SUN_DRAW_DELAY       = 1.0;   // sun starts when dot is ~80% drawn (stagger)
const SUN_DRAW_DUR         = 3.5;   // sun line-draw duration (longer than dot)
const POST_DRAW_HOLD       = 1.0;   // both visible at apex
const DOT_FADE_DUR         = 1.5;   // dot fades out, sun stays
const POST_DOT_FADE_HOLD   = 0.5;   // sun alone before descent
const SUN_DESCENT_DUR      = 4.5;   // slow descent with trapezoidal easing
const POST_DESCENT_HOLD    = 1.5;   // sun rests half-behind waves (longer)
const SUN_FADE_DUR         = 1.5;   // sun fades — clean loop seam
const HIDDEN_DUR           = 0.75;

// Phase boundaries (cumulative)
const DOT_DRAW_END     = DOT_DRAW_DUR;                          // 1.25
const SUN_DRAW_END     = SUN_DRAW_DELAY + SUN_DRAW_DUR;         // 4.5
const POST_DRAW_END    = SUN_DRAW_END + POST_DRAW_HOLD;         // 5.5
const DOT_FADE_END     = POST_DRAW_END + DOT_FADE_DUR;          // 7.0
const DESCENT_START    = DOT_FADE_END + POST_DOT_FADE_HOLD;     // 7.5
const DESCENT_END      = DESCENT_START + SUN_DESCENT_DUR;       // 12.0
const POST_DESCENT_END = DESCENT_END + POST_DESCENT_HOLD;       // 13.5
const SUN_FADE_END     = POST_DESCENT_END + SUN_FADE_DUR;       // 15.0

const TOTAL = SUN_FADE_END + HIDDEN_DUR;
// = 15.75s — wave shifts by exactly one wavelength per loop (seamless seam),
// flow speed ~7.6 u/s (calm, between FullSun's 7.2 and Sunrise's 8.9).

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

// Trapezoidal velocity profile — same shape as FullSun's rise so the descent
// feels symmetric. Ramp up for the first 30%, cruise at constant velocity for
// the middle 40%, ramp down for the last 30%. Peak velocity ~1.43× the average.
const DESCENT_RAMP = 0.3;
const DESCENT_PEAK_V = 1 / (1 - DESCENT_RAMP);
function easeTrapezoid(t) {
  if (t < DESCENT_RAMP)     return 0.5 * DESCENT_PEAK_V * t * t / DESCENT_RAMP;
  if (t < 1 - DESCENT_RAMP) return 0.5 * DESCENT_PEAK_V * DESCENT_RAMP + DESCENT_PEAK_V * (t - DESCENT_RAMP);
  const r = 1 - t;
  return 1 - 0.5 * DESCENT_PEAK_V * r * r / DESCENT_RAMP;
}

function computeSunY(elapsed) {
  if (elapsed < DESCENT_START) return SUN_APEX_Y;
  if (elapsed < DESCENT_END) {
    const t = (elapsed - DESCENT_START) / SUN_DESCENT_DUR;
    return SUN_APEX_Y + (SUN_END_Y - SUN_APEX_Y) * easeTrapezoid(t);
  }
  return SUN_END_Y;
}

function computeSunDrawProgress(elapsed) {
  if (elapsed < SUN_DRAW_DELAY) return 0;
  if (elapsed < SUN_DRAW_END) return smoothstep((elapsed - SUN_DRAW_DELAY) / SUN_DRAW_DUR);
  return 1;
}

function computeSunOpacity(elapsed) {
  if (elapsed < POST_DESCENT_END) return 1;
  if (elapsed < SUN_FADE_END) {
    const t = (elapsed - POST_DESCENT_END) / SUN_FADE_DUR;
    return 1 - smoothstep(t);
  }
  return 0;
}

function computeDotState(elapsed, dotPathLength) {
  // Drawing in — starts first, finishes well before the sun
  if (elapsed < DOT_DRAW_END) {
    const t = elapsed / DOT_DRAW_DUR;
    return { dashOffset: dotPathLength * (1 - smoothstep(t)), opacity: 1 };
  }
  // Drawn, holding (through sun's remaining draw + post-draw hold)
  if (elapsed < POST_DRAW_END) {
    return { dashOffset: 0, opacity: 1 };
  }
  // Fading out
  if (elapsed < DOT_FADE_END) {
    const t = (elapsed - POST_DRAW_END) / DOT_FADE_DUR;
    return { dashOffset: 0, opacity: 1 - smoothstep(t) };
  }
  // Fully faded
  return { dashOffset: 0, opacity: 0 };
}

// Pre-compute elapsed=0 frame so first paint matches the first RAF tick.
const INITIAL_WAVE_PATH  = buildWavePath(0);
const INITIAL_WAVE2_PATH = buildWavePath(0, WAVE2_START_X, WAVE2_END_X, WAVE2_BASELINE_Y, WAVE_AMPLITUDE, WAVE2_WAVELENGTH);
const INITIAL_CLIP_PATH  = buildSkyClipPath(0);

export default memo(function Sunset({ size = 120 }) {
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
  const clipId  = `sunset-sky-${reactId.replace(/:/g, '')}`;

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
        const dy = sunY - SUN_APEX_Y;
        if (dy !== 0) {
          sunGroupRef.current.setAttribute('transform', `translate(0, ${dy})`);
        } else {
          sunGroupRef.current.removeAttribute('transform');
        }
      }

      if (dotPath) dotPath.style.strokeDashoffset = dot.dashOffset;
      if (dotGroupRef.current) dotGroupRef.current.setAttribute('opacity', dot.opacity);

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

      {/* Sun + dot — both clipped so the waves occlude the sun's bottom half at end position */}
      <g clipPath={`url(#${clipId})`}>
        {/* Sun group — opacity for fade, transform for descent.
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

        {/* Dot group — opacity for draw-in + fade-out. No translate in Sunset. */}
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
