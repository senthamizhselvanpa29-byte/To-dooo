// ============================================================
// 3D ANDROMEDA GALAXY BACKGROUND (made with Three.js)
// Based on your original prototype/login/galaxy.js
//
// Changes from the original:
// - Phones and small screens draw about 1/3 of the stars (faster, saves battery)
// - Fixed the small "box" glitch in the middle: centre stars now spread in a
//   round glow (they used to pile up into two bright rectangles)
// - The small side galaxy is a round cloud (it used to look like a line)
// - Bright stars stay away from the camera, and their rays fade out softly
// - Stops moving when the user's device asks for "reduce motion"
// - Cleans itself up when the page changes (no memory leaks)
//
// To change the look, edit the numbers in SETTINGS below.
// ============================================================

import * as THREE from 'three';

const SETTINGS = {
  diskStars: 95000, // stars in the spiral disk
  coreStars: 22000, // stars in the bright centre
  companionStars: 3500, // stars in the small side galaxy
  backgroundStars: 4500, // tiny far-away stars
  brightStars: 65, // big sparkling stars with light rays
  phoneStarFactor: 0.3, // phones draw 30% of the stars

  majorRadius: 7.8, // galaxy size
  minorRatio: 0.32, // how flat the galaxy looks (tilted view)
  tiltAngle: -0.42, // diagonal tilt like telescope photos
  spinSpeed: 0.015, // how fast the galaxy turns

  colors: {
    white: '#ffffff',
    violet: '#e0e7ff',
    cyan: '#38bdf8',
    blue: '#2563eb',
    deepBlue: '#1e3a8a',
    emerald: '#00e676',
    companion: '#93c5fd',
  },
};

export function startGalaxy(canvas) {
  const isPhone =
    window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scale = isPhone ? SETTINGS.phoneStarFactor : 1;
  const count = (n) => Math.round(n * scale);

  // ----- 1. Scene, camera and renderer -----
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 2.2, 6.8);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isPhone,
    alpha: true,
    powerPreference: 'high-performance',
  });
  const setSize = () => {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isPhone ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  setSize();

  // ----- 2. Star pictures (drawn once, reused by all stars) -----
  const softStar = makeSoftStarTexture();
  const sparkleStar = makeSparkleStarTexture();

  // Everything that belongs to the galaxy (moves together)
  const galaxy = new THREE.Group();
  scene.add(galaxy);

  const tiltCos = Math.cos(SETTINGS.tiltAngle);
  const tiltSin = Math.sin(SETTINGS.tiltAngle);
  const c = Object.fromEntries(
    Object.entries(SETTINGS.colors).map(([name, hex]) => [name, new THREE.Color(hex)])
  );

  // ----- 3. Spiral disk -----
  {
    const n = count(SETTINGS.diskStars);
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);

    for (let i = 0; i < n; i++) {
      const r = Math.pow(Math.random(), 2.2) * SETTINGS.majorRadius + 0.2;
      const armOffset = (i % 2) * Math.PI; // 2 spiral arms
      // Near the centre the stars spread all the way round. (If they all
      // follow the 2 arms there, they pile up into two bright boxes.)
      const spread = 0.45 + Math.max(0, 1.5 - r) * 4;
      const theta = armOffset + r * 1.8 + (Math.random() - 0.5) * spread;

      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r * SETTINGS.minorRatio;
      const thickness = (1 - Math.min(r / SETTINGS.majorRadius, 1)) * 0.4 + 0.08;
      // Most stars near the middle of the disk, fewer at the top and bottom
      const y = ((Math.random() + Math.random() + Math.random()) / 3 - 0.5) * thickness;

      positions[i * 3] = x * tiltCos - z * tiltSin;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = x * tiltSin + z * tiltCos;

      // Colour: white centre → cyan → blue → deep blue edge
      const norm = r / SETTINGS.majorRadius;
      let color;
      if (norm < 0.18) {
        color = c.white.clone().lerp(c.cyan, norm / 0.18);
      } else if (norm < 0.6) {
        color = c.cyan.clone().lerp(c.blue, (norm - 0.18) / 0.42);
        if (i % 5 === 0) color.lerp(c.emerald, 0.25); // VdoU green touch
      } else {
        color = c.blue.clone().lerp(c.deepBlue, (norm - 0.6) / 0.4);
      }
      colors[i * 3] = color.r + (Math.random() - 0.5) * 0.05;
      colors[i * 3 + 1] = color.g + (Math.random() - 0.5) * 0.05;
      colors[i * 3 + 2] = color.b + (Math.random() - 0.5) * 0.05;
    }

    galaxy.add(makePoints(positions, colors, { size: 0.016, map: softStar, opacity: 0.95 }));
  }

  // ----- 4. Bright centre (core) -----
  {
    const n = count(SETTINGS.coreStars);
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);

    for (let i = 0; i < n; i++) {
      const r = Math.pow(Math.random(), 3.5) * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      const x = Math.cos(theta) * Math.cos(phi) * r * 1.6;
      const y = Math.sin(phi) * r * 0.7;
      const z = Math.sin(theta) * Math.cos(phi) * r * 0.5;

      positions[i * 3] = x * tiltCos - z * tiltSin;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = x * tiltSin + z * tiltCos;

      const norm = r / 1.5;
      const color = c.white.clone().lerp(c.violet, norm * 0.6).lerp(c.cyan, norm);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    galaxy.add(makePoints(positions, colors, { size: 0.026, map: softStar, opacity: 0.98 }));
  }

  // ----- 5. Small companion galaxy (like M110 next to Andromeda) -----
  {
    const n = count(SETTINGS.companionStars);
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    const center = new THREE.Vector3(1.6, -1.8, -0.6);

    for (let i = 0; i < n; i++) {
      const r = Math.pow(Math.random(), 2.5) * 0.85;
      const angle = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      // A soft oval cloud in every direction. (Spreading only up/down made
      // a bright vertical line in the middle.)
      positions[i * 3] = center.x + Math.cos(angle) * Math.cos(phi) * r;
      positions[i * 3 + 1] = center.y + Math.sin(phi) * r * 0.6;
      positions[i * 3 + 2] = center.z + Math.sin(angle) * Math.cos(phi) * r * 0.5;

      const color = c.white.clone().lerp(c.companion, r / 0.85);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    galaxy.add(makePoints(positions, colors, { size: 0.02, map: softStar, opacity: 0.85 }));
  }

  // ----- 6. Far-away background stars -----
  {
    const n = count(SETTINGS.backgroundStars);
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);

    for (let i = 0; i < n; i++) {
      const r = 25 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      positions[i * 3] = Math.cos(theta) * Math.cos(phi) * r;
      positions[i * 3 + 1] = Math.sin(phi) * r;
      positions[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * r;

      const shade = 0.55 + Math.random() * 0.45;
      colors[i * 3] = shade;
      colors[i * 3 + 1] = shade;
      colors[i * 3 + 2] = 1;
    }

    scene.add(
      makePoints(positions, colors, { size: 0.022, map: softStar, opacity: 0.75, additive: false })
    );
  }

  // ----- 7. Big sparkling stars -----
  // Kept behind the camera's near zone (z between -7 and -1) so none of them
  // fly too close and show up as a giant box. (This was the glitch.)
  const sparkles = (() => {
    const n = SETTINGS.brightStars;
    const positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = -1 - Math.random() * 6;
    }
    const points = makePoints(positions, null, { size: 0.18, map: sparkleStar, opacity: 0.9 });
    scene.add(points);
    return points;
  })();

  // ----- 8. Mouse / finger movement makes the galaxy tilt -----
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const onMouseMove = (e) => {
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  const onTouchMove = (e) => {
    if (e.touches.length > 0) {
      mouse.targetX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
    }
  };
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    setSize();
    if (reduceMotion) drawFrame(0);
  };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('resize', onResize);

  // ----- 9. Drawing each frame -----
  function drawFrame(time) {
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    galaxy.rotation.x = 0.25 + mouse.y * 0.35;
    galaxy.rotation.y = time * SETTINGS.spinSpeed + mouse.x * 0.4;
    galaxy.rotation.z = -mouse.x * 0.25;
    galaxy.position.x = mouse.x * 0.45;
    galaxy.position.y = -mouse.y * 0.35;

    sparkles.position.x = mouse.x * 0.8;
    sparkles.position.y = -mouse.y * 0.6;

    camera.position.x = mouse.x * 0.9;
    camera.position.y = 2.2 - mouse.y * 0.6;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  let frameId = 0;
  const start = performance.now();
  const loop = () => {
    frameId = requestAnimationFrame(loop);
    drawFrame((performance.now() - start) / 1000);
  };

  if (reduceMotion) {
    drawFrame(0); // one still picture, no movement
  } else {
    loop();
  }

  // ----- 10. Clean up (called when leaving the page) -----
  return function stopGalaxy() {
    cancelAnimationFrame(frameId);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('resize', onResize);
    scene.traverse((object) => {
      object.geometry?.dispose();
      object.material?.dispose();
    });
    softStar.dispose();
    sparkleStar.dispose();
    renderer.dispose();
  };
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

// Builds a group of star points.
function makePoints(positions, colors, { size, map, opacity, additive = true }) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  if (colors) geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size,
    map,
    opacity,
    transparent: true,
    sizeAttenuation: true,
    depthWrite: false,
    vertexColors: Boolean(colors),
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  return new THREE.Points(geometry, material);
}

// A soft round glowing dot.
function makeSoftStarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.15, 'rgba(235, 245, 255, 0.95)');
  grad.addColorStop(0.4, 'rgba(56, 189, 248, 0.45)');
  grad.addColorStop(0.7, 'rgba(37, 99, 235, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

// A bright star with 4 light rays. The rays fade to nothing before the
// picture's edge, so no hard square edges can appear.
function makeSparkleStarTexture() {
  const size = 128;
  const mid = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const glow = ctx.createRadialGradient(mid, mid, 0, mid, mid, 40);
  glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
  glow.addColorStop(0.2, 'rgba(186, 230, 253, 0.8)');
  glow.addColorStop(0.6, 'rgba(37, 99, 235, 0.2)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  const ray = (x1, y1, x2, y2) => {
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, 'rgba(224, 242, 254, 0)');
    grad.addColorStop(0.5, 'rgba(224, 242, 254, 0.7)');
    grad.addColorStop(1, 'rgba(224, 242, 254, 0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  ray(mid, 12, mid, size - 12);
  ray(12, mid, size - 12, mid);

  return new THREE.CanvasTexture(canvas);
}
