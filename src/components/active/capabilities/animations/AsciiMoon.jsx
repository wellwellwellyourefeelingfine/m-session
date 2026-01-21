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
const RENDER_INTERVAL = 200; // ms between frames
const CYCLE_DURATION = 10000; // ms for full cycle

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * @param {Object} props
 * @param {string} props.className - Additional CSS classes
 */
export default function AsciiMoon({ className = '' }) {
  const [output, setOutput] = useState('');
  const animationRef = useRef(null);
  const lastRenderRef = useRef(0);

  // Generate stable threshold grid (randomized once per mount)
  const thresholds = useMemo(() => {
    const grid = [];
    for (let y = 0; y < SIZE; y++) {
      const row = [];
      for (let x = 0; x < SIZE; x++) {
        const nx = 0.1 + (x / SIZE) * 0.8;
        row.push(nx + (Math.random() * 0.15 - 0.075));
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

  // Render a single frame
  const render = (phase) => {
    let out = '';
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const dx = x - CENTER_X + 0.5;
        const dy = y - CENTER_Y + 0.5;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const inCircle = dist <= RADIUS;

        if (!inCircle) {
          out += pick(MID);
          continue;
        }

        let lit;
        if (phase <= 0.5) {
          const threshold = phase * 2;
          lit = thresholds[y][x] < threshold;
        } else {
          const threshold = (phase - 0.5) * 2;
          lit = thresholds[y][x] >= threshold;
        }

        out += lit ? pick(SPARSE) : pick(DENSE);
      }
      out += '\n';
    }
    return out;
  };

  useEffect(() => {
    const loop = (timestamp) => {
      if (timestamp - lastRenderRef.current >= RENDER_INTERVAL) {
        const rawPhase = (Date.now() % CYCLE_DURATION) / CYCLE_DURATION;
        setOutput(render(easedPhase(rawPhase)));
        lastRenderRef.current = timestamp;
      }
      animationRef.current = requestAnimationFrame(loop);
    };

    // Initial render
    const rawPhase = (Date.now() % CYCLE_DURATION) / CYCLE_DURATION;
    setOutput(render(easedPhase(rawPhase)));

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [thresholds]);

  return (
    <pre
      className={`font-mono text-[8px] leading-[0.93] tracking-[0.3em] text-[var(--color-text-tertiary)] whitespace-pre select-none ${className}`}
    >
      {output}
    </pre>
  );
}
