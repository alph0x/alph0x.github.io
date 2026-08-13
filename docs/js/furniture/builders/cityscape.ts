import * as THREE from 'three';
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

function buildCloud(rng: () => number, x: number, y: number, z: number, scale: number): THREE.Group {
  const cloud = new THREE.Group();
  const puffs = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < puffs; i++) {
    const r = (0.9 + rng() * 1.1) * scale;
    const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), basic(0xfffbef));
    puff.position.set((i - puffs / 2) * r * 1.15 + (rng() - 0.5) * 0.5, (rng() - 0.5) * 0.4 * scale, (rng() - 0.5) * 0.6);
    puff.scale.y = 0.62;
    cloud.add(puff);
  }
  cloud.position.set(x, y, z);
  cloud.userData._driftSpeed = 0.08 + rng() * 0.12;
  registerCloud(cloud);
  return cloud;
}

function buildHill(x: number, z: number, w: number, h: number, color: number): THREE.Mesh {
  const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), basic(color));
  hill.scale.set(w, h, w * 0.5);
  hill.position.set(x, -2.2, z);
  return hill;
}

function buildTree(rng: () => number, x: number, y: number, z: number, s: number): THREE.Group {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * s, 0.09 * s, 0.7 * s, 5), basic(0x6b5138));
  trunk.position.y = 0.35 * s;
  tree.add(trunk);
  const blobs = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < blobs; i++) {
    const r = (0.5 + rng() * 0.35) * s;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), basic(i === 0 ? 0x4e7a52 : 0x5d8a58));
    leaf.position.set((rng() - 0.5) * 0.5 * s, (0.8 + i * 0.45) * s, (rng() - 0.5) * 0.3 * s);
    tree.add(leaf);
  }
  tree.position.set(x, y, z);
  return tree;
}

function buildCottage(wall: number, roof: number): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1.3), basic(wall));
  body.position.y = 0.55;
  g.add(body);
  // Four-sided pyramid roof, Ghibli terracotta.
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
    group.add(buildHill(-16, -26, 26, 6.5, 0x7fb08a));
    group.add(buildHill(12, -24, 30, 7, 0x86b48e));
    group.add(buildHill(34, -22, 20, 5.5, 0x7fb08a));

    for (let i = 0; i < CAREER_COTTAGES.length; i++) {
      const c = CAREER_COTTAGES[i];
      const cottage = buildCottage(c.wall, c.roof);
      const bx = -20 + i * 10 + (rng() - 0.5) * 3;
      cottage.position.set(bx, 1.4 + rng() * 1.2, -21 - rng() * 4);
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
    group.add(buildHill(-8, -13, 24, 4.5, 0x5d9a6e));
    group.add(buildHill(18, -12, 20, 4, 0x559264));
    for (let i = 0; i < 3; i++) {
      group.add(buildCloud(rng, (rng() - 0.5) * 50, 6 + rng() * 6, -10 - rng() * 8, 0.9 + rng() * 0.8));
    }
    // low drifters crossing the window sight-line (local y ≈ window band)
    for (let i = 0; i < 2; i++) {
      group.add(buildCloud(rng, (rng() - 0.5) * 36, 3.4 + rng() * 1.8, -12 - rng() * 6, 0.55 + rng() * 0.4));
    }
    for (let i = 0; i < 6; i++) {
      group.add(buildTree(rng, (rng() - 0.5) * 40, 1.1 + rng() * 0.8, -11 - rng() * 4, 1.1 + rng() * 0.8));
    }
  });

  cityGroup.add(background, midground, foreground);
  return cityGroup;
}
