/* global THREE */
/* eslint-disable no-redeclare */
// ═══════════════════════════════════════
// TREE DRAW 3D — m-session landing page
// ═══════════════════════════════════════
(function () {
    "use strict";
  
    function init() {
      var el = document.getElementById("tree-hero");
      if (!el) return;
  
      var ROTATION_PERIOD  = 14000;
      var TRUNK_DRAW_DUR   = 4500;
      var BRANCH_DRAW_DUR  = 2200;
      var LEAF_CASCADE_DUR = 3500;
      var SPHERE_DRAW_DUR  = 3500;
      var HOLD_DUR         = 2200;
      var FADE_DUR         = 1500;
      var BASE_OPACITY     = 0.55;
  
      var TUBE_SEGS = 64, RAD_SEGS = 8;
      var LEAF_SEGS = 10, LEAF_RAD_SEGS = 4;
  
      var TRUNK_BASE_R = 0.75;
      var TRUNK_TIP_R  = 0.045;
  
      var LEAF_MAX_R   = 0.055;
      var LEAF_MIN_R   = 0.008;
      var LEAF_LEN_MIN = 0.22;
      var LEAF_LEN_MAX = 0.42;
  
      var SPHERE_R = 0.25;
  
      // ═══════════════════════════════════════
      // COLOR
      // ═══════════════════════════════════════
  
      var ah = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent').trim().replace('#', '');
      var aR = parseInt(ah.substring(0, 2), 16) / 255;
      var aG = parseInt(ah.substring(2, 4), 16) / 255;
      var aB = parseInt(ah.substring(4, 6), 16) / 255;
  
      // ═══════════════════════════════════════
      // SHADERS
      // ═══════════════════════════════════════
  
      var VS =
        'varying float vProgress;\n' +
        'void main() {\n' +
        '  vProgress = uv.x;\n' +
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n' +
        '}';
  
      var FS =
        'uniform vec3 uColor;\n' +
        'uniform float uOpacity;\n' +
        'uniform float uDrawProgress;\n' +
        'varying float vProgress;\n' +
        'void main() {\n' +
        '  if (uDrawProgress < 0.001 || vProgress > uDrawProgress) discard;\n' +
        '  gl_FragColor = vec4(uColor, uOpacity);\n' +
        '}';
  
      var SPHERE_VS =
        'varying float vNormY;\n' +
        'varying vec3 vPos;\n' +
        'void main() {\n' +
        '  vNormY = (position.y + 1.0) * 0.5;\n' +
        '  vPos = position;\n' +
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n' +
        '}';
  
      var SPHERE_FS =
        'uniform vec3 uColor;\n' +
        'uniform float uOpacity;\n' +
        'uniform float uDrawProgress;\n' +
        'varying float vNormY;\n' +
        'varying vec3 vPos;\n' +
        '\n' +
        // 3D hash-based noise for organic edge
        'vec3 hash3(vec3 p) {\n' +
        '  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),\n' +
        '           dot(p, vec3(269.5, 183.3, 246.1)),\n' +
        '           dot(p, vec3(113.5, 271.9, 124.6)));\n' +
        '  return fract(sin(p) * 43758.5453123) * 2.0 - 1.0;\n' +
        '}\n' +
        '\n' +
        'float noise3(vec3 p) {\n' +
        '  vec3 i = floor(p);\n' +
        '  vec3 f = fract(p);\n' +
        '  vec3 u = f * f * (3.0 - 2.0 * f);\n' +
        '  return mix(\n' +
        '    mix(mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),\n' +
        '            dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),\n' +
        '        mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),\n' +
        '            dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),\n' +
        '    mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),\n' +
        '            dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),\n' +
        '        mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),\n' +
        '            dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y),\n' +
        '    u.z);\n' +
        '}\n' +
        '\n' +
        'void main() {\n' +
        // Multi-octave noise sampled from sphere surface position
        '  float n = noise3(vPos * 5.0) * 0.22\n' +
        '          + noise3(vPos * 11.0) * 0.12\n' +
        '          + noise3(vPos * 23.0) * 0.06;\n' +
        // Expand drawProgress range to account for noise displacement
        // so it fully fills at progress=1 and is empty at progress=0
        '  float threshold = vNormY + n;\n' +
        '  float expanded = uDrawProgress * 1.5 - 0.25;\n' +
        '  if (threshold > expanded) discard;\n' +
        '  gl_FragColor = vec4(uColor, uOpacity);\n' +
        '}';
  
      function makeMat() {
        return new THREE.ShaderMaterial({
          uniforms: {
            uColor: { value: new THREE.Color(aR, aG, aB) },
            uOpacity: { value: BASE_OPACITY },
            uDrawProgress: { value: 0.0 }
          },
          vertexShader: VS, fragmentShader: FS,
          transparent: true, depthWrite: false, side: THREE.DoubleSide
        });
      }
  
      function makeSphereMat() {
        return new THREE.ShaderMaterial({
          uniforms: {
            uColor: { value: new THREE.Color(aR, aG, aB) },
            uOpacity: { value: BASE_OPACITY },
            uDrawProgress: { value: 0.0 }
          },
          vertexShader: SPHERE_VS, fragmentShader: SPHERE_FS,
          transparent: true, depthWrite: false, side: THREE.DoubleSide
        });
      }
  
      // ═══════════════════════════════════════
      // PROFILE TUBE
      // ═══════════════════════════════════════
  
      function profileTube(curve, segs, radSegs, rFn) {
        var frames = curve.computeFrenetFrames(segs, false);
        var pos = [], nrm = [], uv = [], idx = [];
        for (var i = 0; i <= segs; i++) {
          var t = i / segs, r = rFn(t);
          var c = curve.getPointAt(t);
          var N = frames.normals[i], B = frames.binormals[i];
          for (var j = 0; j <= radSegs; j++) {
            var a = (j / radSegs) * Math.PI * 2;
            var ca = Math.cos(a), sa = Math.sin(a);
            var nx = ca * N.x + sa * B.x;
            var ny = ca * N.y + sa * B.y;
            var nz = ca * N.z + sa * B.z;
            pos.push(c.x + r * nx, c.y + r * ny, c.z + r * nz);
            nrm.push(nx, ny, nz);
            uv.push(t, j / radSegs);
          }
        }
        for (var i = 0; i < segs; i++) {
          for (var j = 0; j < radSegs; j++) {
            var aa = i * (radSegs + 1) + j, bb = aa + 1;
            var cc = (i + 1) * (radSegs + 1) + j, dd = cc + 1;
            idx.push(aa, cc, bb, bb, cc, dd);
          }
        }
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        g.setIndex(idx);
        return g;
      }
  
      function taperedTube(curve, segs, r0, r1, radSegs) {
        return profileTube(curve, segs, radSegs, function (t) {
          return r0 + (r1 - r0) * t;
        });
      }
  
      // Tapered tube with built-in hemispherical cap at the base
      // Cap rings share the same radial segments for seamless geometry
      function cappedTaperedTube(curve, segs, r0, r1, radSegs, capRings) {
        capRings = capRings || 6;
        var frames = curve.computeFrenetFrames(segs, false);
        var pos = [], nrm = [], uv = [], idx = [];
  
        var baseCenter = curve.getPointAt(0);
        var N0 = frames.normals[0], B0 = frames.binormals[0];
        var T0 = frames.tangents[0];
  
        // Cap rings: hemisphere curving downward from south pole to equator
        // South pole is at baseCenter - T0 * r0 (below trunk start)
        // Equator is at baseCenter (flush with first trunk ring)
        for (var ci = 0; ci < capRings; ci++) {
          // angle: 0 at south pole → PI/2 at equator
          var angle = (ci / capRings) * (Math.PI * 0.5);
          var ringR = r0 * Math.sin(angle);    // 0 at pole, r0 at equator
          var dropY = r0 * Math.cos(angle);    // r0 at pole, 0 at equator
          var uvX = 0;
  
          for (var j = 0; j <= radSegs; j++) {
            var a = (j / radSegs) * Math.PI * 2;
            var ca = Math.cos(a), sa = Math.sin(a);
            var nx = ca * N0.x + sa * B0.x;
            var ny = ca * N0.y + sa * B0.y;
            var nz = ca * N0.z + sa * B0.z;
            // Normal: blend radial outward with downward along trunk axis
            var capNx = nx * Math.sin(angle) - T0.x * Math.cos(angle);
            var capNy = ny * Math.sin(angle) - T0.y * Math.cos(angle);
            var capNz = nz * Math.sin(angle) - T0.z * Math.cos(angle);
  
            pos.push(
              baseCenter.x + ringR * nx - T0.x * dropY,
              baseCenter.y + ringR * ny - T0.y * dropY,
              baseCenter.z + ringR * nz - T0.z * dropY
            );
            nrm.push(capNx, capNy, capNz);
            uv.push(uvX, j / radSegs);
          }
        }
  
        // Main tube rings
        for (var i = 0; i <= segs; i++) {
          var t = i / segs;
          var r = r0 + (r1 - r0) * t;
          var c = curve.getPointAt(t);
          var N = frames.normals[i], B = frames.binormals[i];
  
          for (var j = 0; j <= radSegs; j++) {
            var a = (j / radSegs) * Math.PI * 2;
            var ca = Math.cos(a), sa = Math.sin(a);
            var nx = ca * N.x + sa * B.x;
            var ny = ca * N.y + sa * B.y;
            var nz = ca * N.z + sa * B.z;
            pos.push(c.x + r * nx, c.y + r * ny, c.z + r * nz);
            nrm.push(nx, ny, nz);
            uv.push(t, j / radSegs);
          }
        }
  
        // Indices for all rings (cap + tube)
        for (var i = 0; i < capRings + segs; i++) {
          for (var j = 0; j < radSegs; j++) {
            var aa = i * (radSegs + 1) + j, bb = aa + 1;
            var cc = (i + 1) * (radSegs + 1) + j, dd = cc + 1;
            idx.push(aa, cc, bb, bb, cc, dd);
          }
        }
  
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        g.setIndex(idx);
        return g;
      }
  
      function brushR(t) {
        var s = Math.sin(Math.PI * Math.pow(t, 0.85));
        return LEAF_MIN_R + (LEAF_MAX_R - LEAF_MIN_R) * s;
      }
  
      function smoothstep(t) {
        t = Math.max(0, Math.min(1, t));
        return t * t * (3 - 2 * t);
      }
  
      var _s = 42;
      function sr() { _s = (_s * 16807) % 2147483647; return (_s - 1) / 2147483646; }
  
      // ═══════════════════════════════════════
      // TREE
      // ═══════════════════════════════════════
  
      var TH = 11.5;
  
      var trunkPts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.07, 1.5, 0.05),
        new THREE.Vector3(-0.09, 3.0, -0.07),
        new THREE.Vector3(0.08, 4.5, 0.06),
        new THREE.Vector3(-0.05, 6.0, -0.05),
        new THREE.Vector3(0.06, 7.5, 0.04),
        new THREE.Vector3(-0.03, 9.0, -0.03),
        new THREE.Vector3(0.01, TH, 0.01)
      ];
      var trunkCurve = new THREE.CatmullRomCurve3(trunkPts);
  
      function trunkRAt(f) { return TRUNK_BASE_R + (TRUNK_TIP_R - TRUNK_BASE_R) * f; }
      function branchR0(tf) { return trunkRAt(tf) * Math.sqrt(0.45); }
  
      // ═══════════════════════════════════════
      // BRANCHES
      // ═══════════════════════════════════════
  
      var TIER_XL    = 'xl';
      var TIER_MAIN  = 'main';
      var TIER_MED   = 'med';
      var TIER_UPPER = 'upper';
  
      var branchDefs = [
        // ══ EXTRA LARGE (5) ══
        // Evenly spaced at ~72° intervals around the trunk
        // for natural phyllotaxis-like sunlight optimization.
        // Tips stay wide and rise toward the overhead disk.
  
        // XL 1: 15° — right, slight front (trunkFrac 0.16)
        {
          trunkFrac: 0.16, tier: TIER_XL,
          offsets: [
            [ 1.2,  0.3,  0.3],
            [ 2.2,  0.8,  0.6],
            [ 2.9,  1.5,  0.8],
            [ 3.0,  2.5,  0.8],
            [ 2.9,  3.7,  0.9]
          ]
        },
        // XL 2: 87° — front (trunkFrac 0.19)
        {
          trunkFrac: 0.19, tier: TIER_XL,
          offsets: [
            [ 0.1,  0.3,  1.2],
            [ 0.1,  0.8,  2.2],
            [ 0.2,  1.5,  2.8],
            [ 0.2,  2.5,  2.9],
            [ 0.1,  3.8,  2.8]
          ]
        },
        // XL 3: 159° — left-front (trunkFrac 0.22)
        {
          trunkFrac: 0.22, tier: TIER_XL,
          offsets: [
            [-1.1,  0.3,  0.4],
            [-2.1,  0.8,  0.8],
            [-2.7,  1.5,  1.0],
            [-2.8,  2.5,  1.1],
            [-2.7,  3.7,  1.1]
          ]
        },
        // XL 4: 231° — left-back (trunkFrac 0.25)
        {
          trunkFrac: 0.25, tier: TIER_XL,
          offsets: [
            [-0.8,  0.3, -0.9],
            [-1.4,  0.8, -1.7],
            [-1.9,  1.5, -2.3],
            [-1.9,  2.5, -2.4],
            [-1.8,  3.6, -2.3]
          ]
        },
        // XL 5: 303° — right-back (trunkFrac 0.28)
        {
          trunkFrac: 0.28, tier: TIER_XL,
          offsets: [
            [ 0.7,  0.3, -1.0],
            [ 1.2,  0.8, -1.9],
            [ 1.6,  1.5, -2.5],
            [ 1.7,  2.5, -2.6],
            [ 1.6,  3.7, -2.5]
          ]
        },
        // ══ MAIN ══
        {
          trunkFrac: 0.32, tier: TIER_MAIN,
          offsets: [
            [ 0.7,  0.4,  0.4],
            [ 1.2,  1.0,  0.6],
            [ 1.5,  1.8,  0.7],
            [ 1.6,  2.6,  0.7]
          ]
        },
        {
          trunkFrac: 0.40, tier: TIER_MAIN,
          offsets: [
            [-0.6,  0.3, -0.5],
            [-1.1,  0.8, -0.8],
            [-1.4,  1.5, -0.9],
            [-1.5,  2.4, -0.8]
          ]
        },
        {
          trunkFrac: 0.48, tier: TIER_MAIN,
          offsets: [
            [-0.6,  0.3,  0.5],
            [-1.0,  0.8,  0.8],
            [-1.2,  1.6,  0.8],
            [-1.1,  2.5,  0.7]
          ]
        },
        {
          trunkFrac: 0.55, tier: TIER_MAIN,
          offsets: [
            [ 0.5,  0.3, -0.5],
            [ 0.9,  0.7, -0.9],
            [ 1.1,  1.4, -1.0],
            [ 1.2,  2.2, -0.9]
          ]
        },
        // ══ MEDIUM-UPPER ══
        {
          trunkFrac: 0.62, tier: TIER_MED,
          offsets: [
            [ 0.6,  0.3,  0.3],
            [ 1.0,  0.7,  0.5],
            [ 1.1,  1.3,  0.5],
            [ 1.0,  1.9,  0.4]
          ]
        },
        {
          trunkFrac: 0.68, tier: TIER_MED,
          offsets: [
            [-0.4,  0.2, -0.5],
            [-0.7,  0.6, -0.8],
            [-0.9,  1.1, -0.8],
            [-0.8,  1.7, -0.6]
          ]
        },
        {
          trunkFrac: 0.73, tier: TIER_MED,
          offsets: [
            [-0.5,  0.2,  0.4],
            [-0.8,  0.5,  0.6],
            [-0.9,  1.0,  0.6],
            [-0.8,  1.5,  0.5]
          ]
        },
        // ══ UPPER ══
        {
          trunkFrac: 0.79, tier: TIER_UPPER,
          offsets: [
            [ 0.4,  0.2,  0.3],
            [ 0.6,  0.5,  0.4],
            [ 0.7,  0.9,  0.35]
          ]
        },
        {
          trunkFrac: 0.84, tier: TIER_UPPER,
          offsets: [
            [-0.35, 0.2, -0.35],
            [-0.55, 0.5, -0.45],
            [-0.6,  0.85,-0.35]
          ]
        },
        {
          trunkFrac: 0.89, tier: TIER_UPPER,
          offsets: [
            [ 0.15, 0.2,  0.4],
            [ 0.25, 0.45, 0.55],
            [ 0.2,  0.8,  0.5]
          ]
        }
      ];
  
      var tierConfig = {};
      tierConfig[TIER_XL]    = { taperEnd: 0.10, bodyLeaves: 80, tipLeaves: 22, sheathLeaves: 300, collarLeaves: 35 };
      tierConfig[TIER_MAIN]  = { taperEnd: 0.12, bodyLeaves: 75, tipLeaves: 20, sheathLeaves: 70,  collarLeaves: 16 };
      tierConfig[TIER_MED]   = { taperEnd: 0.11, bodyLeaves: 55, tipLeaves: 15, sheathLeaves: 45,  collarLeaves: 12 };
      tierConfig[TIER_UPPER] = { taperEnd: 0.10, bodyLeaves: 35, tipLeaves: 12, sheathLeaves: 0,   collarLeaves: 8 };
  
      // ═══════════════════════════════════════
      // BUILD SCENE
      // ═══════════════════════════════════════
  
      var W = el.clientWidth, H = el.clientHeight;
  
      var scene = new THREE.Scene();
      var cam = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
      cam.position.set(0, 6.5, 21);
      cam.lookAt(0, 5.8, 0);
  
      var ren = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      ren.setSize(W, H);
      ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      ren.setClearColor(0x000000, 0);
      el.appendChild(ren.domElement);
  
      var tree = new THREE.Group();
      scene.add(tree);
  
      // --- Trunk ---
      var tGeo = cappedTaperedTube(trunkCurve, TUBE_SEGS, TRUNK_BASE_R, TRUNK_TIP_R, RAD_SEGS, 8);
      var tMat = makeMat();
      tree.add(new THREE.Mesh(tGeo, tMat));
  
      // --- Branches ---
      // Origin is offset from trunk center to trunk surface
      // in the XZ direction of the first offset point.
      var bMeshes = [], bCurves = [], bTips = [], bTipDirs = [];
  
      branchDefs.forEach(function (def) {
        var trunkCenter = trunkCurve.getPointAt(def.trunkFrac);
        var trunkTangent = trunkCurve.getTangentAt(def.trunkFrac).normalize();
        var trunkRadius = trunkRAt(def.trunkFrac);
  
        // Determine outward direction: project first offset onto plane
        // perpendicular to trunk tangent (XZ direction the branch heads)
        var firstOff = new THREE.Vector3(def.offsets[0][0], def.offsets[0][1], def.offsets[0][2]);
        // Remove the component along trunk tangent to get pure radial direction
        var radialDir = firstOff.clone().sub(
          trunkTangent.clone().multiplyScalar(firstOff.dot(trunkTangent))
        );
        if (radialDir.lengthSq() > 0.001) {
          radialDir.normalize();
        } else {
          // Fallback: just use XZ of first offset
          radialDir.set(firstOff.x, 0, firstOff.z).normalize();
        }
  
        // Surface origin: trunk center + radial direction * trunk radius
        var surfaceOffset = radialDir.clone().multiplyScalar(trunkRadius * 0.65);
        var surfaceOrigin = trunkCenter.clone().add(surfaceOffset);
  
        var r0 = branchR0(def.trunkFrac);
        var tc = tierConfig[def.tier];
        var r1 = r0 * tc.taperEnd;
  
        // Build branch curve from surface origin
        // All offset points shift by the same surface offset
        var pts = [surfaceOrigin.clone()];
        def.offsets.forEach(function (o) {
          pts.push(new THREE.Vector3(
            trunkCenter.x + surfaceOffset.x + o[0],
            trunkCenter.y + surfaceOffset.y + o[1],
            trunkCenter.z + surfaceOffset.z + o[2]
          ));
        });
  
        var c = new THREE.CatmullRomCurve3(pts);
        var g = taperedTube(c, TUBE_SEGS, r0, r1, RAD_SEGS);
        var m = makeMat();
        var mesh = new THREE.Mesh(g, m);
        tree.add(mesh);
        bMeshes.push(mesh);
        bCurves.push(c);
        bTips.push(c.getPointAt(1.0));
        bTipDirs.push(c.getTangentAt(1.0));
      });
  
      // ═══════════════════════════════════════
      // LEAVES
      // ═══════════════════════════════════════
  
      var allLeaves = [];
  
      function addBrushLeaf(origin, dir, len) {
        var d = dir.clone().normalize();
        var bendAxis = new THREE.Vector3(sr() - 0.5, sr() - 0.5, sr() - 0.5).normalize();
        var bendAmt = (sr() - 0.5) * 0.4;
        var mid = origin.clone().add(d.clone().multiplyScalar(len * 0.5));
        mid.add(bendAxis.clone().multiplyScalar(len * bendAmt * 0.15));
        var tip = origin.clone().add(d.clone().multiplyScalar(len));
        var curve = new THREE.CatmullRomCurve3([origin.clone(), mid, tip]);
        var geo = profileTube(curve, LEAF_SEGS, LEAF_RAD_SEGS, brushR);
        var mat = makeMat();
        var mesh = new THREE.Mesh(geo, mat);
        tree.add(mesh);
        return mesh;
      }
  
      function scatterAlongBranch(bCurve, bIdx, count) {
        for (var li = 0; li < count; li++) {
          var t = 0.20 + Math.pow(sr(), 1.3) * 0.78;
          t = Math.min(t, 0.98);
          var branchPt = bCurve.getPointAt(t);
          var tangent = bCurve.getTangentAt(t);
  
          var up = new THREE.Vector3(0, 1, 0);
          var right = new THREE.Vector3().crossVectors(tangent, up).normalize();
          if (right.lengthSq() < 0.001) right.set(1, 0, 0);
          var localUp = new THREE.Vector3().crossVectors(right, tangent).normalize();
  
          var angle = sr() * Math.PI * 2;
          var outDir = new THREE.Vector3(
            right.x * Math.cos(angle) + localUp.x * Math.sin(angle),
            right.y * Math.cos(angle) + localUp.y * Math.sin(angle),
            right.z * Math.cos(angle) + localUp.z * Math.sin(angle)
          );
          outDir.y += 0.1 + sr() * 0.35;
          outDir.x += branchPt.x * 0.08;
          outDir.z += branchPt.z * 0.08;
          outDir.normalize();
  
          var dist = 0.04 + sr() * sr() * 0.35;
          var leafOrigin = branchPt.clone().add(outDir.clone().multiplyScalar(dist));
          var len = LEAF_LEN_MIN + sr() * (LEAF_LEN_MAX - LEAF_LEN_MIN);
  
          var leafDir = outDir.clone();
          leafDir.x += (sr() - 0.5) * 0.5;
          leafDir.y += (sr() - 0.5) * 0.3;
          leafDir.z += (sr() - 0.5) * 0.5;
          leafDir.normalize();
  
          var mesh = addBrushLeaf(leafOrigin, leafDir, len);
          allLeaves.push({ mesh: mesh, heightY: leafOrigin.y, brIdx: bIdx });
        }
      }
  
      function tipCluster(tipPt, tipDir, bIdx, count) {
        var td = tipDir.clone().normalize();
        for (var i = 0; i < count; i++) {
          var randDir = new THREE.Vector3(sr() - 0.5, sr() - 0.5, sr() - 0.5).normalize();
          randDir.add(td.clone().multiplyScalar(0.8));
          randDir.y += 0.2 + sr() * 0.3;
          randDir.normalize();
  
          var dist = 0.02 + sr() * 0.32;
          var leafOrigin = tipPt.clone().add(randDir.clone().multiplyScalar(dist));
          var len = LEAF_LEN_MIN + sr() * (LEAF_LEN_MAX - LEAF_LEN_MIN);
  
          var leafDir = randDir.clone();
          leafDir.x += (sr() - 0.5) * 0.6;
          leafDir.y += (sr() - 0.5) * 0.4;
          leafDir.z += (sr() - 0.5) * 0.6;
          leafDir.normalize();
  
          var mesh = addBrushLeaf(leafOrigin, leafDir, len);
          allLeaves.push({ mesh: mesh, heightY: leafOrigin.y, brIdx: bIdx });
        }
      }
  
      // ═══════════════════════════════════════
      // TIP COLLAR — horizontal radial leaves bridging
      // body/sheath leaves into the tip cluster
      // ═══════════════════════════════════════
      // Samples a zone near the branch endpoint (t=0.85-1.0)
      // and radiates leaves outward perpendicular to the branch,
      // creating a seamless transition ring.
  
      function tipCollar(bCurve, bIdx, count) {
        for (var i = 0; i < count; i++) {
          // Sample from near-tip zone right up to the endpoint
          var t = 0.82 + sr() * 0.18;
          t = Math.min(t, 1.0);
          var pt = bCurve.getPointAt(t);
          var tangent = bCurve.getTangentAt(Math.min(t, 0.99));
  
          // Build perpendicular frame
          var up = new THREE.Vector3(0, 1, 0);
          var right = new THREE.Vector3().crossVectors(tangent, up).normalize();
          if (right.lengthSq() < 0.001) right.set(1, 0, 0);
          var localUp = new THREE.Vector3().crossVectors(right, tangent).normalize();
  
          // Radial outward direction — mostly horizontal/perpendicular to branch
          var angle = sr() * Math.PI * 2;
          var outDir = new THREE.Vector3(
            right.x * Math.cos(angle) + localUp.x * Math.sin(angle),
            right.y * Math.cos(angle) + localUp.y * Math.sin(angle),
            right.z * Math.cos(angle) + localUp.z * Math.sin(angle)
          );
  
          // Keep mostly perpendicular — only slight upward bias
          outDir.y += sr() * 0.15;
          outDir.normalize();
  
          // Wider spread near the very tip to overlap with tip cluster
          var dist = 0.06 + sr() * 0.28;
          var leafOrigin = pt.clone().add(outDir.clone().multiplyScalar(dist));
          var len = LEAF_LEN_MIN + sr() * (LEAF_LEN_MAX - LEAF_LEN_MIN);
  
          // Leaf direction: radially outward, staying horizontal
          var leafDir = outDir.clone();
          leafDir.x += (sr() - 0.5) * 0.4;
          leafDir.y += (sr() - 0.5) * 0.2;
          leafDir.z += (sr() - 0.5) * 0.4;
          leafDir.normalize();
  
          var mesh = addBrushLeaf(leafOrigin, leafDir, len);
          allLeaves.push({ mesh: mesh, heightY: leafOrigin.y, brIdx: bIdx });
        }
      }
  
      // ═══════════════════════════════════════
      // SHEATH LEAVES — tapered envelope around branches
      // ═══════════════════════════════════════
      // Invisible sheath wider at base, tapering to branch tip.
      // Leaves originate from the sheath surface outward,
      // creating a bushy canopy that's full near the trunk
      // and tightens toward branch endpoints.
  
      function sheathLeaves(bCurve, bIdx, brStartR, brEndR, count) {
        // Sheath radius: starts at ~4x branch radius, tapers to ~1.2x at tip
        var sheathBaseR = brStartR * 2.5;
        var sheathTipR  = brEndR * 1.5;
  
        for (var li = 0; li < count; li++) {
          // Sample along branch — base-heavy distribution
          // Power curve clusters more leaves near the base where
          // the sheath is widest and coverage looks sparsest
          var t = 0.15 + Math.pow(sr(), 1.6) * 0.83;
          t = Math.min(t, 0.98);
          var branchPt = bCurve.getPointAt(t);
          var tangent = bCurve.getTangentAt(t);
  
          // Sheath radius at this point (linear taper)
          var sheathR = sheathBaseR + (sheathTipR - sheathBaseR) * t;
  
          // Build perpendicular frame
          var up = new THREE.Vector3(0, 1, 0);
          var right = new THREE.Vector3().crossVectors(tangent, up).normalize();
          if (right.lengthSq() < 0.001) right.set(1, 0, 0);
          var localUp = new THREE.Vector3().crossVectors(right, tangent).normalize();
  
          // Random radial direction
          var angle = sr() * Math.PI * 2;
          var outDir = new THREE.Vector3(
            right.x * Math.cos(angle) + localUp.x * Math.sin(angle),
            right.y * Math.cos(angle) + localUp.y * Math.sin(angle),
            right.z * Math.cos(angle) + localUp.z * Math.sin(angle)
          );
  
          // Upward and outward bias
          outDir.y += 0.15 + sr() * 0.3;
          outDir.x += branchPt.x * 0.05;
          outDir.z += branchPt.z * 0.05;
          outDir.normalize();
  
          // Place leaf at sheath surface with some variance
          var dist = sheathR * (0.8 + sr() * 0.4);
          var leafOrigin = branchPt.clone().add(outDir.clone().multiplyScalar(dist));
  
          var len = LEAF_LEN_MIN + sr() * (LEAF_LEN_MAX - LEAF_LEN_MIN);
  
          // Leaf direction: outward from sheath with randomization
          var leafDir = outDir.clone();
          leafDir.x += (sr() - 0.5) * 0.6;
          leafDir.y += (sr() - 0.5) * 0.4;
          leafDir.z += (sr() - 0.5) * 0.6;
          leafDir.normalize();
  
          var mesh = addBrushLeaf(leafOrigin, leafDir, len);
          allLeaves.push({ mesh: mesh, heightY: leafOrigin.y, brIdx: bIdx });
        }
      }
  
      branchDefs.forEach(function (def, bIdx) {
        var tc = tierConfig[def.tier];
        var r0 = branchR0(def.trunkFrac);
        var r1 = r0 * tc.taperEnd;
        scatterAlongBranch(bCurves[bIdx], bIdx, tc.bodyLeaves);
        tipCollar(bCurves[bIdx], bIdx, tc.collarLeaves);
        tipCluster(bTips[bIdx], bTipDirs[bIdx], bIdx, tc.tipLeaves);
        if (tc.sheathLeaves > 0) {
          sheathLeaves(bCurves[bIdx], bIdx, r0, r1, tc.sheathLeaves);
        }
      });
  
      // ═══════════════════════════════════════
      // TRUNK CROWN — leaves along top third of trunk
      // ═══════════════════════════════════════
  
      // Trunk sheath: covers t=0.67 to t=0.98
      // Radius: 2x trunk radius at start, tapers to trunk tip radius
      (function () {
        var TRUNK_SHEATH_COUNT = 200;
        var startT = 0.67;
        var endT = 0.98;
  
        for (var li = 0; li < TRUNK_SHEATH_COUNT; li++) {
          var t = startT + sr() * (endT - startT);
          var pt = trunkCurve.getPointAt(t);
          var tan = trunkCurve.getTangentAt(t);
  
          var trunkR = trunkRAt(t);
          var sheathR = trunkR * 2.0;
  
          var up = new THREE.Vector3(0, 1, 0);
          var right = new THREE.Vector3().crossVectors(tan, up).normalize();
          if (right.lengthSq() < 0.001) right.set(1, 0, 0);
          var localUp = new THREE.Vector3().crossVectors(right, tan).normalize();
  
          var angle = sr() * Math.PI * 2;
          var outDir = new THREE.Vector3(
            right.x * Math.cos(angle) + localUp.x * Math.sin(angle),
            right.y * Math.cos(angle) + localUp.y * Math.sin(angle),
            right.z * Math.cos(angle) + localUp.z * Math.sin(angle)
          );
          outDir.y += 0.1 + sr() * 0.25;
          outDir.normalize();
  
          var dist = sheathR * (0.8 + sr() * 0.4);
          var o = pt.clone().add(outDir.clone().multiplyScalar(dist));
          var len = LEAF_LEN_MIN + sr() * (LEAF_LEN_MAX - LEAF_LEN_MIN) * 0.8;
  
          var leafDir = outDir.clone();
          leafDir.x += (sr() - 0.5) * 0.5;
          leafDir.y += (sr() - 0.5) * 0.3;
          leafDir.z += (sr() - 0.5) * 0.5;
          leafDir.normalize();
  
          var mesh = addBrushLeaf(o, leafDir, len);
          allLeaves.push({ mesh: mesh, heightY: o.y, brIdx: -1 });
        }
  
        // Trunk tip collar — radial leaves near the very top
        var TRUNK_COLLAR_COUNT = 35;
        for (var ci = 0; ci < TRUNK_COLLAR_COUNT; ci++) {
          var t = 0.90 + sr() * 0.10;
          t = Math.min(t, 1.0);
          var pt = trunkCurve.getPointAt(t);
          var tan = trunkCurve.getTangentAt(Math.min(t, 0.99));
  
          var up = new THREE.Vector3(0, 1, 0);
          var right = new THREE.Vector3().crossVectors(tan, up).normalize();
          if (right.lengthSq() < 0.001) right.set(1, 0, 0);
          var localUp = new THREE.Vector3().crossVectors(right, tan).normalize();
  
          var angle = sr() * Math.PI * 2;
          var outDir = new THREE.Vector3(
            right.x * Math.cos(angle) + localUp.x * Math.sin(angle),
            right.y * Math.cos(angle) + localUp.y * Math.sin(angle),
            right.z * Math.cos(angle) + localUp.z * Math.sin(angle)
          );
          outDir.y += sr() * 0.12;
          outDir.normalize();
  
          var dist = 0.05 + sr() * 0.2;
          var o = pt.clone().add(outDir.clone().multiplyScalar(dist));
          var len = LEAF_LEN_MIN + sr() * (LEAF_LEN_MAX - LEAF_LEN_MIN) * 0.75;
  
          var leafDir = outDir.clone();
          leafDir.x += (sr() - 0.5) * 0.4;
          leafDir.y += (sr() - 0.5) * 0.2;
          leafDir.z += (sr() - 0.5) * 0.4;
          leafDir.normalize();
  
          var mesh = addBrushLeaf(o, leafDir, len);
          allLeaves.push({ mesh: mesh, heightY: o.y, brIdx: -1 });
        }
  
        // Trunk tip cluster — lotus flower arrangement
        // One crown leaf pointing straight up, then concentric rings
        // opening outward and downward like a lotus bloom
        var trunkTip = trunkCurve.getPointAt(1.0).add(new THREE.Vector3(0, 0.2, 0));
  
        // Crown leaf — single highest point, straight up
        (function () {
          var o = trunkTip.clone().add(new THREE.Vector3(0, 0.03, 0));
          var dir = new THREE.Vector3(0.02, 1, 0.01).normalize();
          var mesh = addBrushLeaf(o, dir, LEAF_LEN_MAX * 0.85);
          allLeaves.push({ mesh: mesh, heightY: o.y + 1, brIdx: -1 });
        })();
  
        // Lotus rings: each ring tilts further from vertical
        var rings = [
          { count: 5,  tiltDeg: 22,  yOff: -0.02, dist: 0.04, lenMul: 0.8 },
          { count: 7,  tiltDeg: 42,  yOff: -0.06, dist: 0.08, lenMul: 0.85 },
          { count: 9,  tiltDeg: 62,  yOff: -0.10, dist: 0.12, lenMul: 0.9 },
          { count: 10, tiltDeg: 78,  yOff: -0.14, dist: 0.16, lenMul: 0.9 }
        ];
  
        rings.forEach(function (ring) {
          var tiltRad = ring.tiltDeg * Math.PI / 180;
          var sinT = Math.sin(tiltRad);
          var cosT = Math.cos(tiltRad);
  
          for (var i = 0; i < ring.count; i++) {
            // Evenly spaced around the circle with slight randomization
            var angle = (i / ring.count) * Math.PI * 2 + sr() * 0.3;
  
            // Direction: tilted outward from vertical by tiltDeg
            var dir = new THREE.Vector3(
              Math.cos(angle) * sinT,
              cosT,
              Math.sin(angle) * sinT
            ).normalize();
  
            // Origin: at trunk tip, offset down slightly per ring
            var o = trunkTip.clone().add(new THREE.Vector3(0, ring.yOff, 0));
            // Push out from center by ring dist
            o.add(new THREE.Vector3(
              Math.cos(angle) * ring.dist,
              0,
              Math.sin(angle) * ring.dist
            ));
  
            var len = (LEAF_LEN_MIN + sr() * (LEAF_LEN_MAX - LEAF_LEN_MIN)) * ring.lenMul;
  
            // Leaf stroke direction follows the petal direction with slight variance
            var leafDir = dir.clone();
            leafDir.x += (sr() - 0.5) * 0.15;
            leafDir.z += (sr() - 0.5) * 0.15;
            leafDir.normalize();
  
            var mesh = addBrushLeaf(o, leafDir, len);
            allLeaves.push({ mesh: mesh, heightY: o.y, brIdx: -1 });
          }
        });
      })();
  
      allLeaves.sort(function (a, b) { return a.heightY - b.heightY; });
  
      // --- Crown Sphere — raised higher to clear trunk leaves ---
      var topPt = trunkCurve.getPointAt(1.0);
      var sphereGeo = new THREE.SphereGeometry(SPHERE_R, 48, 32);
      var sphereMat = makeSphereMat();
      var sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.position.set(topPt.x, topPt.y + 1.2, topPt.z);
      tree.add(sphereMesh);
  
  
      // ═══════════════════════════════════════
      // TIMELINE — seed-sphere lifecycle
      // ═══════════════════════════════════════
      // The sphere bridges loop cycles:
      // 1. Seed at base (visible, trunk-sized)
      // 2. Trunk grows from seed, seed fades out
      // 3. Tree draws (branches, leaves)
      // 4. Sphere reveals at crown
      // 5. Hold
      // 6. Tree fades, sphere stays
      // 7. Sphere descends to base with breeze
      // 8. Sphere grows to trunk diameter → loop
  
      var SEED_HOLD_DUR   = 600;
      var SEED_FADE_DUR   = 4000;
      var DESCEND_DUR     = 3000;
      var SEED_GROW_DUR   = 300;    // brief settle at base before trunk grows
  
      var bTriggers = branchDefs.map(function (d) { return d.trunkFrac * TRUNK_DRAW_DUR; });
      var brDone = Math.max.apply(null, bTriggers.map(function (t) { return t + BRANCH_DRAW_DUR; }));
  
      // Phase boundaries (cumulative from loop start)
      var seedHoldEnd   = SEED_HOLD_DUR;
      var trunkStart    = seedHoldEnd;                     // trunk begins after seed hold
      var trunkEnd      = trunkStart + TRUNK_DRAW_DUR;
      var leafStart     = trunkStart + brDone * 0.80;
      var leafEnd       = leafStart + LEAF_CASCADE_DUR;
      var sphereRevStart = leafStart + LEAF_CASCADE_DUR * 0.55;
      var sphereRevEnd  = sphereRevStart + SPHERE_DRAW_DUR;
      var holdStart     = Math.max(sphereRevEnd, leafEnd);
      var holdEnd       = holdStart + 1800;
      var treeFadeEnd   = holdEnd + FADE_DUR;
      var descendStart  = holdEnd + FADE_DUR * 0.70;  // overlap: descent begins during fade
      var descendEnd    = descendStart + DESCEND_DUR;
      var dissolveStart = descendStart + DESCEND_DUR * 0.80;  // dissolve begins at 80% descent
      var seedGrowEnd   = descendEnd + SEED_GROW_DUR;
      var LOOP          = seedGrowEnd;
  
      // Leaf stagger (offset by trunkStart since trunk now starts later)
      var nL = allLeaves.length;
      allLeaves.forEach(function (l, i) {
        var f = nL > 1 ? i / (nL - 1) : 0;
        l.t0  = leafStart + f * (LEAF_CASCADE_DUR * 0.55);
        l.dur = LEAF_CASCADE_DUR * 0.45;
      });
  
      // Branch triggers offset by trunk start
      var bTriggersAbs = bTriggers.map(function (t) { return trunkStart + t; });
  
      // Sphere positions
      var sphereTopY = topPt.y + 1.2;
      var sphereBaseY = 0;
      var seedScale = (TRUNK_BASE_R / SPHERE_R) * 0.93;  // 93% of trunk diameter
  
      // Sway config for descent
      var SWAY_AMP = 0.4;
      var SWAY_CYCLES = 2.0;
  
      // ═══════════════════════════════════════
      // RENDER
      // ═══════════════════════════════════════
  
      var t0 = null;
  
      function frame(ts) {
        requestAnimationFrame(frame);
        if (t0 === null) t0 = ts;
        var e = ts - t0;
  
        tree.rotation.y = (e / ROTATION_PERIOD) * Math.PI * 2;
  
        var lt = e % LOOP;
  
        // ── Tree fade (only tree, not sphere) ──
        var treeFade = 1.0;
        if (lt > holdEnd && lt <= treeFadeEnd) {
          treeFade = 1.0 - smoothstep((lt - holdEnd) / FADE_DUR);
        } else if (lt > treeFadeEnd) {
          treeFade = 0.0;
        }
  
        // ── Trunk + cap ──
        // During seed hold: cap fades in (drawProgress stays at 0 = cap only)
        // After trunkStart: trunk draws normally
        var trunkP = 0;
        var trunkOpacity = 0;
  
        if (lt < seedHoldEnd) {
          // Cap fading in during seed hold
          trunkP = 0;  // uv.x=0 shows only the cap
          trunkOpacity = BASE_OPACITY * smoothstep(lt / seedHoldEnd);
        } else if (lt < trunkEnd) {
          trunkP = smoothstep((lt - trunkStart) / TRUNK_DRAW_DUR);
          trunkOpacity = BASE_OPACITY * treeFade;
        } else if (lt <= treeFadeEnd) {
          trunkP = 1;
          trunkOpacity = BASE_OPACITY * treeFade;
        } else {
          trunkP = 1;
          trunkOpacity = 0;
        }
        tMat.uniforms.uDrawProgress.value = trunkP;
        tMat.uniforms.uOpacity.value = trunkOpacity;
  
        // ── Branches ──
        var branchFade = lt < trunkStart ? 0 : treeFade;
        bMeshes.forEach(function (m, i) {
          var tr = bTriggersAbs[i];
          var p = 0;
          if (lt >= tr) {
            p = lt < tr + BRANCH_DRAW_DUR ? smoothstep((lt - tr) / BRANCH_DRAW_DUR) : 1;
          }
          m.material.uniforms.uDrawProgress.value = p;
          m.material.uniforms.uOpacity.value = BASE_OPACITY * branchFade;
        });
  
        // ── Leaves ──
        allLeaves.forEach(function (l) {
          var p = 0;
          if (lt >= l.t0) {
            p = lt < l.t0 + l.dur ? smoothstep((lt - l.t0) / l.dur) : 1;
          }
          l.mesh.material.uniforms.uDrawProgress.value = p;
          l.mesh.material.uniforms.uOpacity.value = BASE_OPACITY * branchFade;
        });
  
        // ── Sphere — independent lifecycle ──
        var sDrawP = 0;
        var sOpacity = 0;
        var sPosY = sphereTopY;
        var sScale = 1.0;
  
        // Compute dissolve progress (spans loop boundary)
        var dissolveElapsed = lt >= dissolveStart
          ? lt - dissolveStart
          : (LOOP - dissolveStart) + lt;
        var dissolveT = Math.min(dissolveElapsed / SEED_FADE_DUR, 1.0);
        var isSeedDissolving = dissolveElapsed < SEED_FADE_DUR;
        var isSeedDone = !isSeedDissolving && lt < sphereRevStart;
  
        if (lt >= descendStart && lt < dissolveStart) {
          // DESCEND (before dissolve starts): sphere floats down
          var dT = (lt - descendStart) / DESCEND_DUR;
          var dEased = smoothstep(dT);
          sDrawP = 1;
          sOpacity = BASE_OPACITY;
          sPosY = sphereTopY + (sphereBaseY - sphereTopY) * dEased;
          sScale = 1.0 + (seedScale - 1.0) * smoothstep(dT);
          var breeze = Math.sin(dT * Math.PI) * (1.0 - dT);
          var driftX = Math.sin(dT * Math.PI * 2.0) * breeze;
          var driftZ = Math.sin(dT * Math.PI * 1.3 + 0.8) * breeze * 0.4;
          sphereMesh.position.x = topPt.x + driftX * SWAY_AMP;
          sphereMesh.position.z = topPt.z + driftZ * SWAY_AMP;
  
        } else if (lt >= dissolveStart) {
          // DESCEND (dissolving): still moving down, dissolve has begun
          var dT = (lt - descendStart) / DESCEND_DUR;
          var dEased = smoothstep(dT);
          sDrawP = 1.0 - dissolveT;
          sOpacity = BASE_OPACITY;
          sPosY = sphereTopY + (sphereBaseY - sphereTopY) * dEased;
          sScale = 1.0 + (seedScale - 1.0) * smoothstep(dT);
          var breeze = Math.sin(dT * Math.PI) * (1.0 - dT);
          var driftX = Math.sin(dT * Math.PI * 2.0) * breeze;
          var driftZ = Math.sin(dT * Math.PI * 1.3 + 0.8) * breeze * 0.4;
          sphereMesh.position.x = topPt.x + driftX * SWAY_AMP;
          sphereMesh.position.z = topPt.z + driftZ * SWAY_AMP;
  
        } else if (isSeedDissolving) {
          // SEED AT BASE: continuing dissolve from descent
          sDrawP = 1.0 - dissolveT;
          sOpacity = BASE_OPACITY;
          sPosY = sphereBaseY;
          sScale = seedScale;
  
        } else if (isSeedDone) {
          // INVISIBLE: dissolve complete, waiting for crown reveal
          sDrawP = 0;
          sOpacity = 0;
          sPosY = sphereTopY;
          sScale = 1.0;
  
        } else if (lt < sphereRevEnd) {
          // SPHERE REVEAL at crown: noisy crawl
          sDrawP = smoothstep((lt - sphereRevStart) / SPHERE_DRAW_DUR);
          sOpacity = BASE_OPACITY;
          sPosY = sphereTopY;
          sScale = 1.0;
  
        } else if (lt <= holdEnd) {
          // HOLD: fully visible at top
          sDrawP = 1;
          sOpacity = BASE_OPACITY;
          sPosY = sphereTopY;
          sScale = 1.0;
  
        } else if (lt <= descendStart) {
          // TREE FADE: sphere stays fully visible at top while tree fades
          sDrawP = 1;
          sOpacity = BASE_OPACITY;
          sPosY = sphereTopY;
          sScale = 1.0;
        }
  
        // Reset x/z for non-descend phases
        if (lt < descendStart || lt > descendEnd) {
          sphereMesh.position.x = topPt.x;
          sphereMesh.position.z = topPt.z;
        }
  
        sphereMesh.position.y = sPosY;
        sphereMesh.scale.setScalar(sScale);
        sphereMat.uniforms.uDrawProgress.value = sDrawP;
        sphereMat.uniforms.uOpacity.value = sOpacity;
  
        ren.render(scene, cam);
      }
  
      requestAnimationFrame(frame);
  
      window.addEventListener('resize', function () {
        W = el.clientWidth; H = el.clientHeight;
        cam.aspect = W / H;
        cam.updateProjectionMatrix();
        ren.setSize(W, H);
      });

      // ── Theme change listener ──
      new MutationObserver(function () {
        if (!el.isConnected) return;
        var h = getComputedStyle(document.documentElement)
          .getPropertyValue('--accent').trim().replace('#', '');
        var r = parseInt(h.substring(0, 2), 16) / 255;
        var g = parseInt(h.substring(2, 4), 16) / 255;
        var b = parseInt(h.substring(4, 6), 16) / 255;
        tree.traverse(function (child) {
          if (child.isMesh && child.material.uniforms && child.material.uniforms.uColor) {
            child.material.uniforms.uColor.value.setRGB(r, g, b);
          }
        });
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    } // end init
  
    // Load Three.js dynamically if needed, then initialize
    if (window.THREE) {
      init();
    } else {
      var s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      s.onload = init;
      document.head.appendChild(s);
    }
  })();