/**
 * ============================================================================
 * VdoU Professional 3D Galaxy Simulation (Three.js)
 * Modeled precisely after the Andromeda Galaxy (M31) reference:
 * - High-inclination lenticular tilted disk (~75° tilt)
 * - Brilliant incandescent nucleus (supermassive galactic bulge)
 * - Concentric blue/indigo cosmic dust lanes with dark absorption gaps
 * - Satellite dwarf companion galaxy (M110)
 * - Telescope-style pin-point starfield with diffraction glints
 * - Interactive 3D mouse parallax and smooth orbital dynamics
 * - High-contrast preservation in both Dark and Light modes
 * ============================================================================
 */

class AndromedaGalaxy {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.isLightMode = document.documentElement.getAttribute('data-theme') === 'light';

    // Andromeda Galaxy Parameters
    this.params = {
      count: 95000,           // High density for smooth continuous stellar disk
      majorRadius: 7.8,       // Major axis
      minorRatio: 0.32,       // Elliptical flattening (tilted view ~75°)
      tiltAngle: -0.42,       // Diagonal tilt like astronomical photos
      coreCount: 22000,       // Densely packed brilliant nuclear bulge
      // Andromeda spectral colors
      coreWhite: '#ffffff',
      coreViolet: '#e0e7ff',
      coreLavender: '#c7d2fe',
      armCyan: '#38bdf8',
      armBlue: '#2563eb',
      armDeepBlue: '#1e3a8a',
      armEmerald: '#00e676',
      companionColor: '#93c5fd'
    };

    // Cursor tracking
    this.mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0
    };

    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );
    this.camera.position.set(0, 2.2, 6.8);
    this.camera.lookAt(0, 0, 0);

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 3. Textures
    this.starTexture = this.createSoftGlowTexture();
    this.brightStarTexture = this.createSpikeStarTexture();

    // 4. Build Andromeda Galaxy Architecture
    this.buildAndromedaDisk();
    this.buildNuclearBulge();
    this.buildCompanionGalaxy();
    this.buildDeepStarfield();

    // 5. Events
    this.bindEvents();

    // 6. Animation Loop
    this.render = this.render.bind(this);
    requestAnimationFrame(this.render);
  }

  /**
   * Generates a soft astronomical star sprite with smooth falloff.
   */
  createSoftGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.15, 'rgba(235, 245, 255, 0.95)');
    grad.addColorStop(0.4, 'rgba(56, 189, 248, 0.45)');
    grad.addColorStop(0.7, 'rgba(37, 99, 235, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Generates a bright telescope star with 4-point cross diffraction spikes.
   */
  createSpikeStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Central glow
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 48);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(186, 230, 253, 0.8)');
    grad.addColorStop(0.6, 'rgba(37, 99, 235, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    // Cross spikes
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(64, 4);
    ctx.lineTo(64, 124);
    ctx.moveTo(4, 64);
    ctx.lineTo(124, 64);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Builds the elliptical inclined Andromeda disk with dust lanes.
   */
  buildAndromedaDisk() {
    const count = this.params.count;
    this.diskGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Stored attributes for Keplerian differential rotation
    this.radii = new Float32Array(count);
    this.angles = new Float32Array(count);
    this.speeds = new Float32Array(count);
    this.yOffsets = new Float32Array(count);

    const colWhite = new THREE.Color(this.params.coreWhite);
    const colCyan = new THREE.Color(this.params.armCyan);
    const colBlue = new THREE.Color(this.params.armBlue);
    const colDeep = new THREE.Color(this.params.armDeepBlue);
    const colEmerald = new THREE.Color(this.params.armEmerald);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Radial power distribution
      const r = Math.pow(Math.random(), 2.2) * this.params.majorRadius + 0.2;
      this.radii[i] = r;

      // Concentric elliptical spiral arm math
      const arms = 2;
      const armOffset = ((i % arms) / arms) * Math.PI * 2;
      const spiralSpin = r * 1.8;
      const theta = armOffset + spiralSpin + (Math.random() - 0.5) * 0.45;
      this.angles[i] = theta;

      // Differential orbital speed
      this.speeds[i] = 0.18 / Math.sqrt(r + 0.4);

      // Elliptical projection matching Andromeda's 75° inclined line-of-sight
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r * this.params.minorRatio;

      // Volumetric dust thickness (thicker in center, thin at rim)
      const thickness = (1.0 - Math.min(r / this.params.majorRadius, 1.0)) * 0.4 + 0.08;
      const y = (Math.random() - 0.5) * thickness;
      this.yOffsets[i] = y;

      // Rotate by Andromeda position angle (diagonal tilt)
      const cosA = Math.cos(this.params.tiltAngle);
      const sinA = Math.sin(this.params.tiltAngle);
      positions[i3] = x * cosA - z * sinA;
      positions[i3 + 1] = y;
      positions[i3 + 2] = x * sinA + z * cosA;

      // Color gradation matching Andromeda's astronomical hues
      const norm = r / this.params.majorRadius;
      let c;

      if (norm < 0.18) {
        // Core transition from pure white to soft cyan
        c = colWhite.clone().lerp(colCyan, norm / 0.18);
      } else if (norm < 0.6) {
        // Main disk: Royal blue with subtle emerald VdoU tint
        const t = (norm - 0.18) / 0.42;
        c = colCyan.clone().lerp(colBlue, t);
        if (i % 5 === 0) c.lerp(colEmerald, 0.25);
      } else {
        // Outer faint galactic halo
        const t = (norm - 0.6) / 0.4;
        c = colBlue.clone().lerp(colDeep, t);
      }

      // Micro starlight brightness noise
      c.r += (Math.random() - 0.5) * 0.05;
      c.g += (Math.random() - 0.5) * 0.05;
      c.b += (Math.random() - 0.5) * 0.05;

      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }

    this.diskGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.diskGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.diskMaterial = new THREE.PointsMaterial({
      size: 0.016,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      map: this.starTexture,
      transparent: true,
      opacity: 0.95
    });

    this.andromedaGroup = new THREE.Group();
    this.diskPoints = new THREE.Points(this.diskGeometry, this.diskMaterial);
    this.andromedaGroup.add(this.diskPoints);
    this.scene.add(this.andromedaGroup);
  }

  /**
   * Brilliant nuclear bulge (galactic core) with soft volumetric light.
   */
  buildNuclearBulge() {
    const count = this.params.coreCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cWhite = new THREE.Color('#ffffff');
    const cViolet = new THREE.Color('#e0e7ff');
    const cBlue = new THREE.Color('#38bdf8');

    for (let i = 0; i < count; i++) {
      // Extremely concentrated Gaussian spherical/elliptical core
      const u = Math.random();
      const r = Math.pow(u, 3.5) * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      const x = Math.cos(theta) * Math.cos(phi) * r * 1.6;
      const y = Math.sin(phi) * r * 0.7;
      const z = Math.sin(theta) * Math.cos(phi) * r * 0.5;

      // Apply diagonal tilt
      const cosA = Math.cos(this.params.tiltAngle);
      const sinA = Math.sin(this.params.tiltAngle);

      positions[i * 3] = x * cosA - z * sinA;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = x * sinA + z * cosA;

      const norm = r / 1.5;
      const color = cWhite.clone().lerp(cViolet, norm * 0.6).lerp(cBlue, norm);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.026,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      map: this.starTexture,
      transparent: true,
      opacity: 0.98
    });

    this.corePoints = new THREE.Points(geometry, material);
    this.andromedaGroup.add(this.corePoints);

    // Core point light for subtle ambient illumination
    this.coreLight = new THREE.PointLight('#e0e7ff', 3.0, 10);
    this.coreLight.position.set(0, 0, 0);
    this.andromedaGroup.add(this.coreLight);
  }

  /**
   * Satellite Companion Dwarf Galaxy (M110), visible in the Andromeda photo.
   */
  buildCompanionGalaxy() {
    const count = 3500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cWhite = new THREE.Color('#ffffff');
    const cBlue = new THREE.Color('#93c5fd');

    // Position offset matching M110 in user photo
    const center = new THREE.Vector3(1.6, -1.8, -0.6);

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const r = Math.pow(u, 2.5) * 0.85;
      const angle = Math.random() * Math.PI * 2;
      const ySpread = (Math.random() - 0.5) * 0.45;

      positions[i * 3] = center.x + Math.cos(angle) * r;
      positions[i * 3 + 1] = center.y + ySpread * (1 - r);
      positions[i * 3 + 2] = center.z + Math.sin(angle) * r * 0.5;

      const norm = r / 0.85;
      const c = cWhite.clone().lerp(cBlue, norm);

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.02,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      map: this.starTexture,
      transparent: true,
      opacity: 0.85
    });

    this.companionPoints = new THREE.Points(geometry, material);
    this.andromedaGroup.add(this.companionPoints);
  }

  /**
   * Deep cosmic starfield with pin-point stars and telescope diffraction glints.
   */
  buildDeepStarfield() {
    // 1. Tiny pinpoint background stars
    const bgCount = 4500;
    const bgGeometry = new THREE.BufferGeometry();
    const bgPos = new Float32Array(bgCount * 3);
    const bgCol = new Float32Array(bgCount * 3);

    for (let i = 0; i < bgCount; i++) {
      const r = 25 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      bgPos[i * 3] = Math.cos(theta) * Math.cos(phi) * r;
      bgPos[i * 3 + 1] = Math.sin(phi) * r;
      bgPos[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * r;

      const shade = 0.55 + Math.random() * 0.45;
      bgCol[i * 3] = shade;
      bgCol[i * 3 + 1] = shade;
      bgCol[i * 3 + 2] = 1.0;
    }

    bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    bgGeometry.setAttribute('color', new THREE.BufferAttribute(bgCol, 3));

    const bgMat = new THREE.PointsMaterial({
      size: 0.022,
      sizeAttenuation: true,
      vertexColors: true,
      map: this.starTexture,
      transparent: true,
      opacity: 0.75
    });

    this.bgField = new THREE.Points(bgGeometry, bgMat);
    this.scene.add(this.bgField);

    // 2. Bright foreground telescope stars with diffraction cross spikes
    const brightCount = 65;
    const brightGeometry = new THREE.BufferGeometry();
    const brightPos = new Float32Array(brightCount * 3);

    for (let i = 0; i < brightCount; i++) {
      brightPos[i * 3] = (Math.random() - 0.5) * 20;
      brightPos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      brightPos[i * 3 + 2] = (Math.random() - 0.5) * 8 + 1.0;
    }

    brightGeometry.setAttribute('position', new THREE.BufferAttribute(brightPos, 3));

    const brightMat = new THREE.PointsMaterial({
      size: 0.22,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: this.brightStarTexture,
      transparent: true,
      opacity: 0.95
    });

    this.brightStars = new THREE.Points(brightGeometry, brightMat);
    this.scene.add(this.brightStars);
  }

  setTheme(theme) {
    this.isLightMode = theme === 'light';
    // Galaxy preserves rich cosmic contrast in both modes so it never washes out!
    if (this.diskMaterial) {
      this.diskMaterial.opacity = this.isLightMode ? 0.9 : 0.95;
      this.diskMaterial.needsUpdate = true;
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // 3D Mouse Parallax
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Touch
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.targetX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
        this.mouse.targetY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
      }
    }, { passive: true });
  }

  render() {
    requestAnimationFrame(this.render);

    const time = this.clock.getElapsedTime();

    // Smooth inertia interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // 1. Gentle continuous cosmic rotation
    if (this.andromedaGroup) {
      // 3D Tilting and Gyroscope Banking with Cursor
      this.andromedaGroup.rotation.x = 0.25 + this.mouse.y * 0.35;
      this.andromedaGroup.rotation.y = time * 0.015 + this.mouse.x * 0.4;
      this.andromedaGroup.rotation.z = -this.mouse.x * 0.25;

      // Subtle positional sway
      this.andromedaGroup.position.x = this.mouse.x * 0.45;
      this.andromedaGroup.position.y = -this.mouse.y * 0.35;
    }

    // 2. Bright foreground stars parallax
    if (this.brightStars) {
      this.brightStars.position.x = this.mouse.x * 0.8;
      this.brightStars.position.y = -this.mouse.y * 0.6;
    }

    // 3. 3D Camera Orbit
    this.camera.position.x = this.mouse.x * 0.9;
    this.camera.position.y = 2.2 - this.mouse.y * 0.6;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.andromedaGalaxy = new AndromedaGalaxy('galaxy-canvas');
});
