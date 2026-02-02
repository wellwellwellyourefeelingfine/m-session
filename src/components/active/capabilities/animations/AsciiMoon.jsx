/**
 * AsciiMoon Component
 *
 * A looping ASCII art moon animation with two independent timing cycles:
 * 1. Phase cycle (fast): Controls fill level (new → full → new)
 * 2. Rotation cycle (slow): Rotates the sweep direction
 *
 * The drift between wax and wane positions emerges naturally from
 * the interaction of these two cycles - no state tracking needed.
 *
 * Animation features:
 * - S-curve easing creates trickle→cascade→trickle effect
 * - State-based transitions ensure all characters complete before pausing
 * - Sweep direction slowly rotates for subtle drift effect
 */

import { memo, useState, useEffect, useRef, useMemo } from 'react';

// Character sets
const DENSE = ['M', 'D', 'M', 'A'];
const SPARSE = ['.', ':', ';', ',', "'", '`'];
const MID = ['+', '=', '*', '~', '-'];

// Grid configuration
const SIZE = 20;
const CENTER_X = SIZE / 2;
const CENTER_Y = SIZE / 2;
const RADIUS = 8;

// Timing configuration
const RENDER_INTERVAL = 50;
const PHASE_DURATION = 10000;      // 10s for one new→full→new cycle
const ROTATION_DURATION = 120000;  // 120s for sweep direction to complete 360°
const CHAR_CHANGE_INTERVAL = 150;  // Staggered character updates
const PAUSE_DURATION = 800;        // ms to pause at full/new moon

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Smooth S-curve for trickle→cascade→trickle effect
 * Characters trickle in slowly at start, accelerate through middle, taper off at end
 * Output range [-0.15, 1.15] to cover cell randomOffsets
 */
const smoothEase = (t) => {
  // Clamp input to [0,1]
  const clamped = Math.max(0, Math.min(1, t));

  // Power curve: slow at edges, faster in middle
  // Using power of 1.75 for gentle, smooth transitions
  let eased;
  if (clamped < 0.5) {
    eased = Math.pow(2 * clamped, 1.75) / 2;
  } else {
    eased = 1 - Math.pow(2 * (1 - clamped), 1.75) / 2;
  }

  // Expand range from [0,1] to [-0.15, 1.15] to cover randomOffsets
  return -0.15 + eased * 1.3;
};

export default memo(function AsciiMoon({ className = '' }) {
  const [output, setOutput] = useState('');
  const animationRef = useRef(null);
  const lastRenderRef = useRef(0);

  // State-based phase tracking
  const phaseStateRef = useRef({
    phase: 'waxing', // 'waxing', 'full-pause', 'waning', 'new-pause'
    sweepProgress: 0, // 0 to 1 for sweep animation
    pauseStartTime: null,
    lastUpdateTime: Date.now(),
  });

  // Pre-compute static grid data
  const gridData = useMemo(() => {
    const grid = [];
    for (let y = 0; y < SIZE; y++) {
      const row = [];
      for (let x = 0; x < SIZE; x++) {
        const dx = (x - CENTER_X + 0.5) / RADIUS; // Normalized -1 to 1
        const dy = (y - CENTER_Y + 0.5) / RADIUS;
        const dist = Math.sqrt(dx * dx + dy * dy);

        row.push({
          dx,
          dy,
          inCircle: dist <= 1,
          randomOffset: Math.random() * 0.25 - 0.125, // Fuzzy terminator edge (±0.125)
          timeOffset: Math.random() * CHAR_CHANGE_INTERVAL, // Staggered updates
          currentChar: null,
        });
      }
      grid.push(row);
    }
    return grid;
  }, []);

  const render = (now) => {
    const state = phaseStateRef.current;
    const deltaTime = now - state.lastUpdateTime;
    state.lastUpdateTime = now;

    // Rotation is purely time-based (independent of phase state)
    const rotationProgress = (now % ROTATION_DURATION) / ROTATION_DURATION;
    const rotationAngle = rotationProgress * 2 * Math.PI;
    const cosR = Math.cos(rotationAngle);
    const sinR = Math.sin(rotationAngle);

    // Calculate sweep position
    // During pauses, use a value that guarantees all cells are in correct state
    let sweepPosition;
    if (state.phase === 'full-pause') {
      // All cells should be lit - use value beyond max threshold
      sweepPosition = 1.15;
    } else if (state.phase === 'new-pause') {
      // All cells should be dark - use value beyond max threshold
      sweepPosition = 1.15;
    } else {
      // During transitions, use the eased value
      sweepPosition = smoothEase(state.sweepProgress);
    }

    // Determine expected lit state based on phase
    // Waxing: light is spreading (lit when sweep passes)
    // Waning: darkness is spreading (lit when sweep hasn't reached)
    const isWaxing = state.phase === 'waxing' || state.phase === 'full-pause';

    // Track if all moon cells match expected final state
    let allTransitioned = true;

    let out = '';
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const cell = gridData[y][x];

        // Staggered update timing for organic feel
        const cellTime = now + cell.timeOffset;
        const shouldUpdate =
          Math.floor(cellTime / CHAR_CHANGE_INTERVAL) !==
          Math.floor((cellTime - RENDER_INTERVAL) / CHAR_CHANGE_INTERVAL);

        if (!cell.inCircle) {
          // Background: random mid-tone characters
          if (shouldUpdate || cell.currentChar === null) {
            cell.currentChar = pick(MID);
          }
          out += cell.currentChar;
          continue;
        }

        // Project cell position onto the rotating sweep axis
        const projection = cell.dx * cosR + cell.dy * sinR;
        const normalizedPosition = (projection + 1) / 2;

        // Determine if cell should be lit
        const cellThreshold = normalizedPosition + cell.randomOffset;
        const lit = isWaxing
          ? cellThreshold < sweepPosition
          : cellThreshold >= sweepPosition;

        // Check if this cell matches the expected final state for transition
        if (state.phase === 'waxing' && state.sweepProgress >= 1 && !lit) {
          allTransitioned = false;
        } else if (state.phase === 'waning' && state.sweepProgress >= 1 && lit) {
          allTransitioned = false;
        }

        if (shouldUpdate || cell.currentChar === null) {
          cell.currentChar = lit ? pick(SPARSE) : pick(DENSE);
        } else {
          const charSet = lit ? SPARSE : DENSE;
          if (!charSet.includes(cell.currentChar)) {
            cell.currentChar = pick(charSet);
          }
        }

        out += cell.currentChar;
      }
      out += '\n';
    }

    // State machine for phase transitions
    const sweepDuration = (PHASE_DURATION - 2 * PAUSE_DURATION) / 2;

    if (state.phase === 'waxing') {
      state.sweepProgress += deltaTime / sweepDuration;
      if (state.sweepProgress >= 1 && allTransitioned) {
        state.phase = 'full-pause';
        state.pauseStartTime = now;
        state.sweepProgress = 0;
      }
    } else if (state.phase === 'full-pause') {
      if (now - state.pauseStartTime >= PAUSE_DURATION) {
        state.phase = 'waning';
        state.sweepProgress = 0;
      }
    } else if (state.phase === 'waning') {
      state.sweepProgress += deltaTime / sweepDuration;
      if (state.sweepProgress >= 1 && allTransitioned) {
        state.phase = 'new-pause';
        state.pauseStartTime = now;
        state.sweepProgress = 1;
      }
    } else if (state.phase === 'new-pause') {
      if (now - state.pauseStartTime >= PAUSE_DURATION) {
        state.phase = 'waxing';
        state.sweepProgress = 0;
      }
    }

    return out;
  };

  useEffect(() => {
    const loop = (timestamp) => {
      if (timestamp - lastRenderRef.current >= RENDER_INTERVAL) {
        setOutput(render(Date.now()));
        lastRenderRef.current = timestamp;
      }
      animationRef.current = requestAnimationFrame(loop);
    };

    setOutput(render(Date.now()));
    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gridData]);

  return (
    <pre
      className={`font-mono text-[8px] leading-[0.93] tracking-[0.3em] whitespace-pre select-none ${className}`}
      style={{ color: 'var(--accent)', opacity: 0.7 }}
    >
      {output}
    </pre>
  );
});
