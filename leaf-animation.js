// Leaf Draw V2 — vanilla JS adaptation for static HTML pages
// Ported from src/components/active/capabilities/animations/LeafDrawV2.jsx
(function () {
  var svg = document.getElementById('leaf-draw-svg');
  if (!svg) return;

  var PATH_DATA = [
    { d: "M120,240 C120.5,236 119,230 119.5,224 C120,218 120.5,214 120,210" },
    { d: "M120,210 C111,206 97,194 88,179 C79,164 72,146 70,129 C68,112 72,88 80,68 C88,50 105,37 120,30" },
    { d: "M120,30 C136,38 153,51 161,69 C169,89 173,113 171,130 C169,147 162,165 153,180 C144,195 130,207 120,210" },
    { d: "M120,210 C121,198 118,186 120.5,174 C123,162 117,150 120.5,138 C123,126 117,114 120.5,102 C123,90 118,78 120,66 C121,54 119,42 120,30" },
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
    { d: "M120,1 A3,3 0 1,1 120,7 A3,3 0 1,1 120,1", veinOrder: 15 }
  ];

  var CIRCLE_INDEX = PATH_DATA.length - 1;
  var LEAF_STROKE = 11;

  var SEED_HOLD = 700;
  var DRAW_DUR = 12000;
  var HOLD_DUR = 2200;
  var LEAF_FADE = 1000;
  var DESCEND_DUR = 2500;
  var TOTAL = SEED_HOLD + DRAW_DUR + HOLD_DUR + LEAF_FADE + DESCEND_DUR;

  var SEED_HOLD_END = SEED_HOLD;
  var DRAW_END = SEED_HOLD_END + DRAW_DUR;
  var HOLD_END = DRAW_END + HOLD_DUR;
  var LEAF_FADE_END = HOLD_END + LEAF_FADE;

  var DESCEND_DISTANCE = 236;
  var SWAY_AMPLITUDE = 10;
  var SWAY_CYCLES = 1.5;

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  var ns = 'http://www.w3.org/2000/svg';

  // Create seed circle
  var seedEl = document.createElementNS(ns, 'circle');
  seedEl.setAttribute('cx', '120');
  seedEl.setAttribute('cy', '240');
  seedEl.setAttribute('r', '3');
  seedEl.setAttribute('fill', 'none');
  seedEl.setAttribute('stroke', 'currentColor');
  seedEl.setAttribute('stroke-width', LEAF_STROKE);
  seedEl.setAttribute('opacity', '0');
  svg.appendChild(seedEl);

  // Create leaf group
  var leafGroup = document.createElementNS(ns, 'g');
  leafGroup.setAttribute('opacity', '0');
  svg.appendChild(leafGroup);

  // Create circle group
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

  // Measure lengths and build draw ranges
  var lengths = paths.map(function (p) { return p.getTotalLength(); });

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

  var rawRanges = new Array(PATH_DATA.length);
  var cursor = 0;

  mainPaths.forEach(function (s) {
    var span = s.idx === 0 ? s.len * 4 : s.idx === 3 ? s.len * 2 : s.len;
    rawRanges[s.idx] = { start: cursor, end: cursor + span, len: s.len };
    cursor += span;
  });

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

  var lastVeinEnd = 0;
  veinPaths.forEach(function (v) {
    if (rawRanges[v.idx].end > lastVeinEnd) lastVeinEnd = rawRanges[v.idx].end;
  });
  var avgVeinLen = veinPaths.reduce(function (s, v) { return s + v.len; }, 0) / veinPaths.length;
  var pauseBeforeCircle = avgVeinLen * 0.8;
  cursor = lastVeinEnd + pauseBeforeCircle;
  var circleDrawSpan = circleEntry.len * 4;
  rawRanges[circleEntry.idx] = { start: cursor, end: cursor + circleDrawSpan, len: circleEntry.len };

  var maxEnd = rawRanges[circleEntry.idx].end;
  var ranges = rawRanges.map(function (r) {
    return { start: r.start / maxEnd, end: r.end / maxEnd, len: r.len };
  });

  paths.forEach(function (p, i) {
    var len = ranges[i].len;
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });

  seedEl.setAttribute('opacity', '1');

  // Animation loop
  var startTime = null;
  var raf;

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    var elapsed = (timestamp - startTime) % TOTAL;

    var drawProgress, leafOpacity, circleOpacity, circleTranslateX, circleTranslateY, seedOpacity;

    if (elapsed < SEED_HOLD_END) {
      drawProgress = 0;
      leafOpacity = 0;
      circleOpacity = 0;
      circleTranslateX = 0;
      circleTranslateY = 0;
      seedOpacity = 1;
    } else if (elapsed < DRAW_END) {
      drawProgress = (elapsed - SEED_HOLD_END) / DRAW_DUR;
      leafOpacity = 1;
      circleOpacity = 1;
      circleTranslateX = 0;
      circleTranslateY = 0;
      seedOpacity = 1;
    } else if (elapsed < HOLD_END) {
      drawProgress = 1;
      leafOpacity = 1;
      circleOpacity = 1;
      circleTranslateX = 0;
      circleTranslateY = 0;
      seedOpacity = 1;
    } else if (elapsed < LEAF_FADE_END) {
      drawProgress = 1;
      var t = (elapsed - HOLD_END) / LEAF_FADE;
      leafOpacity = 1 - t;
      circleOpacity = 1;
      circleTranslateX = 0;
      circleTranslateY = 0;
      seedOpacity = 1 - t;
    } else {
      drawProgress = 1;
      leafOpacity = 0;
      circleOpacity = 1;
      var t2 = (elapsed - LEAF_FADE_END) / DESCEND_DUR;
      circleTranslateY = smoothstep(t2) * DESCEND_DISTANCE;
      circleTranslateX = Math.sin(t2 * Math.PI * 2 * SWAY_CYCLES) * SWAY_AMPLITUDE * (1 - t2);
      seedOpacity = 0;
    }

    leafGroup.setAttribute('opacity', leafOpacity);
    circleGroup.setAttribute('opacity', circleOpacity);
    seedEl.setAttribute('opacity', seedOpacity);

    if (circleTranslateX !== 0 || circleTranslateY !== 0) {
      circleGroup.setAttribute('transform', 'translate(' + circleTranslateX + ', ' + circleTranslateY + ')');
    } else {
      circleGroup.removeAttribute('transform');
    }

    for (var i = 0; i < paths.length; i++) {
      var r = ranges[i];
      var seg;
      if (drawProgress >= r.end) {
        seg = 1;
      } else if (drawProgress > r.start) {
        seg = (drawProgress - r.start) / (r.end - r.start);
        seg = smoothstep(seg);
      } else {
        seg = 0;
      }
      paths[i].style.strokeDashoffset = r.len * (1 - seg);
    }

    raf = requestAnimationFrame(animate);
  }

  raf = requestAnimationFrame(animate);
})();
