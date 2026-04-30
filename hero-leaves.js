// Hero Leaves — organic leaf animations behind the phone mockup
// Adapted from LeafDrawV2 with symmetric arc drawing and no descend phase
// The dot fades with the leaf instead of floating down.
(function () {
  var svgs = document.querySelectorAll('.hero-leaf');
  if (!svgs.length) return;

  // Path data — right arc REVERSED so both arcs draw bottom-to-top simultaneously
  var PATH_DATA = [
    // Stem
    { d: "M120,240 C120.5,236 119,230 119.5,224 C120,218 120.5,214 120,210" },
    // Left arc (bottom to top — unchanged)
    { d: "M120,210 C111,206 97,194 88,179 C79,164 72,146 70,129 C68,112 72,88 80,68 C88,50 105,37 120,30" },
    // Right arc — REVERSED (now also bottom to top, symmetric with left)
    { d: "M120,210 C130,207 144,195 153,180 C162,165 169,147 171,130 C173,113 169,89 161,69 C153,51 136,38 120,30" },
    // Center vein
    { d: "M120,210 C121,198 118,186 120.5,174 C123,162 117,150 120.5,138 C123,126 117,114 120.5,102 C123,90 118,78 120,66 C121,54 119,42 120,30" },
    // Veins — alternating right/left, bottom to top
    { d: "M124,189 C130,187 138,183 145,180 C149,178 152,176 154,175", veinOrder: 1 },
    { d: "M120,182 C114,180 106,176 99,173 C93,171 86,168 82,167", veinOrder: 2 },
    { d: "M124,166 C131,163 139,160 147,157 C154,154 159,152 166,150", veinOrder: 3 },
    { d: "M120,159 C114,157 106,154 99,151 C93,148 84,145 76,143", veinOrder: 4 },
    { d: "M124,144 C131,141 141,137 148,134 C155,131 162,129 168,128", veinOrder: 5 },
    { d: "M120,137 C113,134 103,130 94,127 C86,124 78,122 70,121", veinOrder: 6 },
    { d: "M124,122 C131,119 139,116 147,113 C154,111 162,109 170,107", veinOrder: 7 },
    { d: "M120,115 C113,112 104,109 96,106 C89,103 80,101 72,99", veinOrder: 8 },
    { d: "M124,100 C130,98 136,95 142,92 C148,90 154,88 160,86", veinOrder: 9 },
    { d: "M120,93 C114,91 107,88 100,85 C94,83 85,81 77,79", veinOrder: 10 },
    { d: "M124,78 C128,76 134,73 139,71 C144,69 153,67 160,65", veinOrder: 11 },
    { d: "M120,71 C116,69 110,66 105,64 C100,62 93,61 87,60", veinOrder: 12 },
    { d: "M124,59 C126,57.5 130,56 133,54.5 C136,53 140,52 144,51", veinOrder: 13 },
    { d: "M120,52 C118,50.5 114,49 111,47.5 C108,46 106,45.5 104,45", veinOrder: 14 },
    // Small circle above leaf tip
    { d: "M120,1 A3,3 0 1,1 120,7 A3,3 0 1,1 120,1", veinOrder: 15 }
  ];

  var CIRCLE_INDEX = PATH_DATA.length - 1;
  var LEAF_STROKE = 11;

  // Timing — slower draw, extended hold at full bloom
  var SEED_HOLD = 400;
  var DRAW_DUR  = 14000;
  var HOLD_DUR  = 16000;
  var FADE_DUR  = 1000;
  var PAUSE_DUR = 200;
  var TOTAL = SEED_HOLD + DRAW_DUR + HOLD_DUR + FADE_DUR + PAUSE_DUR;

  var SEED_HOLD_END = SEED_HOLD;
  var DRAW_END      = SEED_HOLD_END + DRAW_DUR;
  var HOLD_END      = DRAW_END + HOLD_DUR;
  var FADE_END      = HOLD_END + FADE_DUR;

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  var ns = 'http://www.w3.org/2000/svg';

  // ── Initialize each leaf SVG ──
  var leafInstances = [];

  svgs.forEach(function (svg) {
    var offset = parseFloat(svg.getAttribute('data-offset') || '0');

    // Seed circle at stem base
    var seedEl = document.createElementNS(ns, 'circle');
    seedEl.setAttribute('cx', '120');
    seedEl.setAttribute('cy', '240');
    seedEl.setAttribute('r', '3');
    seedEl.setAttribute('fill', 'none');
    seedEl.setAttribute('stroke', 'currentColor');
    seedEl.setAttribute('stroke-width', LEAF_STROKE);
    seedEl.setAttribute('opacity', '0');
    svg.appendChild(seedEl);

    // Leaf group (stem + arcs + veins)
    var leafGroup = document.createElementNS(ns, 'g');
    leafGroup.setAttribute('opacity', '0');
    svg.appendChild(leafGroup);

    // Circle group (dot at tip)
    var circleGroup = document.createElementNS(ns, 'g');
    circleGroup.setAttribute('opacity', '0');
    svg.appendChild(circleGroup);

    // Create paths
    var paths = [];
    PATH_DATA.forEach(function (pd, i) {
      var path = document.createElementNS(ns, 'path');
      path.setAttribute('d', pd.d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', LEAF_STROKE);
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      if (i === CIRCLE_INDEX) {
        circleGroup.appendChild(path);
      } else {
        leafGroup.appendChild(path);
      }
      paths.push(path);
    });

    // Measure lengths
    var lengths = paths.map(function (p) { return p.getTotalLength(); });

    // Separate main structure from veins
    var mainPaths = [];
    var veins = [];
    PATH_DATA.forEach(function (pd, i) {
      if (pd.veinOrder != null) {
        veins.push({ idx: i, len: lengths[i], order: pd.veinOrder });
      } else {
        mainPaths.push({ idx: i, len: lengths[i] });
      }
    });
    veins.sort(function (a, b) { return a.order - b.order; });

    var veinPaths = veins.slice(0, -1);
    var circleEntry = veins[veins.length - 1];

    // ── Build draw ranges ──
    // KEY CHANGE: left and right arcs draw simultaneously
    var rawRanges = new Array(PATH_DATA.length);
    var cursor = 0;

    // Stem (idx 0) — slow draw, seedling emerging
    var stemSpan = mainPaths[0].len * 4;
    rawRanges[mainPaths[0].idx] = { start: cursor, end: cursor + stemSpan, len: mainPaths[0].len };
    cursor += stemSpan;

    // Left arc (idx 1) and Right arc (idx 2) — SIMULTANEOUS from stem to tip
    var leftArc  = mainPaths[1];
    var rightArc = mainPaths[2];
    var arcSpan  = Math.max(leftArc.len, rightArc.len);
    rawRanges[leftArc.idx]  = { start: cursor, end: cursor + arcSpan, len: leftArc.len };
    rawRanges[rightArc.idx] = { start: cursor, end: cursor + arcSpan, len: rightArc.len };
    cursor += arcSpan;

    // Center vein (idx 3) — draws after arcs meet at tip
    var centerSpan = mainPaths[3].len * 2;
    rawRanges[mainPaths[3].idx] = { start: cursor, end: cursor + centerSpan, len: mainPaths[3].len };
    cursor += centerSpan;

    // Veins: staggered draw with bell-curve speed
    var totalPairs = Math.ceil(veinPaths.length / 2);
    var center = (totalPairs - 1) / 2;
    veinPaths.forEach(function (v) {
      var pairIndex = Math.floor((v.order - 1) / 2);
      var dist = Math.abs(pairIndex - center);
      var speedMult = dist >= 3 ? 2 : dist >= 2 ? 1.6 : 1.3;
      var span = v.len * speedMult;
      rawRanges[v.idx] = { start: cursor, end: cursor + span, len: v.len };
      cursor += span * 0.5;
    });

    // Circle dot: draws after veins with a brief pause
    var lastVeinEnd = 0;
    veinPaths.forEach(function (v) {
      if (rawRanges[v.idx].end > lastVeinEnd) lastVeinEnd = rawRanges[v.idx].end;
    });
    var avgVeinLen = veinPaths.reduce(function (s, v) { return s + v.len; }, 0) / veinPaths.length;
    cursor = lastVeinEnd + avgVeinLen * 0.8;
    var circleDrawSpan = circleEntry.len * 4;
    rawRanges[circleEntry.idx] = { start: cursor, end: cursor + circleDrawSpan, len: circleEntry.len };

    // Normalize all ranges to [0, 1]
    var maxEnd = rawRanges[circleEntry.idx].end;
    var ranges = rawRanges.map(function (r) {
      return { start: r.start / maxEnd, end: r.end / maxEnd, len: r.len };
    });

    // Set initial dasharray/offset
    paths.forEach(function (p, i) {
      var len = ranges[i].len;
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });

    leafInstances.push({
      svg: svg,
      seedEl: seedEl,
      leafGroup: leafGroup,
      circleGroup: circleGroup,
      paths: paths,
      ranges: ranges,
      offset: offset * TOTAL
    });
  });

  // ── Animation loop — drives all leaf instances ──
  var startTime = null;

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;

    for (var li = 0; li < leafInstances.length; li++) {
      var inst = leafInstances[li];
      if (!inst.svg.isConnected) continue;

      var elapsed = (timestamp - startTime + inst.offset) % TOTAL;
      var drawProgress, opacity;

      if (elapsed < SEED_HOLD_END) {
        // Seed dot visible, nothing else
        drawProgress = 0;
        opacity = 1;
        inst.seedEl.setAttribute('opacity', '1');
        inst.leafGroup.setAttribute('opacity', '0');
        inst.circleGroup.setAttribute('opacity', '0');

      } else if (elapsed < DRAW_END) {
        // Drawing phase — paths animate in
        drawProgress = (elapsed - SEED_HOLD_END) / DRAW_DUR;
        inst.seedEl.setAttribute('opacity', '1');
        inst.leafGroup.setAttribute('opacity', '1');
        inst.circleGroup.setAttribute('opacity', '1');

      } else if (elapsed < HOLD_END) {
        // Hold — fully drawn, all visible
        drawProgress = 1;
        inst.seedEl.setAttribute('opacity', '1');
        inst.leafGroup.setAttribute('opacity', '1');
        inst.circleGroup.setAttribute('opacity', '1');

      } else if (elapsed < FADE_END) {
        // Fade — EVERYTHING fades together (leaf + circle + seed)
        drawProgress = 1;
        var t = (elapsed - HOLD_END) / FADE_DUR;
        opacity = 1 - smoothstep(t);
        inst.seedEl.setAttribute('opacity', opacity);
        inst.leafGroup.setAttribute('opacity', opacity);
        inst.circleGroup.setAttribute('opacity', opacity);

      } else {
        // Pause — blank, before next cycle
        drawProgress = 0;
        inst.seedEl.setAttribute('opacity', '0');
        inst.leafGroup.setAttribute('opacity', '0');
        inst.circleGroup.setAttribute('opacity', '0');
      }

      // Update stroke-dashoffset for each path
      for (var i = 0; i < inst.paths.length; i++) {
        var r = inst.ranges[i];
        var seg;
        if (drawProgress >= r.end) {
          seg = 1;
        } else if (drawProgress > r.start) {
          seg = (drawProgress - r.start) / (r.end - r.start);
          seg = smoothstep(seg);
        } else {
          seg = 0;
        }
        inst.paths[i].style.strokeDashoffset = r.len * (1 - seg);
      }
    }

    requestAnimationFrame(animate);
  }

  document.fonts.ready.then(function () {
    requestAnimationFrame(animate);
  });
})();
