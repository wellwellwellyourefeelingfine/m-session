import { memo, useEffect, useState } from 'react';

const WIDTH = 35;
const HEIGHT = 11;
const FRAME_MS = 240;

function terrainAt(x, time) {
  return 5.4
    + Math.sin(x * 0.24 + time * 0.16) * 1.05
    + Math.sin(x * 0.53 - time * 0.1) * 0.45;
}

function buildFrame(time) {
  const rows = [];
  const moonX = 27 + Math.round(Math.sin(time * 0.12));

  for (let y = 0; y < HEIGHT; y++) {
    let row = '';

    for (let x = 0; x < WIDTH; x++) {
      const ground = terrainAt(x, time);
      const previous = terrainAt(x - 1, time);
      const next = terrainAt(x + 1, time);
      const slope = next - previous;
      const skyTwinkle = Math.sin(x * 1.7 + y * 2.1 + time * 0.35);

      if (y === 1 && Math.abs(x - moonX) < 2) {
        row += x === moonX ? 'o' : '.';
      } else if (y < 4 && skyTwinkle > 0.92) {
        row += '.';
      } else if (Math.abs(y - ground) < 0.42) {
        row += slope > 0.12 ? '/' : slope < -0.12 ? '\\' : '_';
      } else if (y > ground && y < 8) {
        row += Math.sin(x * 0.74 + y * 1.3) > 0.48 ? '\'' : ' ';
      } else if (y >= 8) {
        const wave = Math.sin(x * 0.62 - time * 1.05 + y * 0.6);
        row += wave > 0.16 ? '~' : ' ';
      } else {
        row += ' ';
      }
    }

    rows.push(row);
  }

  return rows.join('\n');
}

export default memo(function AsciiLandscape({ className = '' }) {
  const [frame, setFrame] = useState(() => buildFrame(0));

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return undefined;

    let rafId;
    let last = 0;
    let start = 0;

    function loop(timestamp) {
      if (!start) start = timestamp;
      if (timestamp - last >= FRAME_MS) {
        last = timestamp;
        setFrame(buildFrame((timestamp - start) / 1000));
      }

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

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
