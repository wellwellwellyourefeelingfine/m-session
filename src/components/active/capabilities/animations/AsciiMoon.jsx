/**
 * AsciiMoon Component
 *
 * A looping ASCII art animation featuring a moon that cycles through phases.
 * The moon is rendered using MDMA letters for dense areas and various
 * punctuation for sparse/lit areas, creating a waxing/waning effect.
 *
 * Animation cycle: 10 seconds
 * - Waxing phase (moon fills with light)
 * - Brief pause at full
 * - Waning phase (moon empties)
 * - Brief pause at new
 */

import { useState, useEffect, useRef, useMemo } from 'react';

// Character sets for rendering
const DENSE = ['M', 'D', 'M', 'A'];
const SPARSE = ['.', ':', ';', ',', "'", '`', '-'];
const MID = ['x', 'o', '+', '=', '*', '~'];

// Grid configuration
const SIZE = 20;
const CENTER_X = SIZE / 2;
const CENTER_Y = SIZE / 2;
const RADIUS = 8;

// Animation timing
const RENDER_INTERVAL = 50; // ms between frames (faster for staggered updates)
const CYCLE_DURATION = 10000; // ms for full cycle
const CHAR_CHANGE_INTERVAL = 150; // ms - each character changes on its own schedule

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * @param {Object} props
 * @param {string} props.className - Additional CSS classes
 */
export default function AsciiMoon({ className = '' }) {
  const [output, setOutput] = useState('');
  const animationRef = useRef(null);
  const lastRenderRef = useRef(0);

  // Generate stable grid data (randomized once per mount)
  // Each cell has: threshold (for phase), timeOffset (for staggered updates), lastChange (timestamp)
  const gridData = useMemo(() => {
    const grid = [];
    for (let y = 0; y < SIZE; y++) {
      const row = [];
      for (let x = 0; x < SIZE; x++) {
        const nx = 0.1 + (x / SIZE) * 0.8;
        row.push({
          threshold: nx + (Math.random() * 0.15 - 0.075),
          timeOffset: Math.random() * CHAR_CHANGE_INTERVAL, // random offset for staggered timing
          currentChar: null, // will be set on first render
        });
      }
      grid.push(row);
    }
    return grid;
  }, []);

  // Eased phase function for smooth transitions with pauses
  const easedPhase = (t) => {
    if (t < 0.15) return 0;
    if (t < 0.425) return ((t - 0.15) / 0.275) * 0.5;
    if (t < 0.575) return 0.5;
    if (t < 0.85) return 0.5 + ((t - 0.575) / 0.275) * 0.5;
    return 1;
  };

  // Render a single frame with staggered character updates
  const render = (phase, now) => {
    let out = '';
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const cell = gridData[y][x];
        const dx = x - CENTER_X + 0.5;
        const dy = y - CENTER_Y + 0.5;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const inCircle = dist <= RADIUS;

        // Check if this cell should update based on its staggered timing
        const cellTime = now + cell.timeOffset;
        const shouldUpdate = Math.floor(cellTime / CHAR_CHANGE_INTERVAL) !== Math.floor((cellTime - RENDER_INTERVAL) / CHAR_CHANGE_INTERVAL);

        if (!inCircle) {
          // Background characters - update on staggered schedule
          if (shouldUpdate || cell.currentChar === null) {
            cell.currentChar = pick(MID);
          }
          out += cell.currentChar;
          continue;
        }

        let lit;
        if (phase <= 0.5) {
          const threshold = phase * 2;
          lit = cell.threshold < threshold;
        } else {
          const threshold = (phase - 0.5) * 2;
          lit = cell.threshold >= threshold;
        }

        // Moon characters - update on staggered schedule
        if (shouldUpdate || cell.currentChar === null) {
          cell.currentChar = lit ? pick(SPARSE) : pick(DENSE);
        } else {
          // Even if not updating timing, check if lit state changed
          const charSet = lit ? SPARSE : DENSE;
          if (!charSet.includes(cell.currentChar)) {
            cell.currentChar = pick(charSet);
          }
        }

        out += cell.currentChar;
      }
      out += '\n';
    }
    return out;
  };

  useEffect(() => {
    const loop = (timestamp) => {
      if (timestamp - lastRenderRef.current >= RENDER_INTERVAL) {
        const now = Date.now();
        const rawPhase = (now % CYCLE_DURATION) / CYCLE_DURATION;
        setOutput(render(easedPhase(rawPhase), now));
        lastRenderRef.current = timestamp;
      }
      animationRef.current = requestAnimationFrame(loop);
    };

    // Initial render
    const now = Date.now();
    const rawPhase = (now % CYCLE_DURATION) / CYCLE_DURATION;
    setOutput(render(easedPhase(rawPhase), now));

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gridData]);

  return (
    <pre
      className={`font-mono text-[8px] leading-[0.93] tracking-[0.3em] text-[var(--color-text-tertiary)] whitespace-pre select-none ${className}`}
    >
      {output}
    </pre>
  );
}
