import { useEffect, useRef, useState, memo } from 'react';

const PATH_DATA = [
  // Stem
  { d: "M60,112 C60.5,109 59,105 59.5,103 C60,101 60.5,99.5 60,98" },
  // Left arc - wobbly outline
  { d: "M60,98 C55,96 48,89 44,80.5 C40,73.5 36,65 35.5,57.5 C36,48 39,38 44,30 C49,23 56,18 60,14" },
  // Right arc - wobbly outline
  { d: "M60,14 C64,16 71,23 76,30.5 C81,38 84,47 84.5,56.5 C84,65 82,72 77,79.5 C72,87.5 65,96 60,98" },
  // Center vein
  { d: "M60,98 C61,91 58.5,84 60.5,76 C62,68 58,60 60.5,52 C62,44 58.5,36 60,28 C60.5,22 59.5,17 60,14" },
  // Vein 1: bottom-left (longest, curves down a bit)
  { d: "M60,79 C56,77 50.5,75 47,72.5 C44,70 41.5,68.5 39,67", veinOrder: 1 },
  // Vein 2: bottom-right (slightly different origin, reaches further)
  { d: "M60,78 C63.5,75.5 69,73.5 74,71 C76.5,69 79,67.5 80.5,66.5", veinOrder: 2 },
  // Vein 3: second-left
  { d: "M60,65 C57,63 51.5,61.5 47.5,59 C44,57.5 41.5,56.5 39,55", veinOrder: 3 },
  // Vein 4: second-right
  { d: "M60,66 C63,63.5 68.5,61 72.5,58.5 C76,57 79.5,55.5 81.5,54.5", veinOrder: 4 },
  // Vein 5: third-left
  { d: "M60,51 C57.5,49.5 53,47.5 49,45.5 C46,44 43.5,43 40,41.5", veinOrder: 5 },
  // Vein 6: third-right
  { d: "M60,50 C62.5,48.5 67.5,46.5 71.5,44 C74.5,43 77,41.5 80,40.5", veinOrder: 6 },
  // Vein 7: top-left (short, steep)
  { d: "M60,37 C58,35.5 54.5,34 52,32.5 C50.5,32 49,31.5 47.5,31", veinOrder: 7 },
  // Vein 8: top-right (shortest, gentle)
  { d: "M60,36 C62,34.5 65.5,33.5 68,32 C69.5,31.5 71,30.5 72.5,30", veinOrder: 8 },
  // Small circle above leaf tip
  { d: "M60,-7 A3.5,3.5 0 1,1 60,0 A3.5,3.5 0 1,1 60,-7", veinOrder: 9 },
];

const DRAW_DUR = 9500;
const HOLD_DUR = 2200;
const FADE_DUR = 800;
const PAUSE_DUR = 600;
const TOTAL = DRAW_DUR + HOLD_DUR + FADE_DUR + PAUSE_DUR;

export default memo(function LeafDrawAnimation() {
  const svgRef = useRef(null);
  const pathRefs = useRef([]);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const rangesRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const paths = pathRefs.current;
    if (!paths.length) return;

    const lengths = paths.map(p => p.getTotalLength());

    // All paths draw sequentially. Main paths (stem, arcs, center vein) first,
    // then veins in their specified order.
    const mainPaths = [];
    const veins = [];

    PATH_DATA.forEach((pd, i) => {
      if (pd.veinOrder != null) {
        veins.push({ idx: i, len: lengths[i], order: pd.veinOrder });
      } else {
        mainPaths.push({ idx: i, len: lengths[i] });
      }
    });

    veins.sort((a, b) => a.order - b.order);
    const allSequential = [...mainPaths, ...veins];
    const totalLen = allSequential.reduce((s, p) => s + p.len, 0);

    const ranges = new Array(PATH_DATA.length);
    let cursor = 0;

    for (const s of allSequential) {
      const fraction = s.len / totalLen;
      ranges[s.idx] = { start: cursor, end: cursor + fraction, len: s.len };
      cursor += fraction;
    }

    // Set initial state
    paths.forEach((p, i) => {
      const len = ranges[i].len;
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });

    rangesRef.current = ranges;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const paths = pathRefs.current;
    const ranges = rangesRef.current;
    const gEl = svgRef.current;

    function animate(timestamp) {
      if (!gEl || !paths[0]) return;
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = (timestamp - startRef.current) % TOTAL;

      let drawProgress, op;

      if (elapsed < DRAW_DUR) {
        drawProgress = elapsed / DRAW_DUR;
        op = 1;
      } else if (elapsed < DRAW_DUR + HOLD_DUR) {
        drawProgress = 1;
        op = 1;
      } else if (elapsed < DRAW_DUR + HOLD_DUR + FADE_DUR) {
        drawProgress = 1;
        op = 1 - (elapsed - DRAW_DUR - HOLD_DUR) / FADE_DUR;
      } else {
        drawProgress = 0;
        op = 0;
      }

      gEl.setAttribute('opacity', op);

      for (let i = 0; i < paths.length; i++) {
        const r = ranges[i];
        let seg;
        if (drawProgress >= r.end) {
          seg = 1;
        } else if (drawProgress > r.start) {
          seg = (drawProgress - r.start) / (r.end - r.start);
        } else {
          seg = 0;
        }
        paths[i].style.strokeDashoffset = r.len * (1 - seg);
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [ready]);

  return (
    <svg
      viewBox="0 -11 120 127"
      width="108"
      height="114"
      style={{ overflow: 'visible', color: 'var(--accent)', opacity: 0.7 }}
    >
      <g ref={svgRef} opacity={0}>
        {PATH_DATA.map((p, i) => (
          <path
            key={i}
            ref={el => { pathRefs.current[i] = el; }}
            d={p.d}
            fill="none"
            stroke="currentColor"
            strokeWidth={5.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>
    </svg>
  );
});
