import { memo, useEffect, useMemo, useRef, useState } from 'react';

const WIDTH = 31;
const HEIGHT = 11;
const FRAME_MS = 190;
const PHRASES = ['LOVE', 'KINDNESS', 'COMPASSION', 'FORGIVENESS', 'LETTING GO', 'ALLOW', 'SOFTEN', 'REST'];

function buildFrame(cells, time) {
  let output = '';

  for (const cell of cells) {
    if (cell.newline) {
      output += '\n';
      continue;
    }

    const phrase = PHRASES[cell.row % PHRASES.length];
    const phraseBand = `${phrase}    `;
    const drift = Math.floor(time * 2.4 + cell.row * 2.1);
    const phraseChar = phraseBand[(cell.x + drift) % phraseBand.length];

    const ripple = Math.sin(cell.distance * 8.2 - time * 1.35);
    const current = Math.sin(cell.x * 0.34 + cell.row * 0.62 - time * 0.72) * 0.42;
    const shore = Math.max(0, 1 - Math.abs(cell.y) * 0.28);
    const value = (ripple + current + 1.2) * 0.5 * shore;

    output += value > 0.44 ? phraseChar : ' ';
  }

  return output;
}

export default memo(function AsciiRipple({ className = '' }) {
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
        });
      }
      next.push({ newline: true });
    }

    return next;
  }, []);

  const [frame, setFrame] = useState(() => buildFrame(cells, 0));
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
        setFrame(buildFrame(cells, (timestamp - startRef.current) / 1000));
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
        color: 'color-mix(in srgb, var(--accent) 72%, var(--color-text-primary) 28%)',
        opacity: 0.94,
        fontFamily: 'Azeret Mono, monospace',
        fontSize: 7.2,
        fontWeight: 700,
        lineHeight: 0.96,
        letterSpacing: 0,
        whiteSpace: 'pre',
        margin: 0,
        textAlign: 'left',
        textShadow: '0 0 1px currentColor',
      }}
    >
      {frame}
    </pre>
  );
});
