import { useEffect, useRef, useId, memo } from 'react';

// Canvas
const VIEWBOX_W    = 120;
const VIEWBOX_H    = 120;
const STROKE_WIDTH = 6;

// Wave shape — identical to FullSun / Sunset for visual consistency.
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

// Sun — line-draws at half-covered position, then sets behind the waves.
// Does NOT reappear later; the moon rises alone.
const SUN_CX       = 60;
const SUN_RADIUS   = 32;
const SUN_DRAW_Y   = 92;    // line-draws here (half-behind waves)
const SUN_HIDDEN_Y = 130;   // fully behind waves

const SUN_PATH = `M ${SUN_CX},${SUN_DRAW_Y + SUN_RADIUS} A ${SUN_RADIUS},${SUN_RADIUS} 0 0,1 ${SUN_CX},${SUN_DRAW_Y - SUN_RADIUS} A ${SUN_RADIUS},${SUN_RADIUS} 0 0,1 ${SUN_CX},${SUN_DRAW_Y + SUN_RADIUS}`;

// Moon — standalone crescent (outer right semicircle + inner arc bulging right).
// Rises alone (no accompanying sun circle). Path built at full-sky position;
// transform handles the rise from hidden to top.
const MOON_TOP_POSITION_Y = 37;    // moon's final "top" position
const MOON_R              = SUN_RADIUS;
const MOON_INNER_R        = 40;    // slightly larger than MOON_R → moderate crescent thickness
const MOON_TOP_Y          = MOON_TOP_POSITION_Y - MOON_R;   // 5 — top horn
const MOON_BOTTOM_Y       = MOON_TOP_POSITION_Y + MOON_R;   // 69 — bottom horn

const MOON_PATH = `M ${SUN_CX},${MOON_TOP_Y} A ${MOON_R},${MOON_R} 0 0,1 ${SUN_CX},${MOON_BOTTOM_Y} A ${MOON_INNER_R},${MOON_INNER_R} 0 0,0 ${SUN_CX},${MOON_TOP_Y}`;

// Rotate the crescent 60° clockwise around its geometric center (which is
// also where the dot sits) so the top horn moves from 12:00 → 2:00.
const MOON_ROTATION_DEG = 60;

// Pollen dot — same size as Sunrise / FullSun. Two lives:
//   (1) drawn above the half-covered sun, then drifts behind the waves
//   (2) rises WITH the moon, held at moon center, then fades out
const DOT_R              = 1.5;
const DOT_HOME_X         = SUN_CX;
const DOT_HOME_Y         = 44;     // ~8.5-unit gap above sun's top stroke at SUN_DRAW_Y
const DOT_PATH           = `M${DOT_HOME_X},${DOT_HOME_Y - DOT_R} A${DOT_R},${DOT_R} 0 1,1 ${DOT_HOME_X},${DOT_HOME_Y + DOT_R} A${DOT_R},${DOT_R} 0 1,1 ${DOT_HOME_X},${DOT_HOME_Y - DOT_R}`;
const DOT_FALL_DISTANCE  = 56;     // from y=44 down to y=100 — well behind wave dip y=93
const DOT_SWAY_AMPLITUDE = 8;
const DOT_SWAY_CYCLES    = 1.25;
const DOT_SWAY_ONSET     = 0.4;

// Timeline (seconds).
// The dot-fall stagger matches Sunrise exactly: 1.5s after sun starts setting,
// the dot lets go — so there's a real visible overlap between sun setting and
// dot falling, not a long static gap.
const SUN_DRAW_DUR         = 3.0;
const DOT_ABOVE_DRAW_DUR   = 1.0;
const HOLD_BOTH_DUR        = 0.75;
const SUN_DESCENT_DUR      = 3.5;
const DOT_HOLD_AFTER_SET   = 1.5;   // Sunrise-style stagger: dot falls 1.5s into sun descent
const DOT_FALL_DUR         = 4.25;
const WAVES_ONLY_DUR       = 0.5;   // short breath before moon rises
const MOON_RISE_DUR        = 3.5;
const HOLD_WITH_DOT_DUR    = 1.0;   // user spec
const DOT_FADE_DUR         = 1.5;
const HOLD_MOON_ALONE_DUR  = 2.0;   // user spec
const MOON_FADE_DUR        = 1.5;
const HIDDEN_DUR           = 0.5;

// Phase boundaries (cumulative)
const SUN_DRAW_END         = SUN_DRAW_DUR;                                           // 3.00
const DOT_ABOVE_DRAW_END   = SUN_DRAW_END + DOT_ABOVE_DRAW_DUR;                      // 4.00
const SUN_DESCENT_START    = DOT_ABOVE_DRAW_END + HOLD_BOTH_DUR;                     // 4.75
const DOT_FALL_START       = SUN_DESCENT_START + DOT_HOLD_AFTER_SET;                 // 6.25
const SUN_DESCENT_END      = SUN_DESCENT_START + SUN_DESCENT_DUR;                    // 8.25
const DOT_FALL_END         = DOT_FALL_START + DOT_FALL_DUR;                          // 10.50
const MOON_RISE_START      = DOT_FALL_END + WAVES_ONLY_DUR;                          // 11.00
const MOON_RISE_END        = MOON_RISE_START + MOON_RISE_DUR;                        // 14.50
const HOLD_WITH_DOT_END    = MOON_RISE_END + HOLD_WITH_DOT_DUR;                      // 15.50
const DOT_FADE_START       = HOLD_WITH_DOT_END;                                      // 15.50
const DOT_FADE_END         = DOT_FADE_START + DOT_FADE_DUR;                          // 17.00
const HOLD_MOON_ALONE_END  = DOT_FADE_END + HOLD_MOON_ALONE_DUR;                     // 19.00
const MOON_FADE_START      = HOLD_MOON_ALONE_END;                                    // 19.00
const MOON_FADE_END        = MOON_FADE_START + MOON_FADE_DUR;                        // 20.50

const TOTAL = MOON_FADE_END + HIDDEN_DUR;                                            // 21.00

// Wave seam: shift by exact integer wavelengths per loop. Doubled (2 cycles)
// because the 21s loop is long — with 1 cycle the waves drift noticeably
// slower than Sunrise/FullSun/Sunset. Seam stays clean: 2 × wavelength (240)
// is a multiple of both wave 1 (120) and wave 2's effective wavelength (60).
const WAVE_VISUAL_CYCLES_PER_LOOP = 2;

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

// Trapezoidal velocity profile — matches FullSun's "lazy cruise" feel.
const RAMP = 0.3;
const PEAK_V = 1 / (1 - RAMP);
function easeTrapezoid(t) {
  if (t < RAMP)     return 0.5 * PEAK_V * t * t / RAMP;
  if (t < 1 - RAMP) return 0.5 * PEAK_V * RAMP + PEAK_V * (t - RAMP);
  const r = 1 - t;
  return 1 - 0.5 * PEAK_V * r * r / RAMP;
}

function computeSunY(elapsed) {
  if (elapsed < SUN_DESCENT_START) return SUN_DRAW_Y;
  if (elapsed < SUN_DESCENT_END) {
    const t = (elapsed - SUN_DESCENT_START) / SUN_DESCENT_DUR;
    return SUN_DRAW_Y + (SUN_HIDDEN_Y - SUN_DRAW_Y) * easeTrapezoid(t);
  }
  return SUN_HIDDEN_Y;
}

function computeSunDrawProgress(elapsed) {
  if (elapsed < SUN_DRAW_END) return smoothstep(elapsed / SUN_DRAW_DUR);
  return 1;
}

function computeMoonY(elapsed) {
  if (elapsed < MOON_RISE_START) return SUN_HIDDEN_Y;
  if (elapsed < MOON_RISE_END) {
    const t = (elapsed - MOON_RISE_START) / MOON_RISE_DUR;
    return SUN_HIDDEN_Y + (MOON_TOP_POSITION_Y - SUN_HIDDEN_Y) * easeTrapezoid(t);
  }
  return MOON_TOP_POSITION_Y;
}

function computeMoonOpacity(elapsed) {
  if (elapsed < MOON_FADE_START) return 1;
  if (elapsed < MOON_FADE_END) {
    const t = (elapsed - MOON_FADE_START) / MOON_FADE_DUR;
    return 1 - smoothstep(t);
  }
  return 0;
}

// Dot state needs the current moonY so the second-life dot rises in lockstep
// with the moon (dot stays at moon's circle center throughout the rise).
function computeDotState(elapsed, dotPathLength, moonY) {
  // Pre-draw
  if (elapsed < SUN_DRAW_END) {
    return { translateX: 0, translateY: 0, dashOffset: dotPathLength, opacity: 1 };
  }
  // Drawing above the sun (first life)
  if (elapsed < DOT_ABOVE_DRAW_END) {
    const t = (elapsed - SUN_DRAW_END) / DOT_ABOVE_DRAW_DUR;
    return { translateX: 0, translateY: 0, dashOffset: dotPathLength * (1 - smoothstep(t)), opacity: 1 };
  }
  // Drawn at home, waiting (through hold + first 1.5s of sun descent)
  if (elapsed < DOT_FALL_START) {
    return { translateX: 0, translateY: 0, dashOffset: 0, opacity: 1 };
  }
  // Falling with sway (matches Sunrise dynamics)
  if (elapsed < DOT_FALL_END) {
    const t = (elapsed - DOT_FALL_START) / DOT_FALL_DUR;
    const ty = smoothstep(t) * DOT_FALL_DISTANCE;
    const swayOnset = smoothstep(Math.min(1, t / DOT_SWAY_ONSET));
    const tx = Math.sin(t * TWO_PI * DOT_SWAY_CYCLES) * DOT_SWAY_AMPLITUDE * swayOnset * (1 - t);
    return { translateX: tx, translateY: ty, dashOffset: 0, opacity: 1 };
  }
  // Between fall and moon rise: dot at fall end (invisible behind waves)
  if (elapsed < MOON_RISE_START) {
    return { translateX: 0, translateY: DOT_FALL_DISTANCE, dashOffset: 0, opacity: 1 };
  }
  // Rising with the moon — dot's y tracks moonY. Snap from (0, FALL_DISTANCE) to
  // (0, SUN_HIDDEN_Y - DOT_HOME_Y) at MOON_RISE_START is invisible (both states
  // clipped behind waves).
  if (elapsed < MOON_RISE_END) {
    return { translateX: 0, translateY: moonY - DOT_HOME_Y, dashOffset: 0, opacity: 1 };
  }
  // At moon's top position, holding + fading
  const translateY = MOON_TOP_POSITION_Y - DOT_HOME_Y;
  if (elapsed < DOT_FADE_START) {
    return { translateX: 0, translateY, dashOffset: 0, opacity: 1 };
  }
  if (elapsed < DOT_FADE_END) {
    const t = (elapsed - DOT_FADE_START) / DOT_FADE_DUR;
    return { translateX: 0, translateY, dashOffset: 0, opacity: 1 - smoothstep(t) };
  }
  return { translateX: 0, translateY, dashOffset: 0, opacity: 0 };
}

// Pre-compute elapsed=0 frame so first paint matches the first RAF tick.
const INITIAL_WAVE_PATH  = buildWavePath(0);
const INITIAL_WAVE2_PATH = buildWavePath(0, WAVE2_START_X, WAVE2_END_X, WAVE2_BASELINE_Y, WAVE_AMPLITUDE, WAVE2_WAVELENGTH);
const INITIAL_CLIP_PATH  = buildSkyClipPath(0);

export default memo(function Moonrise({ size = 120 }) {
  const waveRef      = useRef(null);
  const wave2Ref     = useRef(null);
  const skyClipRef   = useRef(null);
  const sunPathRef   = useRef(null);
  const sunGroupRef  = useRef(null);
  const moonGroupRef = useRef(null);
  const dotPathRef   = useRef(null);
  const dotGroupRef  = useRef(null);
  const rafRef       = useRef(null);
  const startRef     = useRef(null);

  const reactId = useId();
  const clipId  = `moonrise-sky-${reactId.replace(/:/g, '')}`;

  useEffect(() => {
    const sunPath = sunPathRef.current;
    const dotPath = dotPathRef.current;
    let sunLen = 0;
    let dotLen = 0;
    if (sunPath) {
      sunLen = sunPath.getTotalLength();
      sunPath.style.strokeDasharray = sunLen;
      sunPath.style.strokeDashoffset = sunLen;
    }
    if (dotPath) {
      dotLen = dotPath.getTotalLength();
      dotPath.style.strokeDasharray = dotLen;
      dotPath.style.strokeDashoffset = dotLen;
    }
    if (sunGroupRef.current)  sunGroupRef.current.setAttribute('opacity', 1);
    if (moonGroupRef.current) moonGroupRef.current.setAttribute('opacity', 1);
    if (dotGroupRef.current)  dotGroupRef.current.setAttribute('opacity', 1);

    function animate(timestamp) {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = ((timestamp - startRef.current) / 1000) % TOTAL;

      const baseOffset = (elapsed / TOTAL) * WAVE_WAVELENGTH * WAVE_VISUAL_CYCLES_PER_LOOP;
      const wavePath   = buildWavePath(baseOffset * WAVE_SPEED);
      const wave2Path  = buildWavePath(baseOffset * WAVE2_SPEED, WAVE2_START_X, WAVE2_END_X, WAVE2_BASELINE_Y, WAVE_AMPLITUDE, WAVE2_WAVELENGTH);
      const clipPath   = buildSkyClipPath(baseOffset * WAVE_SPEED);

      const sunY            = computeSunY(elapsed);
      const sunDrawProgress = computeSunDrawProgress(elapsed);
      const moonY           = computeMoonY(elapsed);
      const moonOpacity     = computeMoonOpacity(elapsed);
      const dot             = computeDotState(elapsed, dotLen, moonY);

      if (waveRef.current)    waveRef.current.setAttribute('d', wavePath);
      if (wave2Ref.current)   wave2Ref.current.setAttribute('d', wave2Path);
      if (skyClipRef.current) skyClipRef.current.setAttribute('d', clipPath);

      if (sunPath) sunPath.style.strokeDashoffset = sunLen * (1 - sunDrawProgress);
      if (sunGroupRef.current) {
        const dy = sunY - SUN_DRAW_Y;
        if (dy !== 0) {
          sunGroupRef.current.setAttribute('transform', `translate(0, ${dy})`);
        } else {
          sunGroupRef.current.removeAttribute('transform');
        }
      }

      if (moonGroupRef.current) {
        moonGroupRef.current.setAttribute('opacity', moonOpacity);
        const dy = moonY - MOON_TOP_POSITION_Y;
        // Rotate around the moon's circle center (which is where the dot sits).
        // translate applied AFTER rotate so the rotation pivot stays in the
        // original coord system and the rotated crescent simply rises by dy.
        const rotation = `rotate(${MOON_ROTATION_DEG}, ${SUN_CX}, ${MOON_TOP_POSITION_Y})`;
        const transform = dy !== 0 ? `translate(0, ${dy}) ${rotation}` : rotation;
        moonGroupRef.current.setAttribute('transform', transform);
      }

      if (dotPath) dotPath.style.strokeDashoffset = dot.dashOffset;
      if (dotGroupRef.current) {
        dotGroupRef.current.setAttribute('opacity', dot.opacity);
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

      {/* Sun + moon + dot — clipped so the waves occlude them as needed */}
      <g clipPath={`url(#${clipId})`}>
        {/* Sun — line draws in (phase A), descends (phase D), stays hidden after */}
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

        {/* Moon — standalone crescent. Always drawn; visibility gated by transform
            (clipped behind waves until rise) and opacity (final fade). */}
        <g ref={moonGroupRef} opacity={0}>
          <path
            d={MOON_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Dot — reused for both lives: above sun → falls behind waves → rises with moon → fades */}
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
