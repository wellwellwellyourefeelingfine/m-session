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
  // Vein 1: bottom-right (shifted down 5, right +4) — draws first (lowest)
  { d: "M124,189 C130,187 138,183 145,180 C149,178 152,176 154,175", veinOrder: 1 },
  // Vein 2: bottom-left (shifted up 5, extended)
  { d: "M120,182 C114,180 106,176 99,173 C93,171 86,168 82,167", veinOrder: 2 },
  // Vein 3: second-right (shifted down 5, right +4)
  { d: "M124,166 C131,163 139,160 147,157 C154,154 159,152 166,150", veinOrder: 3 },
  // Vein 4: second-left (shifted up 5, extended)
  { d: "M120,159 C114,157 106,154 99,151 C93,148 84,145 76,143", veinOrder: 4 },
  // Vein 5: third-right (shifted down 5, right +4)
  { d: "M124,144 C131,141 141,137 148,134 C155,131 162,129 168,128", veinOrder: 5 },
  // Vein 6: third-left (shifted up 5)
  { d: "M120,137 C113,134 103,130 94,127 C86,124 78,122 70,121", veinOrder: 6 },
  // Vein 7: fourth-right (shifted down 5, right +4)
  { d: "M124,122 C131,119 139,116 147,113 C154,111 162,109 170,107", veinOrder: 7 },
  // Vein 8: fourth-left (shifted up 5)
  { d: "M120,115 C113,112 104,109 96,106 C89,103 80,101 72,99", veinOrder: 8 },
  // Vein 9: fifth-right (shifted down 5, right +4)
  { d: "M124,100 C130,98 136,95 142,92 C148,90 154,88 160,86", veinOrder: 9 },
  // Vein 10: fifth-left (shifted up 5)
  { d: "M120,93 C114,91 107,88 100,85 C94,83 85,81 77,79", veinOrder: 10 },
  // Vein 11: sixth-right (shifted down 5, right +4)
  { d: "M124,78 C128,76 134,73 139,71 C144,69 153,67 160,65", veinOrder: 11 },
  // Vein 12: sixth-left (shifted up 5, shortened)
  { d: "M120,71 C116,69 110,66 105,64 C100,62 93,61 87,60", veinOrder: 12 },
  // Vein 13: top-right (shifted down 5, right +4)
  { d: "M124,59 C126,57.5 130,56 133,54.5 C136,53 140,52 144,51", veinOrder: 13 },
  // Vein 14: top-left (shifted up 5, shortened)
  { d: "M120,52 C118,50.5 114,49 111,47.5 C108,46 106,45.5 104,45", veinOrder: 14 },
  // Small circle above leaf tip
  { d: "M120,1 A3,3 0 1,1 120,7 A3,3 0 1,1 120,1", veinOrder: 15 },
];

const CIRCLE_INDEX = PATH_DATA.length - 1;
const LEAF_STROKE = 11;

const SEED_HOLD     = 700;
const DRAW_BASE_DUR = 12000;
const LEAF_HOLD     = 500;  // Extra hold after leaf is fully drawn, before the top dot starts drawing
const DRAW_DUR      = DRAW_BASE_DUR + LEAF_HOLD;
const HOLD_DUR      = 2200;
const LEAF_FADE     = 1000;
const DESCEND_DUR   = 2500;
const TOTAL = SEED_HOLD + DRAW_DUR + HOLD_DUR + LEAF_FADE + DESCEND_DUR;

// Phase boundaries (cumulative)
const SEED_HOLD_END = SEED_HOLD;
const DRAW_END      = SEED_HOLD_END + DRAW_DUR;
const HOLD_END      = DRAW_END + HOLD_DUR;
const LEAF_FADE_END = HOLD_END + LEAF_FADE;

// Circle center y=4, stem start y=240 → 236 units of travel
const DESCEND_DISTANCE = 236;
// Subtle horizontal sway during descent (spore-like drift)
const SWAY_AMPLITUDE = 10;
const SWAY_CYCLES = 1.5;

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

export default memo(function LeafDrawV2Animation() {
  const leafGroupRef = useRef(null);
  const circleGroupRef = useRef(null);
  const seedRef = useRef(null);
  const pathRefs = useRef([]);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const rangesRef = useRef(null);
  const loopOffsetRef = useRef(0);
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
    // Slow at bottom, fastest in middle, slow again at top (bell curve)
    const totalPairs = Math.ceil(veinPaths.length / 2);
    const center = (totalPairs - 1) / 2;
    for (const v of veinPaths) {
      const pairIndex = Math.floor((v.order - 1) / 2);
      const dist = Math.abs(pairIndex - center);
      const speedMult = dist >= 3 ? 2 : dist >= 2 ? 1.6 : 1.3;
      const span = v.len * speedMult;
      rawRanges[v.idx] = { start: cursor, end: cursor + span, len: v.len };
      cursor += span * 0.5;
    }

    // Circle: starts after a brief pause once the last vein finishes
    const lastVeinEnd = Math.max(...veinPaths.map(v => rawRanges[v.idx].end));
    const avgVeinLen = veinPaths.reduce((s, v) => s + v.len, 0) / veinPaths.length;
    const pauseBeforeCircle = avgVeinLen * 0.8;
    const circleDrawSpan = circleEntry.len * 4; // draw at quarter speed, matching stem
    // Inflate the pause so LEAF_HOLD ms of extra real time elapse between the leaf
    // finishing and the circle starting, without affecting any drawing speeds.
    const extraPauseRaw = (lastVeinEnd + pauseBeforeCircle + circleDrawSpan) * LEAF_HOLD / DRAW_BASE_DUR;
    cursor = lastVeinEnd + pauseBeforeCircle + extraPauseRaw;
    rawRanges[circleEntry.idx] = { start: cursor, end: cursor + circleDrawSpan, len: circleEntry.len };

    // Normalize all ranges to [0, 1]
    const maxEnd = rawRanges[circleEntry.idx].end;
    const ranges = rawRanges.map(r => ({
      start: r.start / maxEnd,
      end: r.end / maxEnd,
      len: r.len,
    }));

    // Loop start is the moment the leaf is fully drawn but the circle hasn't started.
    // In real time within the cycle, that's SEED_HOLD + (drawProgress where last vein ends) * DRAW_DUR.
    loopOffsetRef.current = SEED_HOLD + (lastVeinEnd / maxEnd) * DRAW_DUR;

    paths.forEach((p, i) => {
      const len = ranges[i].len;
      p.style.strokeDasharray = len;
      // Pre-seed loop-start state: leaf paths fully drawn, circle hidden.
      // Avoids a one-frame flash between mount paint and first RAF tick.
      p.style.strokeDashoffset = i === CIRCLE_INDEX ? len : 0;
    });

    if (seedRef.current) {
      seedRef.current.setAttribute('opacity', 1);
    }
    if (leafGroupRef.current) {
      leafGroupRef.current.setAttribute('opacity', 1);
    }
    if (circleGroupRef.current) {
      circleGroupRef.current.setAttribute('opacity', 1);
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
      const elapsed = (timestamp - startRef.current + loopOffsetRef.current) % TOTAL;

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
      width="70"
      height="133"
      style={{ overflow: 'visible', color: 'var(--accent)', opacity: 0.7 }}
    >
      {/* Seed circle at stem base — matches circle path styling for seamless swap */}
      <circle
        ref={seedRef}
        cx="120"
        cy="240"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth={LEAF_STROKE}
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

      {/* Circle group: independent opacity + translateY */}
      <g ref={circleGroupRef} opacity={0}>
        <path
          ref={el => { pathRefs.current[CIRCLE_INDEX] = el; }}
          d={PATH_DATA[CIRCLE_INDEX].d}
          fill="none"
          stroke="currentColor"
          strokeWidth={LEAF_STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
});
