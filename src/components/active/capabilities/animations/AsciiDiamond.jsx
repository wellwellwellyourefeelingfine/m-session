/**
 * AsciiDiamond Component
 *
 * A compact looping ASCII art animation featuring a diamond shape.
 * Uses LOVE letters for dense areas and punctuation for sparse/lit areas,
 * creating a pulsing fill/empty effect.
 *
 * Animation cycle: 8 seconds
 * - Filling phase (diamond fills with light from center outward)
 * - Brief pause at full
 * - Emptying phase (diamond empties from center outward)
 * - Brief pause at empty
 */

import { useState, useEffect, useRef, useMemo } from 'react';

// Character sets for rendering
const DENSE = ['L', 'O', 'V', 'E'];
const SPARSE = ['.', ':', ';', ',', "'", '`'];
const MID = ['~', '+', '*', '='];

// Grid configuration (~1/3 of 20x20 moon)
const SIZE = 7;
const CENTER = SIZE / 2;
const RADIUS = 3;

// Animation timing
const RENDER_INTERVAL = 50;
const CYCLE_DURATION = 8000;
const CHAR_CHANGE_INTERVAL = 150;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * @param {Object} props
 * @param {string} props.className - Additional CSS classes
 */
export default function AsciiDiamond({ className = '' }) {
  const [output, setOutput] = useState('');
  const animationRef = useRef(null);
  const lastRenderRef = useRef(0);

  // Generate stable grid data
  const gridData = useMemo(() => {
    const grid = [];
    for (let y = 0; y < SIZE; y++) {
      const row = [];
      for (let x = 0; x < SIZE; x++) {
        // Distance from center (Manhattan distance for diamond shape)
        const dx = Math.abs(x - CENTER + 0.5);
        const dy = Math.abs(y - CENTER + 0.5);
        const dist = dx + dy;
        // Normalize threshold based on distance from center
        const threshold = dist / RADIUS;
        row.push({
          threshold: Math.min(threshold + (Math.random() * 0.15 - 0.075), 1),
          timeOffset: Math.random() * CHAR_CHANGE_INTERVAL,
          currentChar: null,
        });
      }
      grid.push(row);
    }
    return grid;
  }, []);

  // Eased phase for smooth transitions with pauses
  const easedPhase = (t) => {
    if (t < 0.12) return 0;
    if (t < 0.42) return ((t - 0.12) / 0.3) * 0.5;
    if (t < 0.58) return 0.5;
    if (t < 0.88) return 0.5 + ((t - 0.58) / 0.3) * 0.5;
    return 1;
  };

  const render = (phase, now) => {
    let out = '';
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const cell = gridData[y][x];
        const dx = Math.abs(x - CENTER + 0.5);
        const dy = Math.abs(y - CENTER + 0.5);
        const dist = dx + dy;
        const inDiamond = dist <= RADIUS;

        const cellTime = now + cell.timeOffset;
        const shouldUpdate = Math.floor(cellTime / CHAR_CHANGE_INTERVAL) !== Math.floor((cellTime - RENDER_INTERVAL) / CHAR_CHANGE_INTERVAL);

        if (!inDiamond) {
          if (shouldUpdate || cell.currentChar === null) {
            cell.currentChar = pick(MID);
          }
          out += cell.currentChar;
          continue;
        }

        let lit;
        if (phase <= 0.5) {
          // Filling: center lights up first (low threshold = close to center)
          const threshold = phase * 2;
          lit = cell.threshold < threshold;
        } else {
          // Emptying: center empties first
          const threshold = (phase - 0.5) * 2;
          lit = cell.threshold >= threshold;
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
      className={`font-mono text-[8px] leading-[0.93] tracking-[0.3em] whitespace-pre select-none ${className}`}
      style={{ color: 'var(--accent)', opacity: 0.7 }}
    >
      {output}
    </pre>
  );
}
