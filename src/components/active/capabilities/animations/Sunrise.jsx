import { useEffect, useRef, useId, memo } from 'react';

// Canvas
const VIEWBOX_W    = 120;
const VIEWBOX_H    = 120;
const STROKE_WIDTH = 6;

// Wave shape
const WAVE_BASELINE_Y  = 75;
const WAVE_AMPLITUDE   = 4;
const WAVE_WAVELENGTH  = 120;
const WAVE2_WAVELENGTH = 90;
const WAVE_SAMPLES     = 60;

const WAVE_SPEED       = 1;
const WAVE2_BASELINE_Y = 93;
const WAVE2_SPEED      = 1.5;
const WAVE2_MARGIN     = 15;
const WAVE2_START_X    = WAVE2_MARGIN;
const WAVE2_END_X      = VIEWBOX_W - WAVE2_MARGIN;

// Sun — large; same apex height (top about half visible above the wave).
const SUN_CX           = 60;
const SUN_RADIUS       = 32;
const SUN_REST_Y       = 116;   // fully hidden behind the waves (top edge below wave dip)
const SUN_APEX_Y       = 78;

// Pollen dot — drawn arc (stroke-dashoffset reveal, matches LeafDraw V2).
// Path is centered at DOT_HOME_(X,Y); a wrapping <g> handles fall + sway via transform.
const DOT_R            = 1.5;
const DOT_HOME_X       = SUN_CX;
const DOT_HOME_Y       = 30;     // clear gap above the larger sun's apex top edge
const DOT_PATH         = `M${DOT_HOME_X},${DOT_HOME_Y - DOT_R} A${DOT_R},${DOT_R} 0 1,1 ${DOT_HOME_X},${DOT_HOME_Y + DOT_R} A${DOT_R},${DOT_R} 0 1,1 ${DOT_HOME_X},${DOT_HOME_Y - DOT_R}`;
const DOT_FALL_DISTANCE  = 56;   // from y=30 down to y=86 — well behind the waves
const DOT_SWAY_AMPLITUDE = 8;
const DOT_SWAY_CYCLES    = 1.25;
const DOT_SWAY_ONSET     = 0.4;  // sway ramps from 0→full over the first 40% of the fall
                                 // so the dot first drops straight down before drifting

// Timeline (seconds).
const RISE_DUR    = 6;
const APEX_HOLD   = 1.5;
const SET_DUR     = 4;
const HIDDEN_DUR  = 2;
const TOTAL       = RISE_DUR + APEX_HOLD + SET_DUR + HIDDEN_DUR;  // 13.5s

const APEX_START   = RISE_DUR;                    // 6
const SET_START    = APEX_START + APEX_HOLD;      // 7.5
const HIDDEN_START = SET_START + SET_DUR;         // 11.5

// Dot lifecycle — drawn at apex, holds a beat after the sun starts setting,
// then drifts down with leaf-like sway.
const DOT_DRAW_START      = APEX_START;             // 6
const DOT_DRAW_DUR        = 1.0;
const DOT_DRAW_END        = DOT_DRAW_START + DOT_DRAW_DUR;   // 7
// The sun uses easeInOutCubic, so its first second of setting is barely visible
// (~6% of its travel). The hold has to outlast that initial slow phase to read
// as a real stagger — at HOLD=1.5 the sun is ~21% set when the dot lets go.
const DOT_HOLD_AFTER_SET  = 1.5;
const DOT_FALL_START      = SET_START + DOT_HOLD_AFTER_SET;  // 9.0
const DOT_FALL_DUR        = 4.25;                   // ends at 13.25, just before loop seam

// Wave seam: the wave shifts by an exact integer number of wavelengths per
// loop so the seam is invisible. Visual cycles per loop tunes wave flow speed.
//   1 cycle → ~8.9 units/sec (calmer than WaveLoop's 13.3 — fitting for sunrise)
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

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function computeSunY(elapsed) {
  if (elapsed < APEX_START) {
    return SUN_REST_Y + (SUN_APEX_Y - SUN_REST_Y) * easeInOutCubic(elapsed / RISE_DUR);
  }
  if (elapsed < SET_START) return SUN_APEX_Y;
  if (elapsed < HIDDEN_START) {
    return SUN_APEX_Y + (SUN_REST_Y - SUN_APEX_Y) * easeInOutCubic((elapsed - SET_START) / SET_DUR);
  }
  return SUN_REST_Y;
}

function computeDotState(elapsed, dotPathLength) {
  // Pre-draw: hidden by full dashoffset.
  if (elapsed < DOT_DRAW_START) {
    return { dashOffset: dotPathLength, translateX: 0, translateY: 0 };
  }
  // Drawing in (during apex hold).
  if (elapsed < DOT_DRAW_END) {
    const t = (elapsed - DOT_DRAW_START) / DOT_DRAW_DUR;
    return { dashOffset: dotPathLength * (1 - smoothstep(t)), translateX: 0, translateY: 0 };
  }
  // Drawn, holding in place (rest of apex + 0.25s after sun starts setting).
  if (elapsed < DOT_FALL_START) {
    return { dashOffset: 0, translateX: 0, translateY: 0 };
  }
  // Drifting down with leaf-like sway that ramps in (so the dot first falls
  // straight down before drifting) and decays again toward the end.
  if (elapsed < DOT_FALL_START + DOT_FALL_DUR) {
    const t = (elapsed - DOT_FALL_START) / DOT_FALL_DUR;
    const ty = smoothstep(t) * DOT_FALL_DISTANCE;
    const swayOnset = smoothstep(Math.min(1, t / DOT_SWAY_ONSET));
    const tx = Math.sin(t * TWO_PI * DOT_SWAY_CYCLES) * DOT_SWAY_AMPLITUDE * swayOnset * (1 - t);
    return { dashOffset: 0, translateX: tx, translateY: ty };
  }
  // After fall — settled at end (clipped by waves).
  return { dashOffset: 0, translateX: 0, translateY: DOT_FALL_DISTANCE };
}

// Pre-compute elapsed=0 frame so first paint matches the first RAF tick.
const INITIAL_WAVE_PATH  = buildWavePath(0);
const INITIAL_WAVE2_PATH = buildWavePath(0, WAVE2_START_X, WAVE2_END_X, WAVE2_BASELINE_Y, WAVE_AMPLITUDE, WAVE2_WAVELENGTH);
const INITIAL_CLIP_PATH  = buildSkyClipPath(0);
const INITIAL_SUN_Y      = computeSunY(0);

export default memo(function Sunrise({ size = 120 }) {
  const waveRef     = useRef(null);
  const wave2Ref    = useRef(null);
  const skyClipRef  = useRef(null);
  const sunRef      = useRef(null);
  const dotPathRef  = useRef(null);
  const dotGroupRef = useRef(null);
  const rafRef      = useRef(null);
  const startRef    = useRef(null);

  const reactId = useId();
  const clipId  = `sunrise-sky-${reactId.replace(/:/g, '')}`;

  useEffect(() => {
    // Measure dot path so we can drive the draw-in via stroke-dashoffset
    // (same technique as LeafDraw V2).
    const dotPath = dotPathRef.current;
    let dotLen = 0;
    if (dotPath) {
      dotLen = dotPath.getTotalLength();
      dotPath.style.strokeDasharray = dotLen;
      dotPath.style.strokeDashoffset = dotLen;
    }
    if (dotGroupRef.current) {
      dotGroupRef.current.setAttribute('opacity', 1);
    }

    function animate(timestamp) {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = ((timestamp - startRef.current) / 1000) % TOTAL;

      // Total wave shift over one loop = WAVE_VISUAL_CYCLES_PER_LOOP * WAVE_WAVELENGTH.
      // Both 120 (wave 1) and 90 (wave 2 wavelength × WAVE2_SPEED) divide that exactly,
      // so both waves return to phase 0 at the loop seam.
      const baseOffset = (elapsed / TOTAL) * WAVE_WAVELENGTH * WAVE_VISUAL_CYCLES_PER_LOOP;
      const wavePath   = buildWavePath(baseOffset * WAVE_SPEED);
      const wave2Path  = buildWavePath(baseOffset * WAVE2_SPEED, WAVE2_START_X, WAVE2_END_X, WAVE2_BASELINE_Y, WAVE_AMPLITUDE, WAVE2_WAVELENGTH);
      const clipPath   = buildSkyClipPath(baseOffset * WAVE_SPEED);

      const sunY    = computeSunY(elapsed);
      const dot     = computeDotState(elapsed, dotLen);

      if (waveRef.current)    waveRef.current.setAttribute('d', wavePath);
      if (wave2Ref.current)   wave2Ref.current.setAttribute('d', wave2Path);
      if (skyClipRef.current) skyClipRef.current.setAttribute('d', clipPath);
      if (sunRef.current)     sunRef.current.setAttribute('cy', sunY);

      if (dotPath) {
        dotPath.style.strokeDashoffset = dot.dashOffset;
      }
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
        <circle
          ref={sunRef}
          cx={SUN_CX}
          cy={INITIAL_SUN_Y}
          r={SUN_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE_WIDTH}
        />
        {/* Dot group — opacity gated until the effect measures the path length
            and primes stroke-dashoffset. Inner path then reveals via dashoffset. */}
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
