import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { registerParallaxTarget } from '../../systems/animation/parallax.js';
import { registerCloud } from '../../systems/animation/clouds.js';

/**
 * Deterministic seeded PRNG.
 * ponytail: simple LCG is enough for visual seed stability.
 */
function makeSeededRng(seed = 0) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Career milestones, reimagined as cottages scattered across the hills.
const CAREER_COTTAGES = [
  { name: 'GeoPagos', wall: 0xf5ead2, roof: 0xc96f4a },
  { name: 'Rappi', wall: 0xf3e6c8, roof: 0xb85c40 },
  { name: 'ALPH0X', wall: 0xf7eeda, roof: 0xd77a61 },
  { name: 'FullStack', wall: 0xefe4cc, roof: 0xa85238 },
  { name: 'Leadership', wall: 0xf5ead2, roof: 0xc96f4a },
];

function buildLayer(
  rng: () => number,
  factor: number,
  build: (group: THREE.Group, rng: () => number) => void
): THREE.Group {
  const layer = new THREE.Group();
  layer.userData._parallax = true;
  layer.userData._parallaxFactor = factor;
  registerParallaxTarget(layer);
  build(layer, rng);
  return layer;
}

// Landscape materials ignore the room's fog: distances here are tens of
// meters, so scene fog would wash every hill into a milky silhouette.
function basic(color: number, fog = false): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color, fog });
}

/** Soft radial sprite used for the sun glow. */
function sunTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  if (ctx) {
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const d = Math.hypot(x - 31.5, y - 31.5) / 32;
        const a = Math.max(0, 1 - d);
        ctx.fillStyle = `rgba(255,236,190,${(a * a * 0.9).toFixed(3)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.name = 'sun-glow';
  return tex;
}

/** Warm gradient sky: golden horizon rising into a soft blue zenith. */
function buildSky(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(240, 110);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uHorizon: { value: new THREE.Color(0xffe4b8) },
      uMid: { value: new THREE.Color(0xbfe0e8) },
      uZenith: { value: new THREE.Color(0x6fb4dc) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uHorizon;
      uniform vec3 uMid;
      uniform vec3 uZenith;
      varying vec2 vUv;
      void main() {
        float t = clamp(vUv.y, 0.0, 1.0);
        vec3 col = t < 0.42
          ? mix(uHorizon, uMid, smoothstep(0.0, 0.42, t))
          : mix(uMid, uZenith, smoothstep(0.42, 1.0, t));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    fog: false,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.position.set(0, 26, -58);
  sky.renderOrder = -10;
  return sky;
}

// Broad painted value changes give the unlit backdrop volume without extra lights.
function paintLandscape(geometry: THREE.BufferGeometry, base: number, height: number, relativeToBase = false): void {
  const positions = geometry.getAttribute('position');
  const colors: number[] = [];
  const shade = new THREE.Color(base).multiplyScalar(0.72);
  const light = new THREE.Color(base).lerp(new THREE.Color(0xe8e7b3), 0.24);
  const color = new THREE.Color();
  const baseColor = new THREE.Color(base);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const wash = Math.sin(x * 2.3 + z * 1.6) * 0.025;
    const t = THREE.MathUtils.clamp(0.42 + y / height * 0.45 + wash, 0, 1);
    color.copy(shade).lerp(light, t);
    colors.push(
      color.r / (relativeToBase ? baseColor.r : 1),
      color.g / (relativeToBase ? baseColor.g : 1),
      color.b / (relativeToBase ? baseColor.b : 1));
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}

function paintedMesh(geometry: THREE.BufferGeometry, color = 0xffffff): THREE.Mesh {
  return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color, vertexColors: true, fog: false }));
}

function buildCloud(rng: () => number, x: number, y: number, z: number, scale: number): THREE.Group {
  const cloud = new THREE.Group();
  const puffs = 3 + Math.floor(rng() * 3);
  const pieces: THREE.BufferGeometry[] = [];
  for (let i = 0; i < puffs; i++) {
    const r = (0.9 + rng() * 1.1) * scale;
    const geometry = new THREE.SphereGeometry(r, 16, 10);
    geometry.scale(1, 0.62, 1);
    paintLandscape(geometry, 0xfffbef, r);
    geometry.translate((i - puffs / 2) * r * 1.15 + (rng() - 0.5) * 0.5,
      (rng() - 0.5) * 0.4 * scale, (rng() - 0.5) * 0.6);
    pieces.push(geometry);
  }
  cloud.add(paintedMesh(mergeGeometries(pieces)));
  pieces.forEach((geometry) => geometry.dispose());
  cloud.position.set(x, y, z);
  cloud.userData._driftSpeed = 0.08 + rng() * 0.12;
  registerCloud(cloud);
  return cloud;
}

function buildHill(x: number, z: number, w: number, h: number, color: number): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(1, 48, 24);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const px = positions.getX(i), py = positions.getY(i), pz = positions.getZ(i);
    // Low-frequency ridges break the perfect dome while keeping the meadow continuous.
    const ridge = 1 + 0.12 * Math.sin(px * 5 + x * 0.1) + 0.07 * Math.sin(pz * 7 + px * 3);
    positions.setXYZ(i, px, py * ridge, pz);
  }
  geometry.computeVertexNormals();
  paintLandscape(geometry, color, 1, true);
  const hill = paintedMesh(geometry, color);
  hill.scale.set(w, h, w * 0.5);
  hill.position.set(x, -2.2, z);
  return hill;
}

function buildTree(rng: () => number, x: number, y: number, z: number, s: number): THREE.Group {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * s, 0.11 * s, 1.2 * s, 8), basic(0x68533e));
  trunk.position.y = 0.6 * s;
  trunk.rotation.z = (rng() - 0.5) * 0.14;
  tree.add(trunk);
  const pieces: THREE.BufferGeometry[] = [];
  // A spreading, asymmetric crown with broad overlapping boughs.
  for (let i = 0; i < 5; i++) {
    const r = (0.45 + rng() * 0.3) * s;
    const geometry = new THREE.SphereGeometry(r, 16, 12);
    geometry.scale(1.12, 0.78 + rng() * 0.25, 1);
    paintLandscape(geometry, i % 2 ? 0x63875b : 0x476d50, r);
    const a = i * 2.39996;
    geometry.translate(Math.cos(a) * 0.4 * s, (1.0 + i * 0.18) * s, Math.sin(a) * 0.3 * s);
    pieces.push(geometry);
  }
  tree.add(paintedMesh(mergeGeometries(pieces)));
  pieces.forEach((geometry) => geometry.dispose());
  tree.position.set(x, y, z);
  return tree;
}

function buildCottage(wall: number, roof: number): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1.3), basic(wall));
  body.position.y = 0.55;
  g.add(body);
  // Terracotta roof above cream plaster cottages.
  const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.85, 4), basic(roof));
  roofMesh.rotation.y = Math.PI / 4;
  roofMesh.position.y = 1.1 + 0.42;
  g.add(roofMesh);
  // Chimney with a warm lit window below it.
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.22), basic(0x8a8071));
  chimney.position.set(0.45, 1.55, 0.2);
  g.add(chimney);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.04), basic(0xffd9a0));
  win.position.set(-0.3, 0.55, 0.67);
  win.userData._emissiveBase = 0xffd9a0;
  g.add(win);
  const win2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.04), basic(0xfff2d0));
  win2.position.set(0.38, 0.55, 0.67);
  g.add(win2);
  return g;
}

export function buildCityscape(cfg: { position: number[]; seed?: number }): THREE.Group {
  const [cx, , cz] = cfg.position as [number, number, number];
  const rng = makeSeededRng(cfg.seed ?? 0);
  const cityGroup = new THREE.Group();
  cityGroup.position.set(cx, 0, cz - 10);
  // Mark container so existing shallow parallax tests still find it; factor 0 keeps it static.
  cityGroup.userData._parallax = true;
  cityGroup.userData._parallaxFactor = 0;
  registerParallaxTarget(cityGroup);

  cityGroup.add(buildSky());

  // Sun — warm disc with a soft halo, high over the hills.
  const sun = new THREE.Mesh(new THREE.CircleGeometry(2.2, 24), basic(0xfff3cf, false));
  sun.position.set(-14, 24, -57);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: sunTexture(), transparent: true, depthWrite: false, fog: false,
  }));
  halo.scale.setScalar(16);
  halo.position.copy(sun.position);
  cityGroup.add(sun, halo);

  // Background: hazy distant ridges + slow clouds.
  const background = buildLayer(rng, 0.015, (group) => {
    group.add(buildHill(-22, -40, 34, 7.5, 0xa9c6bc));
    group.add(buildHill(14, -43, 40, 9, 0x9fbfc4));
    group.add(buildHill(38, -38, 26, 6, 0xa9c6bc));
    for (let i = 0; i < 4; i++) {
      group.add(buildCloud(rng, (rng() - 0.5) * 70, 12 + rng() * 10, -34 - rng() * 14, 1.4 + rng() * 1.2));
    }
  });

  // Midground: green rolling hills with career cottages and tree clusters.
  const midground = buildLayer(rng, 0.03, (group) => {
    group.add(buildHill(-19, -26, 26, 5.2, 0x709878));
    group.add(buildHill(15, -24, 30, 5.8, 0x80a18b));
    group.add(buildHill(34, -22, 20, 5.5, 0x7fb08a));

    for (let i = 0; i < CAREER_COTTAGES.length; i++) {
      const c = CAREER_COTTAGES[i];
      const cottage = buildCottage(c.wall, c.roof);
      const bx = -20 + i * 10 + (rng() - 0.5) * 3;
      cottage.position.set(bx, 2.2 + rng() * 0.65, -21 - rng() * 4);
      cottage.rotation.y = (rng() - 0.5) * 0.6;
      cottage.scale.setScalar(0.9 + rng() * 0.4);
      group.add(cottage);

      const trees = 2 + Math.floor(rng() * 3);
      for (let t = 0; t < trees; t++) {
        group.add(buildTree(rng, bx + (rng() - 0.5) * 6, 0.9 + rng(), -20 - rng() * 5, 0.9 + rng() * 0.7));
      }
    }
  });

  // Foreground: the nearest meadow ridge + faster, lower clouds.
  const foreground = buildLayer(rng, 0.08, (group) => {
    group.add(buildHill(-17, -13, 22, 2.7, 0x4e805f));
    group.add(buildHill(24, -12, 20, 2.4, 0x437355));
    for (let i = 0; i < 3; i++) {
      group.add(buildCloud(rng, (rng() - 0.5) * 50, 6 + rng() * 6, -10 - rng() * 8, 0.9 + rng() * 0.8));
    }
    // low drifters crossing the window sight-line (local y ≈ window band)
    for (let i = 0; i < 2; i++) {
      group.add(buildCloud(rng, (rng() - 0.5) * 36, 3.4 + rng() * 1.8, -12 - rng() * 6, 0.55 + rng() * 0.4));
    }
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1;
      group.add(buildTree(rng, side * (9 + rng() * 13), 0.2 + rng() * 0.5, -11 - rng() * 4, 1.1 + rng() * 0.8));
    }
  });

  cityGroup.add(background, midground, foreground);
  return cityGroup;
}
