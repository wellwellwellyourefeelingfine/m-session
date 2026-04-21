import { memo, useEffect, useMemo, useRef, useState } from 'react';

const WIDTH = 35;
const HEIGHT = 11;
const FRAME_MS = 95;
const PHRASES = ['LOVE', 'KINDNESS', 'COMPASSION', 'FORGIVENESS', 'LETTING GO', 'ALLOW', 'SOFTEN', 'REST'];
const SCRAMBLE = ['+', '=', '~', '-', '*'];
const SOFT = ['.', ':', ',', '\'', '`'];

const pick = (items, seed) => items[Math.abs(Math.floor(seed)) % items.length];

function targetForCell(cell, time) {
  const phrase = PHRASES[cell.row % PHRASES.length];
  const phraseBand = `${phrase}     `;
  const drift = Math.floor(time * 1.6 + cell.row * 1.8);
  const phraseChar = phraseBand[(cell.x + drift) % phraseBand.length];

  const ring = Math.sin(cell.distance * 8.8 - time * 1.18);
  const cross = Math.sin(cell.x * 0.22 + cell.row * 0.54 - time * 0.42) * 0.34;
  const centerFade = Math.max(0, 1 - Math.abs(cell.y) * 0.22);
  const value = (ring + cross + 1.18) * 0.5 * centerFade;

  if (value > 0.58 && phraseChar !== ' ') return phraseChar;
  if (value > 0.44) return pick(SOFT, cell.seed + Math.floor(time * 2));
  return ' ';
}

function renderFrame(cells, time, now) {
  let output = '';

  for (const cell of cells) {
    if (cell.newline) {
      output += '\n';
      continue;
    }

    const target = targetForCell(cell, time);
    const changed = target !== cell.targetChar;

    if (changed) {
      cell.targetChar = target;
      cell.transitionUntil = now + 240 + cell.timeOffset;
      cell.currentChar = pick(SCRAMBLE, cell.seed + now * 0.03);
    } else if (now < cell.transitionUntil) {
      cell.currentChar = pick(SCRAMBLE, cell.seed + now * 0.05);
    } else {
      cell.currentChar = target;
    }

    output += cell.currentChar;
  }

  return output;
}

export default memo(function AsciiRippleScramble({ className = '' }) {
  const cells = useMemo(() => {
    const next = [];
    const centerX = (WIDTH - 1) / 2;
    const centerY = (HEIGHT - 1) / 2;

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const nx = (x - centerX) / centerX;
        const ny = (y - centerY) / centerY;
        next.push({
          x,
          row: y,
          y: ny,
          distance: Math.sqrt(nx * nx + ny * ny),
          seed: x * 37 + y * 101,
          timeOffset: ((x * 29 + y * 47) % 180),
          targetChar: ' ',
          currentChar: ' ',
          transitionUntil: 0,
        });
      }
      next.push({ newline: true });
    }

    return next;
  }, []);

  const [frame, setFrame] = useState(() => renderFrame(cells, 0, 0));
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const startRef = useRef(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return undefined;

    function loop(timestamp) {
      if (!startRef.current) startRef.current = timestamp;

      if (timestamp - lastRef.current >= FRAME_MS) {
        lastRef.current = timestamp;
        setFrame(renderFrame(cells, (timestamp - startRef.current) / 1000, timestamp));
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cells]);

  return (
    <pre
      className={className}
      aria-hidden="true"
      style={{
        color: 'color-mix(in srgb, var(--accent) 70%, var(--color-text-primary) 30%)',
        opacity: 0.84,
        fontFamily: 'Azeret Mono, monospace',
        fontSize: 7.1,
        fontWeight: 400,
        lineHeight: 0.96,
        letterSpacing: 0,
        whiteSpace: 'pre',
        margin: 0,
        textAlign: 'left',
      }}
    >
      {frame}
    </pre>
  );
});
