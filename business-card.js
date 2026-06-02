/* global THREE */
// ═══════════════════════════════════════
// 3D BUSINESS CARD — m-session landing page
// Floating card with beveled edges and
// mouse-tracking tilt interaction
// ═══════════════════════════════════════
(function () {
  "use strict";

  function init() {
    var wrap = document.querySelector(".card3d-wrap");
    if (!wrap) return;
    var canvas = document.getElementById("card3d-canvas");
    if (!canvas) return;

    // ── Config ──
    var isMobile = window.innerWidth <= 768;
    var isLight = document.documentElement.classList.contains("light");

    // Card geometry — dimensions and corner radius from card-shape.svg.
    // SVG viewBox 1024×650; card path: L=19.97 R=984.55 T=13.82 B=637.79
    // Card: 964.58 × 623.97, corner radius: 42.20
    var SVG_W = 1024, SVG_H = 650;
    var CARD_SVG_L = 19.97, CARD_SVG_T = 13.82;
    var CARD_SVG_W = 964.58, CARD_SVG_H = 623.97;
    var SVG_CORNER_R = 42.20;

    var CARD_W = 3.15;
    var CARD_H = CARD_W * (CARD_SVG_H / CARD_SVG_W);
    var CORNER_R = (SVG_CORNER_R / CARD_SVG_W) * CARD_W;
    var DEPTH = 0.06;
    var BEVEL_T = 0.025;
    var BEVEL_S = 0.025;
    var BEVEL_SEGS = 3;

    // UV crop — map texture to the card area within the PNG.
    // INSET shrinks the UV range by ~2% on each side so the texture
    // slightly overflows the geometry, clipping the white PNG edges.
    var UV_INSET = 0.005;
    var rawOffX = CARD_SVG_L / SVG_W;
    var rawOffY = (SVG_H - CARD_SVG_T - CARD_SVG_H) / SVG_H;
    var rawScX = CARD_SVG_W / SVG_W;
    var rawScY = CARD_SVG_H / SVG_H;
    var UV_OFF_X = rawOffX + rawScX * UV_INSET;
    var UV_OFF_Y = rawOffY + rawScY * UV_INSET;
    var UV_SC_X = rawScX * (1 - 2 * UV_INSET);
    var UV_SC_Y = rawScY * (1 - 2 * UV_INSET);

    // Interaction
    var LERP_FACTOR = 0.06;
    var MAX_TILT = (10 * Math.PI) / 180;

    // Theme colors — accent from shared.css
    var SIDE_DARK = 0xb8a9e8;   // --accent dark (lavender)
    var SIDE_LIGHT = 0xd4946a;  // --accent light (warm orange)

    // ── Renderer ──
    var w = wrap.clientWidth;
    var h = wrap.clientHeight;
    var dpr = isMobile ? 1 : Math.min(window.devicePixelRatio, 2);

    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h);

    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);
    camera.position.set(0, 0, 5.2);
    camera.lookAt(0, 0, 0);

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(2, 3, 5);
    scene.add(dirLight);
    var fillLight = new THREE.DirectionalLight(0xffffff, 0.2);
    fillLight.position.set(-3, 1, 4);
    scene.add(fillLight);

    // ── Rounded Rectangle Shape ──
    function createRoundedRect(rw, rh, r) {
      var shape = new THREE.Shape();
      var x = -rw / 2, y = -rh / 2;
      shape.moveTo(x + r, y);
      shape.lineTo(x + rw - r, y);
      shape.quadraticCurveTo(x + rw, y, x + rw, y + r);
      shape.lineTo(x + rw, y + rh - r);
      shape.quadraticCurveTo(x + rw, y + rh, x + rw - r, y + rh);
      shape.lineTo(x + r, y + rh);
      shape.quadraticCurveTo(x, y + rh, x, y + rh - r);
      shape.lineTo(x, y + r);
      shape.quadraticCurveTo(x, y, x + r, y);
      return shape;
    }

    // ── Geometry ──
    var shape = createRoundedRect(CARD_W, CARD_H, CORNER_R);
    var geometry = new THREE.ExtrudeGeometry(shape, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL_T,
      bevelSize: BEVEL_S,
      bevelSegments: BEVEL_SEGS,
    });

    // Remap UVs to the card area within the PNG
    var uvAttr = geometry.attributes.uv;
    var posAttr = geometry.attributes.position;
    for (var i = 0; i < uvAttr.count; i++) {
      var u = (posAttr.getX(i) + CARD_W / 2) / CARD_W;
      var v = (posAttr.getY(i) + CARD_H / 2) / CARD_H;
      uvAttr.setXY(i, UV_OFF_X + u * UV_SC_X, UV_OFF_Y + v * UV_SC_Y);
    }
    uvAttr.needsUpdate = true;

    geometry.computeBoundingBox();
    var bb = geometry.boundingBox;
    geometry.translate(0, 0, -(bb.min.z + bb.max.z) / 2);

    // ── Texture + Materials ──
    // Preload both themes; start animation once the active one is ready.
    var TEX_LIGHT = "/empathogenic-business-card-msession-front-v1-2048px.png";
    var TEX_DARK = "/empathogenic-business-card-msession-front-DARK-v1.png";
    var textureLoader = new THREE.TextureLoader();
    var texLight = textureLoader.load(TEX_LIGHT, function () {
      if (isLight) requestAnimationFrame(animate);
    });
    var texDark = textureLoader.load(TEX_DARK, function () {
      if (!isLight) requestAnimationFrame(animate);
    });

    var capMaterial = new THREE.MeshBasicMaterial({
      map: isLight ? texLight : texDark,
    });

    var sideMaterial = new THREE.MeshLambertMaterial({
      color: isLight ? SIDE_LIGHT : SIDE_DARK,
    });

    // ── Mesh ──
    var mesh = new THREE.Mesh(geometry, [capMaterial, sideMaterial]);
    var cardGroup = new THREE.Group();
    cardGroup.add(mesh);
    scene.add(cardGroup);

    // ── Mouse / Touch ──
    var mouseT = { x: 0, y: 0 };
    var mouseC = { x: 0, y: 0 };
    var mouseOver = false;
    var wobbleStrength = 1;

    canvas.style.cursor = "pointer";
    canvas.addEventListener("click", function () {
      var html = document.documentElement;
      html.classList.add("theme-transitioning");
      html.classList.toggle("light");
      localStorage.setItem(
        "m-session-theme",
        html.classList.contains("light") ? "light" : "dark"
      );
      setTimeout(function () {
        html.classList.remove("theme-transitioning");
      }, 550);
    });

    document.addEventListener("mousemove", function (e) {
      var rect = wrap.getBoundingClientRect();
      mouseT.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseT.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      mouseOver = true;
    });
    document.addEventListener("touchmove", function (e) {
      if (e.touches.length !== 1) return;
      var touch = e.touches[0];
      var rect = wrap.getBoundingClientRect();
      mouseT.x = ((touch.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseT.y = -((touch.clientY - rect.top) / rect.height - 0.5) * 2;
      mouseOver = true;
    }, { passive: true });

    // ── Animation Loop ──
    function animate() {
      if (!canvas.isConnected) {
        renderer.dispose();
        geometry.dispose();
        capMaterial.dispose();
        sideMaterial.dispose();
        return;
      }
      requestAnimationFrame(animate);

      mouseC.x += (mouseT.x - mouseC.x) * LERP_FACTOR;
      mouseC.y += (mouseT.y - mouseC.y) * LERP_FACTOR;

      var wobbleTarget = mouseOver ? 0 : 1;
      wobbleStrength += (wobbleTarget - wobbleStrength) * 0.03;

      var t = performance.now() * 0.001;
      cardGroup.rotation.y = mouseC.x * MAX_TILT + Math.cos(t * 0.35) * 0.006 * wobbleStrength;
      cardGroup.rotation.x = mouseC.y * MAX_TILT + Math.sin(t * 0.5) * 0.008 * wobbleStrength;

      renderer.render(scene, camera);
    }

    // ── Resize ──
    window.addEventListener("resize", function () {
      if (!canvas.isConnected) return;
      isMobile = window.innerWidth <= 768;
      renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
      camera.aspect = wrap.clientWidth / wrap.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    });

    // ── Theme Observer ──
    new MutationObserver(function () {
      if (!canvas.isConnected) return;
      isLight = document.documentElement.classList.contains("light");
      capMaterial.map = isLight ? texLight : texDark;
      capMaterial.needsUpdate = true;
      sideMaterial.color.setHex(isLight ? SIDE_LIGHT : SIDE_DARK);
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  if (window.THREE) {
    init();
  } else {
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    s.onload = init;
    document.head.appendChild(s);
  }
})();
