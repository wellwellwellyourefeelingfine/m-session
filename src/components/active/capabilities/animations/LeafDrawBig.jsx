import { useEffect, useRef, useState, memo } from 'react';

const PATH_DATA = [
  // Stem
  { d: "M120,240 C120.5,236 119,230 119.5,224 C120,218 120.5,214 120,210" },
  // Left arc - wobbly outline
  { d: "M120,210 C111,206 97,194 88,179 C79,164 72,146 70,129 C68,112 72,88 80,68 C88,50 105,37 120,30" },
  // Right arc - wobbly outline
  { d: "M120,30 C136,38 153,51 161,69 C169,89 173,113 171,130 C169,147 162,165 153,180 C144,195 130,207 120,210" },
  // Center vein
  { d: "M120,210 C121,198 118,186 120.5,174 C123,162 117,150 120.5,138 C123,126 117,114 120.5,102 C123,90 118,78 120,66 C121,54 119,42 120,30" },
  // Vein 1: bottom-left
  { d: "M120,185 C114,183 106,179 99,176 C93,174 88,172 84,171", veinOrder: 1 },
  // Vein 2: bottom-right
  { d: "M120,184 C126,182 134,178 141,175 C147,173 152,171 156,170", veinOrder: 2 },
  // Vein 3: second-left
  { d: "M120,162 C114,160 106,157 99,154 C93,151 86,149 78,147", veinOrder: 3 },
  // Vein 4: second-right
  { d: "M120,161 C127,158 135,155 143,152 C150,149 157,147 165,145", veinOrder: 4 },
  // Vein 5: third-left
  { d: "M120,140 C113,137 103,133 94,130 C86,127 78,125 70,124", veinOrder: 5 },
  // Vein 6: third-right
  { d: "M120,139 C127,136 137,132 146,129 C154,126 163,124 171,123", veinOrder: 6 },
  // Vein 7: fourth-left
  { d: "M120,118 C113,115 104,112 96,109 C89,106 80,104 72,102", veinOrder: 7 },
  // Vein 8: fourth-right
  { d: "M120,117 C127,114 135,111 143,108 C150,106 158,104 166,102", veinOrder: 8 },
  // Vein 9: fifth-left
  { d: "M120,96 C114,94 107,91 100,88 C94,86 85,84 77,82", veinOrder: 9 },
  // Vein 10: fifth-right
  { d: "M120,95 C126,93 132,90 138,87 C144,85 153,83 161,81", veinOrder: 10 },
  // Vein 11: sixth-left
  { d: "M120,74 C116,72 110,69 105,67 C100,65 92,63 85,62", veinOrder: 11 },
  // Vein 12: sixth-right
  { d: "M120,73 C124,71 130,68 135,66 C140,64 148,62 154,61", veinOrder: 12 },
  // Vein 13: top-left (tiny, steep angle)
  { d: "M120,55 C118,53.5 114,52 111,50.5 C108,49 105,48 102,47", veinOrder: 13 },
  // Vein 14: top-right (tiny, steep angle)
  { d: "M120,54 C122,52.5 126,51 129,49.5 C132,48 135,47 138,46", veinOrder: 14 },
  // Small circle above leaf tip (same size as LeafDraw, raised higher)
  { d: "M120,6.5 A3.5,3.5 0 1,1 120,13.5 A3.5,3.5 0 1,1 120,6.5", veinOrder: 15 },
];

const CIRCLE_INDEX = PATH_DATA.length - 1;
const LEAF_STROKE = 9;

const SEED_HOLD   = 700;
const DRAW_DUR    = 12000;
const HOLD_DUR    = 2200;
const LEAF_FADE   = 1000;
const DESCEND_DUR = 2500;
const TOTAL = SEED_HOLD + DRAW_DUR + HOLD_DUR + LEAF_FADE + DESCEND_DUR;

// Phase boundaries (cumulative)
const SEED_HOLD_END = SEED_HOLD;
const DRAW_END      = SEED_HOLD_END + DRAW_DUR;
const HOLD_END      = DRAW_END + HOLD_DUR;
const LEAF_FADE_END = HOLD_END + LEAF_FADE;

// Circle center y=10, stem start y=240 → 230 units of travel
const DESCEND_DISTANCE = 230;
// Subtle horizontal sway during descent (spore-like drift)
const SWAY_AMPLITUDE = 10;
const SWAY_CYCLES = 1.5;

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

export default memo(function LeafDrawBigAnimation() {
  const leafGroupRef = useRef(null);
  const circleGroupRef = useRef(null);
  const seedRef = useRef(null);
  const pathRefs = useRef([]);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const rangesRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const paths = pathRefs.current;
    if (!paths.length) return;

    const lengths = paths.map(p => p.getTotalLength());

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

    // Separate veins (staggered draw) from circle (draws after veins)
    const veinPaths = veins.slice(0, -1);
    const circleEntry = veins[veins.length - 1];

    // Build ranges in virtual time units, then normalize to [0, 1]
    const rawRanges = new Array(PATH_DATA.length);
    let cursor = 0;

    // Main paths: fully sequential (stem, arcs, center vein)
    // Stem (idx 0) draws at half speed — small seedling emerging
    for (const s of mainPaths) {
      const span = s.idx === 0 ? s.len * 4 : s.idx === 3 ? s.len * 2 : s.len;
      rawRanges[s.idx] = { start: cursor, end: cursor + span, len: s.len };
      cursor += span;
    }

    // Veins: staggered — each starts when previous is 50% drawn
    // First 3 pairs draw progressively faster, remainder at full speed
    for (const v of veinPaths) {
      const pairIndex = Math.floor((v.order - 1) / 2); // 0,0,1,1,2,2,3,3...
      const speedMult = pairIndex === 0 ? 2 : pairIndex === 1 ? 1.6 : 1.3;
      const span = v.len * speedMult;
      rawRanges[v.idx] = { start: cursor, end: cursor + span, len: v.len };
      cursor += span * 0.5;
    }

    // Circle: starts after a brief pause once the last vein finishes
    const lastVeinEnd = Math.max(...veinPaths.map(v => rawRanges[v.idx].end));
    const avgVeinLen = veinPaths.reduce((s, v) => s + v.len, 0) / veinPaths.length;
    const pauseBeforeCircle = avgVeinLen * 0.8;
    cursor = lastVeinEnd + pauseBeforeCircle;
    const circleDrawSpan = circleEntry.len * 4; // draw at quarter speed, matching stem
    rawRanges[circleEntry.idx] = { start: cursor, end: cursor + circleDrawSpan, len: circleEntry.len };

    // Normalize all ranges to [0, 1]
    const maxEnd = rawRanges[circleEntry.idx].end;
    const ranges = rawRanges.map(r => ({
      start: r.start / maxEnd,
      end: r.end / maxEnd,
      len: r.len,
    }));

    paths.forEach((p, i) => {
      const len = ranges[i].len;
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });

    if (seedRef.current) {
      seedRef.current.setAttribute('opacity', 1);
    }

    rangesRef.current = ranges;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const paths = pathRefs.current;
    const ranges = rangesRef.current;
    const leafGroup = leafGroupRef.current;
    const circleGroup = circleGroupRef.current;
    const seedEl = seedRef.current;

    function animate(timestamp) {
      if (!leafGroup || !circleGroup || !seedEl || !paths[0]) return;
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = (timestamp - startRef.current) % TOTAL;

      let drawProgress, leafOpacity, circleOpacity, circleTranslateX, circleTranslateY, seedOpacity;

      if (elapsed < SEED_HOLD_END) {
        // SEED_HOLD: seed visible at bottom, pause before leaf draws
        drawProgress = 0;
        leafOpacity = 0;
        circleOpacity = 0;
        circleTranslateX = 0;
        circleTranslateY = 0;
        seedOpacity = 1;

      } else if (elapsed < DRAW_END) {
        // DRAW: paths draw sequentially, seed stays visible at bottom
        drawProgress = (elapsed - SEED_HOLD_END) / DRAW_DUR;
        leafOpacity = 1;
        circleOpacity = 1;
        circleTranslateX = 0;
        circleTranslateY = 0;
        seedOpacity = 1;

      } else if (elapsed < HOLD_END) {
        // HOLD: fully drawn leaf + top circle + bottom seed all visible
        drawProgress = 1;
        leafOpacity = 1;
        circleOpacity = 1;
        circleTranslateX = 0;
        circleTranslateY = 0;
        seedOpacity = 1;

      } else if (elapsed < LEAF_FADE_END) {
        // LEAF_FADE: leaf + bottom seed fade out, top circle stays
        drawProgress = 1;
        const t = (elapsed - HOLD_END) / LEAF_FADE;
        leafOpacity = 1 - t;
        circleOpacity = 1;
        circleTranslateX = 0;
        circleTranslateY = 0;
        seedOpacity = 1 - t;

      } else {
        // DESCEND: circle floats down with smoothstep easing + subtle sway
        drawProgress = 1;
        leafOpacity = 0;
        circleOpacity = 1;
        const t = (elapsed - LEAF_FADE_END) / DESCEND_DUR;
        circleTranslateY = smoothstep(t) * DESCEND_DISTANCE;
        circleTranslateX = Math.sin(t * Math.PI * 2 * SWAY_CYCLES) * SWAY_AMPLITUDE * (1 - t);
        seedOpacity = 0;
      }

      leafGroup.setAttribute('opacity', leafOpacity);
      circleGroup.setAttribute('opacity', circleOpacity);
      seedEl.setAttribute('opacity', seedOpacity);

      if (circleTranslateX !== 0 || circleTranslateY !== 0) {
        circleGroup.setAttribute('transform', `translate(${circleTranslateX}, ${circleTranslateY})`);
      } else {
        circleGroup.removeAttribute('transform');
      }

      for (let i = 0; i < paths.length; i++) {
        const r = ranges[i];
        let seg;
        if (drawProgress >= r.end) {
          seg = 1;
        } else if (drawProgress > r.start) {
          seg = (drawProgress - r.start) / (r.end - r.start);
          // Ease all segments for hand-drawn feel
          seg = smoothstep(seg);
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
      viewBox="55 2 130 248"
      width="150"
      height="285"
      style={{ overflow: 'visible', color: 'var(--accent)', opacity: 0.7 }}
    >
      {/* Seed circle at stem base — matches circle path styling for seamless swap */}
      <circle
        ref={seedRef}
        cx="120"
        cy="240"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={5.5}
        opacity={0}
      />

      {/* Leaf paths: stem + arcs + veins */}
      <g ref={leafGroupRef} opacity={0}>
        {PATH_DATA.slice(0, -1).map((p, i) => (
          <path
            key={i}
            ref={el => { pathRefs.current[i] = el; }}
            d={p.d}
            fill="none"
            stroke="currentColor"
            strokeWidth={LEAF_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* Circle group: same size as LeafDraw, independent opacity + translateY */}
      <g ref={circleGroupRef} opacity={0}>
        <path
          ref={el => { pathRefs.current[CIRCLE_INDEX] = el; }}
          d={PATH_DATA[CIRCLE_INDEX].d}
          fill="none"
          stroke="currentColor"
          strokeWidth={5.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
});
