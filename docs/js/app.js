/**
 * @fileoverview 3D FPS Apartment — Night City Portfolio
 *
 * ARCHITECTURAL DECISIONS (fundamented theoretically):
 *
 * 1. SINGLE RESPONSIBILITY PRINCIPLE (SRP):
 *    The file is organized into cohesive sections (Assets, Furniture, Level,
 *    Game, UI). Each section has one reason to change. For example, a change
 *    in sofa geometry only touches the Furniture section; a change in movement
 *    speed only touches the Game section.
 *
 * 2. OPEN/CLOSED PRINCIPLE (OCP):
 *    New furniture types are added by registering a builder function in
 *    `FurnitureRegistry`. The `RoomBuilder` iterates over a declarative layout
 *    array and dispatches to the registry. No existing builder code is modified.
 *
 * 3. DEPENDENCY INVERSION PRINCIPLE (DIP):
 *    The `Game` class receives its dependencies (renderer, scene, camera,
 *    controls) via its constructor rather than instantiating them or accessing
 *    globals. This makes the game logic testable and swappable.
 *
 * 4. CLEAN CODE — Small Functions:
 *    Furniture builders are composed of smaller pure-ish helpers (legs, cushions,
 *    frames) that live inside their own closures. Each function does one thing.
 */

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CFG, COLORS, ROOM_LAYOUT, resolveMove } from './core.js';

// ═══════════════════════════════════════════════════════════
// ASSETS — Textures & Materials
// ═══════════════════════════════════════════════════════════

function makeTexture(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  drawFn(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

const texWall = makeTexture(64, 64, (ctx, w, h) => {
  ctx.fillStyle = '#7a7065'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = `rgba(${115 + (Math.random() * 35) | 0},${105 + (Math.random() * 35) | 0},${95 + (Math.random() * 35) | 0},0.25)`;
    ctx.fillRect((Math.random() * w) | 0, (Math.random() * h) | 0, 2, 2);
  }
  ctx.fillStyle = '#9a8e80';
  for (let x = 8; x < w; x += 16) for (let y = 8; y < h; y += 16) ctx.fillRect(x - 1, y - 1, 2, 2);
  ctx.strokeStyle = 'rgba(30,25,20,0.08)';
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(0, (Math.random() * h) | 0); ctx.lineTo(w, (Math.random() * h) | 0); ctx.stroke(); }
});

const texFloor = makeTexture(64, 64, (ctx, w, h) => {
  ctx.fillStyle = '#3a3530'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 400; i++) {
    const v = (45 + Math.random() * 25) | 0;
    ctx.fillStyle = `rgba(${v},${v - 5},${v - 10},0.25)`;
    ctx.fillRect((Math.random() * w) | 0, (Math.random() * h) | 0, 1 + (Math.random() * 3) | 0, 1 + (Math.random() * 3) | 0);
  }
  ctx.strokeStyle = 'rgba(60,55,50,0.2)'; ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(0, (Math.random() * h) | 0); ctx.lineTo(w, (Math.random() * h) | 0); ctx.stroke();
  }
});

const texCeiling = makeTexture(64, 64, (ctx, w, h) => {
  ctx.fillStyle = '#2a2522'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(50,45,40,${Math.random() * 0.2})`; ctx.fillRect((Math.random() * w) | 0, (Math.random() * h) | 0, 2, 2); }
});

const texTerminal = makeTexture(64, 64, (ctx, w, h) => {
  ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#fcee0a'; ctx.lineWidth = 2; ctx.strokeRect(2, 2, w - 4, h - 4);
  ctx.strokeStyle = 'rgba(252,238,10,0.15)'; ctx.lineWidth = 1;
  for (let i = 8; i < h; i += 8) { ctx.beginPath(); ctx.moveTo(4, i); ctx.lineTo(w - 4, i); ctx.stroke(); }
  ctx.fillStyle = '#fcee0a';
  for (let i = 12; i < h - 10; i += 6) ctx.fillRect(8, i, (10 + Math.random() * 30) | 0, 2);
});

const texConcrete = makeTexture(64, 64, (ctx, w, h) => {
  ctx.fillStyle = '#15151a'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) { const v = (20 + Math.random() * 30) | 0; ctx.fillStyle = `rgba(${v},${v},${v + 5},0.4)`; ctx.fillRect((Math.random() * w) | 0, (Math.random() * h) | 0, 1 + (Math.random() * 2) | 0, 1 + (Math.random() * 2) | 0); }
});

const texWood = makeTexture(64, 64, (ctx, w, h) => {
  ctx.fillStyle = '#4a3333'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(0, (Math.random() * h) | 0); ctx.lineTo(w, (Math.random() * h) | 0); ctx.stroke(); }
  for (let i = 0; i < 20; i++) { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect((Math.random() * w) | 0, (Math.random() * h) | 0, 1 + (Math.random() * 4) | 0, 1 + (Math.random() * 4) | 0); }
});

// Standard material helper — roughness/metalness for PBR-like surfaces
function makeStd({ color, map, roughness = 0.8, metalness = 0.1, emissive = 0x000000, emissiveIntensity = 1 }) {
  const params = { roughness, metalness, emissive, emissiveIntensity };
  if (color !== undefined) params.color = color;
  if (map) params.map = map;
  return new THREE.MeshStandardMaterial(params);
}

const M = {
  wall: makeStd({ map: texWall, roughness: 0.95, metalness: 0.0 }),
  floor: makeStd({ map: texFloor, roughness: 0.85, metalness: 0.05 }),
  ceiling: makeStd({ map: texCeiling, roughness: 0.95, metalness: 0.0 }),
  terminal: new THREE.MeshBasicMaterial({ map: texTerminal }),
  terminalPink: new THREE.MeshBasicMaterial({ map: texTerminal, color: COLORS.magenta }),
  terminalCyan: new THREE.MeshBasicMaterial({ map: texTerminal, color: COLORS.cyan }),
  terminalGreen: new THREE.MeshBasicMaterial({ map: texTerminal, color: COLORS.green }),
  glowYellow: new THREE.MeshBasicMaterial({ color: COLORS.cyber }),
  glowPink: new THREE.MeshBasicMaterial({ color: COLORS.magenta }),
  glowCyan: new THREE.MeshBasicMaterial({ color: COLORS.cyan }),
  glowGreen: new THREE.MeshBasicMaterial({ color: COLORS.green }),
  concrete: makeStd({ map: texConcrete, roughness: 0.9, metalness: 0.1 }),
  wood: makeStd({ map: texWood, roughness: 0.6, metalness: 0.0 }),
};

// ═══════════════════════════════════════════════════════════
// FURNITURE REGISTRY (OCP-friendly)
// ═══════════════════════════════════════════════════════════

/**
 * Registry of furniture builders.
 * Decision: Map-based dispatch instead of switch/if-else chains.
 * Rationale (SOLID — OCP): Adding a new furniture type means registering
 * a new function here. The RoomBuilder does not need to change.
 */
const FurnitureRegistry = new Map();

function register(type, builder) {
  FurnitureRegistry.set(type, builder);
}

// ── Terminal ──────────────────────────────────────────────
function buildTerminal(cfg) {
  const group = new THREE.Group();
  group.position.set(...cfg.position);
  const screenMat = cfg.color === 'yellow' ? M.terminal : cfg.color === 'pink' ? M.terminalPink : cfg.color === 'cyan' ? M.terminalCyan : M.terminalGreen;
  group.add(new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 0.3), screenMat));
  const frameMat = new THREE.MeshBasicMaterial({ color: 0x3a3a55 });
  group.add(makeBox(frameMat, [2.8, 0.2, 0.4], [0, 1.6, 0]));
  group.add(makeBox(frameMat, [2.8, 0.2, 0.4], [0, -1.6, 0]));
  group.add(makeBox(frameMat, [0.2, 3.4, 0.4], [-1.35, 0, 0]));
  group.add(makeBox(frameMat, [0.2, 3.4, 0.4], [1.35, 0, 0]));
  const lightColor = cfg.color === 'yellow' ? COLORS.cyber : cfg.color === 'pink' ? COLORS.magenta : cfg.color === 'cyan' ? COLORS.cyan : COLORS.green;
  group.add(makeLight(lightColor, 2, 8, [0, 0, 1]));
  return { mesh: group, type: 'terminal', panelId: cfg.panelId, label: 'TERMINAL', room: 'APT' };
}
register('terminal', buildTerminal);

// ── Bed ───────────────────────────────────────────────────
function buildBed(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation;
  const base = makeStd({ color: 0x2a2a40, roughness: 0.7, metalness: 0.1 });
  const mattress = makeStd({ color: 0x3a3a55, roughness: 0.9, metalness: 0.0 });
  const pillow = makeStd({ color: 0x4a4a60, roughness: 0.95, metalness: 0.0 });
  const blanket = makeStd({ color: 0x222235, roughness: 0.85, metalness: 0.0 });
  for (const lx of [-0.9, 0.9]) for (const lz of [-0.6, 0.6]) g.add(makeBox(base, [0.06, 0.2, 0.06], [lx, 0.1, lz]));
  g.add(makeBox(base, [2.0, 0.15, 1.4], [0, 0.2, 0]));
  g.add(makeBox(mattress, [1.9, 0.25, 1.3], [0, 0.4, 0]));
  g.add(makeBox(pillow, [0.45, 0.12, 0.7], [-0.5, 0.6, -0.25]));
  g.add(makeBox(pillow, [0.45, 0.12, 0.7], [-0.5, 0.6, 0.25]));
  g.add(makeBox(blanket, [1.5, 0.15, 1.32], [0.15, 0.6, 0]));
  g.add(makeBox(blanket, [1.5, 0.35, 0.08], [0.15, 0.45, 0.68]));
  g.add(makeBox(base, [0.1, 1.0, 1.4], [-0.95, 0.7, 0]));
  return g;
}
register('bed', buildBed);

// ── Desk ──────────────────────────────────────────────────
function buildDesk(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation;
  const metal = makeStd({ color: 0x4a4a60, roughness: 0.4, metalness: 0.6 });
  g.add(makeBox(M.wood, [1.8, 0.06, 0.9], [0, 0.8, 0]));
  for (const lx of [-0.8, 0.8]) {
    g.add(makeBox(metal, [0.06, 0.8, 0.06], [lx, 0.4, 0]));
    g.add(makeBox(metal, [0.2, 0.04, 0.4], [lx, 0.02, 0]));
  }
  g.add(makeBox(metal, [1.6, 0.04, 0.04], [0, 0.3, -0.4]));
  g.add(makeBox(M.concrete, [0.5, 0.4, 0.8], [0.5, 0.6, 0]));
  g.add(makeBox(M.glowCyan, [0.15, 0.02, 0.04], [0.5, 0.6, 0.42]));
  g.add(makeBox(makeStd({ color: 0x2a2a40, roughness: 0.7, metalness: 0.1 }), [0.6, 0.03, 0.2], [-0.2, 0.84, 0.15]));
  const chair = new THREE.Group(); chair.position.set(0, 0, 0.8);
  chair.add(makeBox(metal, [0.25, 0.05, 0.25], [0, 0.025, 0]));
  chair.add(makeBox(metal, [0.04, 0.04, 0.45], [0, 0.25, 0]));
  chair.add(makeBox(makeStd({ color: 0x3a3a55, roughness: 0.6, metalness: 0.2 }), [0.45, 0.06, 0.4], [0, 0.5, 0]));
  chair.add(makeBox(makeStd({ color: 0x3a3a55, roughness: 0.6, metalness: 0.2 }), [0.4, 0.4, 0.04], [0, 0.7, -0.18]));
  g.add(chair);
  if (cfg.panelId) {
    const tx = cfg.position[0] + Math.sin(cfg.rotation) * 0.1;
    const tz = cfg.position[2] + Math.cos(cfg.rotation) * 0.1;
    const term = buildTerminal({ position: [tx, 1.35, tz], color: 'cyan', panelId: cfg.panelId });
    return [g, term];
  }
  return g;
}
register('desk', buildDesk);

// ── TV ────────────────────────────────────────────────────
function buildTV(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation;
  const frameMat = new THREE.MeshBasicMaterial({ color: 0x11111a });
  const screenMat = new THREE.MeshBasicMaterial({ color: COLORS.magenta });
  g.add(makeBox(frameMat, [0.3, 0.3, 0.15], [0, 0, -0.1]));
  g.add(makeBox(frameMat, [0.08, 0.08, 0.2], [0, 0, -0.02]));
  g.add(makeBox(frameMat, [2.2, 1.3, 0.08], [0, 0, 0]));
  g.add(makePlane(screenMat, [2.0, 1.1], [0, 0, 0.05]));
  const noiseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, emissive: COLORS.magenta, emissiveIntensity: 0.5 });
  const noise = makePlane(noiseMat, [2.0, 1.1], [0, 0, 0.06]);
  g.add(noise);
  g.add(makeBox(new THREE.MeshBasicMaterial({ color: 0x1a1a28 }), [1.6, 0.25, 0.4], [0, -0.85, 0.2]));
  g.add(makeBox(new THREE.MeshBasicMaterial({ color: 0x3a3a55 }), [0.25, 0.06, 0.2], [-0.4, -0.72, 0.22]));
  g.add(makeBox(new THREE.MeshBasicMaterial({ color: 0x3a3a55 }), [0.15, 0.04, 0.15], [0.1, -0.73, 0.22]));
  g.add(makeBox(M.glowPink, [0.03, 0.03, 0.03], [0.2, -0.72, 0.22]));
  g.add(makeLight(COLORS.magenta, 1.2, 8, [0, 0, 0.5]));
  const result = { mesh: g, type: 'terminal', panelId: cfg.panelId, label: 'TV', room: 'APT' };
  return [g, result, noise];
}
register('tv', buildTV);

// ── Sofa ──────────────────────────────────────────────────
function buildSofa(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation;
  const mat = makeStd({ color: 0x553333, roughness: 0.85, metalness: 0.0 });
  const accent = makeStd({ color: 0x2a2a40, roughness: 0.6, metalness: 0.2 });
  const cushion = makeStd({ color: 0x664444, roughness: 0.9, metalness: 0.0 });
  for (const lx of [-0.8, 0.8]) for (const lz of [-0.35, 0.35]) g.add(makeBox(accent, [0.06, 0.15, 0.06], [lx, 0.075, lz]));
  g.add(makeBox(mat, [1.8, 0.25, 0.8], [0, 0.25, 0]));
  for (let i = -1; i <= 1; i++) g.add(makeBox(cushion, [0.5, 0.15, 0.75], [i * 0.55, 0.45, 0]));
  for (let i = -1; i <= 1; i++) g.add(makeBox(mat, [0.55, 0.45, 0.12], [i * 0.55, 0.6, -0.34]));
  for (const lx of [-0.9, 0.9]) g.add(makeBox(accent, [0.15, 0.45, 0.8], [lx, 0.35, 0]));
  return g;
}
register('sofa', buildSofa);

// ── Coffee Table ──────────────────────────────────────────
function buildCoffeeTable(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const mat = makeStd({ color: 0x2a2a40, roughness: 0.5, metalness: 0.3 });
  g.add(makeBox(mat, [0.9, 0.05, 0.55], [0, 0.4, 0]));
  for (const lx of [-0.4, 0.4]) for (const lz of [-0.25, 0.25]) g.add(makeBox(mat, [0.03, 0.03, 0.4], [lx, 0.2, lz]));
  g.add(makeBox(makeStd({ color: 0x554433, roughness: 0.6, metalness: 0.1 }), [0.04, 0.04, 0.08], [0.15, 0.47, 0.05]));
  return g;
}
register('coffeeTable', buildCoffeeTable);

// ── Kitchen ───────────────────────────────────────────────
function buildKitchen(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const mat = makeStd({ color: 0x3a3a55, roughness: 0.5, metalness: 0.3 });
  const counter = makeStd({ color: 0x2a2a35, roughness: 0.3, metalness: 0.2 });
  const handle = makeStd({ color: 0x888899, roughness: 0.3, metalness: 0.8 });
  g.add(makeBox(mat, [0.7, 1.7, 0.7], [0, 0.85, 0]));
  g.add(makeBox(makeStd({ color: 0x252530, roughness: 0.7, metalness: 0.1 }), [0.65, 1.5, 0.05], [0, 0.85, 0.36]));
  g.add(makeBox(handle, [0.03, 0.3, 0.03], [0.22, 1.1, 0.4]));
  g.add(makeBox(counter, [1.4, 0.85, 0.6], [1.1, 0.425, 0]));
  for (let i = 0; i < 3; i++) {
    g.add(makeBox(mat, [0.4, 0.7, 0.04], [0.55 + i * 0.45, 0.5, 0.32]));
    g.add(makeBox(handle, [0.06, 0.02, 0.02], [0.65 + i * 0.45, 0.65, 0.35]));
  }
  g.add(makeBox(mat, [1.5, 0.04, 0.65], [1.1, 0.88, 0]));
  g.add(makeBox(counter, [1.4, 0.6, 0.35], [1.1, 1.7, -0.05]));
  for (let i = 0; i < 2; i++) g.add(makeBox(mat, [0.6, 0.5, 0.04], [0.7 + i * 0.7, 1.7, 0.14]));
  g.add(makeBox(makeStd({ color: 0x11111a, roughness: 0.6, metalness: 0.2 }), [0.45, 0.28, 0.32], [1.1, 1.2, 0.05]));
  g.add(makeBox(makeStd({ color: 0x1a1a28, roughness: 0.5, metalness: 0.2 }), [0.38, 0.2, 0.02], [1.1, 1.2, 0.22]));
  g.add(makeBox(makeStd({ color: 0x111111, roughness: 0.8, metalness: 0.1 }), [0.5, 0.04, 0.5], [0.4, 0.9, 0]));
  g.add(makeBox(makeStd({ color: 0x222222, roughness: 0.6, metalness: 0.2 }), [0.08, 0.02, 0.08], [0.4, 0.93, 0]));
  return g;
}
register('kitchen', buildKitchen);

// ── Bathroom ──────────────────────────────────────────────
function buildBathroom(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const white = makeStd({ color: 0x3a3a55, roughness: 0.4, metalness: 0.1 });
  const ceramic = makeStd({ color: 0x4a4a60, roughness: 0.2, metalness: 0.1 });
  g.add(makeBox(white, [0.35, 0.35, 0.18], [0, 0.55, -0.2]));
  g.add(makeBox(ceramic, [0.3, 0.35, 0.38], [0, 0.4, 0.05]));
  g.add(makeBox(makeStd({ color: 0x4a4a60, roughness: 0.3, metalness: 0.1 }), [0.32, 0.04, 0.4], [0, 0.6, 0.05]));
  g.add(makeBox(white, [0.5, 0.75, 0.35], [0.5, 0.375, 0.3]));
  g.add(makeBox(ceramic, [0.55, 0.06, 0.42], [0.5, 0.78, 0.3]));
  g.add(makeBox(new THREE.MeshBasicMaterial({ color: 0x888899 }), [0.04, 0.15, 0.04], [0.5, 0.9, 0.15]));
  g.add(makeBox(white, [0.5, 0.55, 0.03], [0.5, 1.15, 0.55]));
  g.add(makePlane(makeStd({ color: 0x8888aa, roughness: 0.1, metalness: 0.9 }), [0.42, 0.47], [0.5, 1.15, 0.57]));
  g.add(makeLight(0xffffff, 0.5, 4, [0.5, 1.4, 0.4]));
  return g;
}
register('bathroom', buildBathroom);

// ── Floor Lamp ────────────────────────────────────────────
function buildFloorLamp(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const metal = makeStd({ color: 0x2a2a40, roughness: 0.4, metalness: 0.6 });
  g.add(makeBox(metal, [0.2, 0.04, 0.2], [0, 0.02, 0]));
  g.add(makeBox(metal, [0.025, 0.025, 1.6], [0, 0.8, 0]));
  g.add(makeCone(makeStd({ color: 0xffaa55, roughness: 0.6, metalness: 0.1 }), [0.25, 0.3, 8], [0, 1.7, 0]));
  g.add(makeSphere(new THREE.MeshStandardMaterial({ color: 0xffddaa, emissive: 0xffddaa, emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.0 }), [0.06, 8, 8], [0, 1.6, 0]));
  g.add(makeLight(0xffaa55, 1.2, 10, [0, 1.6, 0]));
  return g;
}
register('floorLamp', buildFloorLamp);

// ── Bookshelf ─────────────────────────────────────────────
function buildBookshelf(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation;
  const mat = makeStd({ color: 0x4a3333, roughness: 0.7, metalness: 0.0 });
  const books = [
    makeStd({ color: 0x552222, roughness: 0.8, metalness: 0.0 }),
    makeStd({ color: 0x225533, roughness: 0.8, metalness: 0.0 }),
    makeStd({ color: 0x223355, roughness: 0.8, metalness: 0.0 }),
    makeStd({ color: 0x554422, roughness: 0.8, metalness: 0.0 }),
  ];
  g.add(makeBox(mat, [0.8, 1.8, 0.25], [0, 0.9, 0]));
  for (let s = 0; s < 4; s++) {
    const sy = 0.3 + s * 0.45;
    g.add(makeBox(mat, [0.75, 0.03, 0.22], [0, sy, 0]));
    for (let b = 0; b < 5 + Math.random() * 4; b++) {
      const bw = 0.04 + Math.random() * 0.04;
      const bh = 0.25 + Math.random() * 0.1;
      g.add(makeBox(books[Math.floor(Math.random() * books.length)], [bw, bh, 0.18], [-0.3 + b * 0.07, sy + bh / 2 + 0.015, 0]));
    }
  }
  return g;
}
register('bookshelf', buildBookshelf);

// ── Trash ─────────────────────────────────────────────────
function buildTrash(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const mat = makeStd({ color: 0x333340, roughness: 0.7, metalness: 0.2 });
  g.add(makeCylinder(mat, [0.12, 0.1, 0.25, 8], [0, 0.125, 0]));
  g.add(makeBox(makeStd({ color: 0x552222, roughness: 0.8, metalness: 0.0 }), [0.15, 0.08, 0.1], [0.02, 0.22, 0.02]));
  g.add(makeBox(makeStd({ color: 0x335533, roughness: 0.8, metalness: 0.0 }), [0.08, 0.06, 0.12], [-0.02, 0.24, -0.01]));
  return g;
}
register('trash', buildTrash);

// ── Plant ─────────────────────────────────────────────────
function buildPlant(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const pot = makeStd({ color: 0x5a3a20, roughness: 0.9, metalness: 0.0 });
  const leaf = makeStd({ color: 0x1a5a2a, roughness: 0.8, metalness: 0.0 });
  g.add(makeCylinder(pot, [0.15, 0.12, 0.25, 8], [0, 0.125, 0]));
  for (let i = 0; i < 7; i++) {
    const l = makeCone(leaf, [0.08, 0.3, 6], [(Math.random() - 0.5) * 0.15, 0.35, (Math.random() - 0.5) * 0.15]);
    l.rotation.x = (Math.random() - 0.5) * 0.5; l.rotation.z = (Math.random() - 0.5) * 0.5;
    g.add(l);
  }
  return g;
}
register('plant', buildPlant);

// ── Ceiling Lamp (industrial cyberpunk — MeshBasicMaterial fixture) ──
function buildCeilingLamp(cfg) {
  const g = new THREE.Group();
  g.position.set(...cfg.position);

  const rodMat = makeStd({ color: 0x2a2a3a, roughness: 0.4, metalness: 0.6 });
  const housingMat = makeStd({ color: 0x1a1a28, roughness: 0.6, metalness: 0.3 });
  const bulbMat = new THREE.MeshStandardMaterial({ color: cfg.color || COLORS.cyber, emissive: cfg.color || COLORS.cyber, emissiveIntensity: 1.0, roughness: 0.2, metalness: 0.0 });

  // Hanging rod from ceiling
  const rodH = CFG.wallH - cfg.position[1];
  g.add(makeBox(rodMat, [0.04, rodH, 0.04], [0, rodH / 2, 0]));

  // Lamp housing (industrial box)
  g.add(makeBox(housingMat, [0.5, 0.12, 0.5], [0, -0.06, 0]));

  // Glowing bulb element (visible flat shade)
  g.add(makeBox(bulbMat, [0.35, 0.04, 0.35], [0, -0.14, 0]));

  // Actual light
  const light = new THREE.PointLight(cfg.color || COLORS.cyber, cfg.intensity || 4, cfg.distance || 16, 1);
  light.position.set(0, -0.3, 0);
  g.add(light);

  return g;
}
register('ceilingLamp', buildCeilingLamp);

// ── Nightstand ────────────────────────────────────────────
function buildNightstand(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const woodMat = makeStd({ color: 0x5a3a2a, roughness: 0.7, metalness: 0.0 });
  const handleMat = makeStd({ color: 0x888899, roughness: 0.3, metalness: 0.8 });
  g.add(makeBox(woodMat, [0.5, 0.5, 0.4], [0, 0.25, 0]));
  g.add(makeBox(woodMat, [0.52, 0.04, 0.42], [0, 0.5, 0]));
  g.add(makeBox(handleMat, [0.08, 0.02, 0.02], [0.15, 0.35, 0.21]));
  g.add(makeBox(new THREE.MeshStandardMaterial({ color: 0xffaa55, emissive: 0xffaa55, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.0 }), [0.04, 0.06, 0.04], [0.18, 0.56, -0.05]));
  return g;
}
register('nightstand', buildNightstand);

// ── Desk Chair ────────────────────────────────────────────
function buildDeskChair(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation || 0;
  const frameMat = makeStd({ color: 0x3a3a55, roughness: 0.4, metalness: 0.5 });
  const seatMat = makeStd({ color: 0x553333, roughness: 0.85, metalness: 0.0 });
  g.add(makeBox(frameMat, [0.06, 0.5, 0.06], [0, 0.25, 0]));
  g.add(makeBox(frameMat, [0.4, 0.04, 0.4], [0, 0.02, 0]));
  g.add(makeBox(seatMat, [0.42, 0.06, 0.4], [0, 0.55, 0]));
  g.add(makeBox(seatMat, [0.38, 0.35, 0.04], [0, 0.75, -0.18]));
  return g;
}
register('deskChair', buildDeskChair);

// ── Rug ───────────────────────────────────────────────────
function buildRug(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const rugMat = makeStd({ color: 0x4a3a30, roughness: 0.95, metalness: 0.0 });
  const patternMat = makeStd({ color: 0x6a5040, roughness: 0.9, metalness: 0.0 });
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.8), rugMat));
  const pattern = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.8), patternMat);
  pattern.position.set(0, 0.001, 0);
  g.add(pattern);
  g.rotation.x = -Math.PI / 2;
  return g;
}
register('rug', buildRug);

// ── Fridge ────────────────────────────────────────────────
function buildFridge(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation || 0;
  const bodyMat = makeStd({ color: 0x5a5a70, roughness: 0.3, metalness: 0.6 });
  g.add(makeBox(bodyMat, [0.6, 1.4, 0.55], [0, 0.7, 0]));
  g.add(makeBox(makeStd({ color: 0x888899, roughness: 0.3, metalness: 0.8 }), [0.04, 0.3, 0.02], [0.2, 1.1, 0.28]));
  g.add(makeBox(makeStd({ color: 0x888899, roughness: 0.3, metalness: 0.8 }), [0.04, 0.3, 0.02], [0.2, 0.5, 0.28]));
  g.add(makeLight(0xffffff, 0.3, 3, [0, 0.5, 0.3]));
  return g;
}
register('fridge', buildFridge);

// ── Mirror ────────────────────────────────────────────────
function buildMirror(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation || 0;
  const frameMat = makeStd({ color: 0x3a3a50, roughness: 0.5, metalness: 0.3 });
  g.add(makeBox(frameMat, [0.7, 0.9, 0.04], [0, 0, 0]));
  g.add(makePlane(makeStd({ color: 0x8899aa, roughness: 0.05, metalness: 0.95 }), [0.6, 0.8], [0, 0, 0.03]));
  return g;
}
register('mirror', buildMirror);

// ── Server Rack ───────────────────────────────────────────
function buildServer(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation || 0;
  const caseMat = makeStd({ color: 0x2a2a35, roughness: 0.5, metalness: 0.4 });
  g.add(makeBox(caseMat, [0.4, 0.8, 0.4], [0, 0.4, 0]));
  for (let i = 0; i < 6; i++) {
    const ledColor = Math.random() > 0.5 ? COLORS.green : COLORS.cyan;
    g.add(makeBox(new THREE.MeshStandardMaterial({ color: ledColor, emissive: ledColor, emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.0 }), [0.3, 0.02, 0.01], [0, 0.15 + i * 0.12, 0.21]));
  }
  g.add(makeBox(makeStd({ color: 0x3a3a50, roughness: 0.4, metalness: 0.5 }), [0.42, 0.04, 0.42], [0, 0.84, 0]));
  return g;
}
register('server', buildServer);

// ── Drone ─────────────────────────────────────────────────
function buildDrone(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation || 0;
  const bodyMat = makeStd({ color: 0x4a4a60, roughness: 0.4, metalness: 0.5 });
  g.add(makeBox(bodyMat, [0.15, 0.06, 0.1], [0, 0, 0]));
  for (const lx of [-0.12, 0.12]) {
    const arm = makeBox(bodyMat, [0.04, 0.02, 0.12], [lx, 0, 0]);
    g.add(arm);
    const rotor = makeBox(new THREE.MeshBasicMaterial({ color: 0x1a1a28 }), [0.08, 0.01, 0.01], [lx, 0.04, 0]);
    g.add(rotor);
  }
  g.add(makeBox(new THREE.MeshBasicMaterial({ color: COLORS.cyan }), [0.02, 0.02, 0.02], [0, 0, 0.06]));
  return g;
}
register('drone', buildDrone);

// ── Box Stack ─────────────────────────────────────────────
function buildBoxStack(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const boxMat = makeStd({ color: 0x6a5040, roughness: 0.9, metalness: 0.0 });
  for (let i = 0; i < 3; i++) {
    const bx = (Math.random() - 0.5) * 0.15;
    const bz = (Math.random() - 0.5) * 0.15;
    g.add(makeBox(boxMat, [0.3 + Math.random() * 0.1, 0.25, 0.25 + Math.random() * 0.08], [bx, 0.125 + i * 0.25, bz]));
  }
  return g;
}
register('boxStack', buildBoxStack);

// ── Small clutter details ─────────────────────────────────
function buildCan(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const canMat = makeStd({ color: cfg.color || 0xcc3333, roughness: 0.3, metalness: 0.7 });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8), canMat));
  return g;
}
register('can', buildCan);

function buildBottle(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const bottleMat = makeStd({ color: cfg.color || 0x557733, roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.7 });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.12, 8), bottleMat));
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.03, 8), makeStd({ color: 0x888899, roughness: 0.3, metalness: 0.8 })));
  g.children[1].position.y = 0.075;
  return g;
}
register('bottle', buildBottle);

function buildBookStack(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const colors = [0x552222, 0x225533, 0x223355, 0x554422, 0x333355];
  for (let i = 0; i < (cfg.count || 3); i++) {
    const bw = 0.15 + Math.random() * 0.05;
    const bh = 0.03 + Math.random() * 0.02;
    const bl = 0.2 + Math.random() * 0.05;
    const book = makeBox(makeStd({ color: colors[i % colors.length], roughness: 0.85, metalness: 0.0 }), [bw, bh, bl], [(Math.random() - 0.5) * 0.02, i * 0.035, (Math.random() - 0.5) * 0.02]);
    book.rotation.y = (Math.random() - 0.5) * 0.1;
    g.add(book);
  }
  return g;
}
register('bookStack', buildBookStack);

function buildShoes(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation || 0;
  const shoeMat = makeStd({ color: 0x2a2a35, roughness: 0.7, metalness: 0.2 });
  g.add(makeBox(shoeMat, [0.12, 0.06, 0.25], [-0.08, 0.03, 0]));
  g.add(makeBox(shoeMat, [0.12, 0.06, 0.25], [0.08, 0.03, 0.05]));
  return g;
}
register('shoes', buildShoes);

function buildClothes(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const clothMat = makeStd({ color: cfg.color || 0x553333, roughness: 0.95, metalness: 0.0 });
  for (let i = 0; i < 4; i++) {
    const c = makeBox(clothMat, [0.2 + Math.random() * 0.1, 0.02, 0.2 + Math.random() * 0.1], [(Math.random() - 0.5) * 0.15, i * 0.015, (Math.random() - 0.5) * 0.15]);
    c.rotation.y = Math.random() * Math.PI;
    g.add(c);
  }
  return g;
}
register('clothes', buildClothes);

function buildGun(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation || 0;
  const metalMat = makeStd({ color: 0x2a2a3a, roughness: 0.4, metalness: 0.7 });
  g.add(makeBox(metalMat, [0.02, 0.03, 0.15], [0, 0.015, 0]));
  g.add(makeBox(metalMat, [0.015, 0.04, 0.04], [0, 0.02, 0.06]));
  return g;
}
register('gun', buildGun);

function buildMug(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const mugMat = makeStd({ color: 0x887766, roughness: 0.3, metalness: 0.1 });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8), mugMat));
  g.add(makeBox(mugMat, [0.015, 0.01, 0.025], [0.035, 0.02, 0]));
  return g;
}
register('mug', buildMug);

function buildPaper(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const paperMat = makeStd({ color: 0xddccaa, roughness: 0.9, metalness: 0.0 });
  for (let i = 0; i < (cfg.count || 2); i++) {
    const p = makeBox(paperMat, [0.08 + Math.random() * 0.04, 0.003, 0.1 + Math.random() * 0.04], [(Math.random() - 0.5) * 0.05, i * 0.004, (Math.random() - 0.5) * 0.05]);
    p.rotation.y = Math.random() * Math.PI;
    g.add(p);
  }
  return g;
}
register('paper', buildPaper);

// ── Decorations (no mesh returned, added directly to scene) ──

function buildNeonSign(cfg) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const ctx = c.getContext('2d'); ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 256, 64);
  ctx.font = 'bold 32px "Orbitron", monospace'; ctx.fillStyle = '#' + cfg.color.toString(16).padStart(6, '0');
  ctx.textAlign = 'center'; ctx.fillText(cfg.text, 128, 46);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, opacity: 0.9, side: THREE.DoubleSide,
    emissive: cfg.color, emissiveIntensity: 1.5, roughness: 0.4, metalness: 0.0
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.5), mat); mesh.position.set(...cfg.position);
  return mesh;
}

function buildPoster(cfg) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 90;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#111118'; ctx.fillRect(0, 0, 64, 90);
  ctx.strokeStyle = '#' + cfg.color.toString(16).padStart(6, '0'); ctx.lineWidth = 2; ctx.strokeRect(2, 2, 60, 86);
  ctx.fillStyle = '#' + cfg.color.toString(16).padStart(6, '0'); ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
  cfg.text.split('\n').forEach((line, i) => ctx.fillText(line, 32, 20 + i * 14));
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), mat);
}

function buildSteam(cfg) {
  const geo = new THREE.PlaneGeometry(0.4, 0.4);
  const mat = new THREE.MeshBasicMaterial({ color: 0x8899aa, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...cfg.position);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

// ── Window + City ─────────────────────────────────────────

function buildWindowAndCity(cfg) {
  const group = new THREE.Group();
  const winW = 3, winH = 2;
  // Emissive window — bright blue city light source
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a14, emissive: 0x2244aa, emissiveIntensity: 2.0,
    roughness: 0.2, metalness: 0.5
  });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), winMat);
  win.position.set(...cfg.position); group.add(win);
  const frameMat = new THREE.MeshBasicMaterial({ color: 0x1a1a28 });
  group.add(makeBox(frameMat, [winW + 0.2, 0.1, 0.15], [cfg.position[0], cfg.position[1] + winH/2, cfg.position[2]]));
  group.add(makeBox(frameMat, [winW + 0.2, 0.1, 0.15], [cfg.position[0], cfg.position[1] - winH/2, cfg.position[2]]));
  group.add(makeBox(frameMat, [0.1, winH, 0.15], [cfg.position[0] - winW/2, cfg.position[1], cfg.position[2]]));
  group.add(makeBox(frameMat, [0.1, winH, 0.15], [cfg.position[0] + winW/2, cfg.position[1], cfg.position[2]]));
  group.add(makeBox(frameMat, [winW + 0.2, 0.04, 0.08], [cfg.position[0], cfg.position[1], cfg.position[2]]));
  group.add(makeBox(frameMat, [0.04, winH, 0.08], [cfg.position[0], cfg.position[1], cfg.position[2]]));
  group.add(makeBox(M.glowCyan, [winW - 0.5, 0.05, 0.08], [cfg.position[0], cfg.position[1] + winH/2 + 0.15, cfg.position[2] + 0.1]));

  // SpotLight from window into room — city light beam
  const winSpot = new THREE.SpotLight(0x6688aa, 8.0, 15, Math.PI / 4, 0.5, 1);
  winSpot.position.set(cfg.position[0], cfg.position[1] + 1, cfg.position[2] + 0.5);
  winSpot.target.position.set(cfg.position[0], 0, cfg.position[2] + 5);
  winSpot.castShadow = true;
  winSpot.shadow.mapSize.width = 512;
  winSpot.shadow.mapSize.height = 512;
  group.add(winSpot);
  group.add(winSpot.target);

  const cityGroup = new THREE.Group(); cityGroup.position.set(cfg.position[0], 0, cfg.position[2] - 10);
  const bldgColors = [0x1a1a28, 0x111118, 0x0d0d14, 0x151520, 0x1a1520];
  const winColors = [0xff003c, 0x00f0ff, 0xfcee0a, 0xff6b00, 0x00ff88, 0xffffff];
  for (let i = 0; i < 30; i++) {
    const bw = 1 + Math.random() * 3; const bh = 5 + Math.random() * 25; const bd = 1 + Math.random() * 3;
    const bx = (Math.random() - 0.5) * 50; const bz = -5 - Math.random() * 40;
    const bmesh = makeBox(new THREE.MeshBasicMaterial({ color: bldgColors[Math.floor(Math.random() * bldgColors.length)] }), [bw, bh, bd], [bx, bh / 2 - 2, bz]);
    cityGroup.add(bmesh);
    const floors = Math.floor(bh / 1.5); const winsPerFloor = Math.floor(bw / 0.8);
    for (let f = 0; f < floors; f++) for (let w = 0; w < winsPerFloor; w++) if (Math.random() > 0.6) {
      const wmesh = makeBox(new THREE.MeshBasicMaterial({ color: winColors[Math.floor(Math.random() * winColors.length)] }), [0.25, 0.35, 0.05], [bx - bw / 2 + 0.4 + w * 0.8, (f * 1.5) - 2 + 0.8, bz + bd / 2 + 0.03]);
      cityGroup.add(wmesh);
    }
  }
  for (let i = 0; i < 10; i++) {
    const sx = (Math.random() - 0.5) * 30; const sz = -8 - Math.random() * 30;
    cityGroup.add(makeBox(new THREE.MeshBasicMaterial({ color: 0x2a2a3a }), [0.08, 4, 0.08], [sx, 2, sz]));
    cityGroup.add(makeBox(new THREE.MeshBasicMaterial({ color: 0xffaa55 }), [0.3, 0.1, 0.15], [sx, 2, sz]));
  }
  for (let i = 0; i < 6; i++) {
    const car = makeBox(new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xff003c : 0x00f0ff }), [0.4, 0.1, 0.2], [(Math.random() - 0.5) * 40, 3 + Math.random() * 8, -10 - Math.random() * 30]);
    cityGroup.add(car);
  }
  group.add(cityGroup);
  group.add(makeLight(COLORS.cyan, 1.0, 12, [cfg.position[0], cfg.position[1], cfg.position[2] + 1]));
  const cityDir = new THREE.DirectionalLight(0x6688aa, 0.5); cityDir.position.set(cfg.position[0], 5, cfg.position[2] - 10); group.add(cityDir);
  return group;
}

// ═══════════════════════════════════════════════════════════
// GEOMETRY HELPERS (SRP: primitive construction)
// ═══════════════════════════════════════════════════════════

function makeBox(material, size, pos) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...pos);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

function makePlane(material, size, pos) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...size), material);
  mesh.position.set(...pos);
  mesh.receiveShadow = true;
  return mesh;
}

function makeCylinder(material, params, pos) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(...params), material);
  mesh.position.set(...pos);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

function makeCone(material, params, pos) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(...params), material);
  mesh.position.set(...pos);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

function makeSphere(material, params, pos) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(...params), material);
  mesh.position.set(...pos);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

function makeLight(color, intensity, distance, pos) {
  const light = new THREE.PointLight(color, intensity, distance, 1);
  light.position.set(...pos);
  light.castShadow = true;
  light.shadow.mapSize.width = 256;
  light.shadow.mapSize.height = 256;
  light.shadow.bias = -0.001;
  return light;
}

// ── Room Primitives ───────────────────────────────────────

function addWallAt(x, y, z, w, d, h = CFG.wallH) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.wall);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

function addFloor(x, z, w, d) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.floor);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0, z);
  mesh.receiveShadow = true;
  return mesh;
}

function addCeiling(x, z, w, d) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.ceiling);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, CFG.wallH, z);
  mesh.receiveShadow = true;
  return mesh;
}

// ═══════════════════════════════════════════════════════════
// ROOM BUILDER
// ═══════════════════════════════════════════════════════════

/**
 * Builds the entire apartment level.
 *
 * Decision: Declarative layout + registry dispatch.
 * Rationale (SOLID — OCP + SRP): This function only knows HOW to place things
 * (position, rotation, add to scene). It does not know WHAT each furniture looks
 * like. That knowledge lives in the FurnitureRegistry.
 *
 * @param {THREE.Scene} scene
 * @param {Object} state — mutated: walls, interactables, implants, particles
 */
export function buildLevel(scene, state) {
  const W = ROOM_LAYOUT.width; const D = ROOM_LAYOUT.depth;
  const t = ROOM_LAYOUT.wallThickness; const hw = W / 2; const hd = D / 2;

  // Floor & ceiling
  scene.add(addFloor(0, 0, W, D));
  scene.add(addCeiling(0, 0, W, D));

  // Walls (with collision bounds)
  const wallDefs = [
    // North (window gap ~3m)
    { x: -3, y: 0, z: -hd + t / 2, w: 3, d: t, h: CFG.wallH },
    { x: 3, y: 0, z: -hd + t / 2, w: 3, d: t, h: CFG.wallH },
    { x: 0, y: 0, z: -hd + t / 2, w: W, d: t, h: 1.2 },
    { x: 0, y: 3.0, z: -hd + t / 2, w: W, d: t, h: 0.5 },
    // South (sealed door gap ~1.5m)
    { x: -3.5, y: 0, z: hd - t / 2, w: 5.5, d: t, h: CFG.wallH },
    { x: 3.5, y: 0, z: hd - t / 2, w: 5.5, d: t, h: CFG.wallH },
    { x: 0, y: 0, z: hd - t / 2, w: W, d: t, h: 0.1 },
    { x: 0, y: 2.3, z: hd - t / 2, w: W, d: t, h: 1.2 },
    // East solid
    { x: hw - t / 2, y: 0, z: 0, w: t, d: D, h: CFG.wallH },
    // West (bathroom partition gaps)
    { x: -hw + t / 2, y: 0, z: -1, w: t, d: 4, h: CFG.wallH },
    { x: -hw + t / 2, y: 0, z: 3, w: t, d: 1, h: CFG.wallH },
    // Bathroom partition
    { x: -3.5, y: 0, z: 1.5, w: 2.5, d: t, h: CFG.wallH },
    { x: -3.5, y: 0, z: 3, w: 2.5, d: t, h: CFG.wallH },
  ];

  for (const wd of wallDefs) {
    const mesh = addWallAt(wd.x, wd.y, wd.z, wd.w, wd.d, wd.h);
    scene.add(mesh);
    state.walls.push({
      minX: wd.x - wd.w / 2 - CFG.radius,
      maxX: wd.x + wd.w / 2 + CFG.radius,
      minZ: wd.z - wd.d / 2 - CFG.radius,
      maxZ: wd.z + wd.d / 2 + CFG.radius,
    });
  }

  // Window + city
  scene.add(buildWindowAndCity({ position: [0, 2.2, -hd] }));

  // Sealed door
  scene.add(buildClosedDoor(0, hd - 0.05, 0));

  // Furniture via registry
  for (const item of ROOM_LAYOUT.furniture) {
    const builder = FurnitureRegistry.get(item.type);
    if (!builder) { console.warn('Unknown furniture type:', item.type); continue; }
    const result = builder(item);
    const results = Array.isArray(result) ? result : [result];
    for (const r of results) {
      if (r && r.mesh) {
        scene.add(r.mesh);
        if (r.type === 'terminal') state.interactables.push(r);
      } else if (r && r.isGroup) {
        scene.add(r);
      } else if (r instanceof THREE.Mesh || r instanceof THREE.Group) {
        scene.add(r);
      }
    }
  }

  // Decorations
  for (const dec of ROOM_LAYOUT.decorations) {
    if (dec.type === 'neonSign') {
      const mesh = buildNeonSign(dec); mesh.position.set(...dec.position); scene.add(mesh); scene.add(makeLight(dec.color, 0.8, 5, dec.position));
    } else if (dec.type === 'poster') {
      const mesh = buildPoster(dec); mesh.position.set(...dec.position); scene.add(mesh);
    } else if (dec.type === 'steam') {
      const mesh = buildSteam(dec); scene.add(mesh);
      state.particles.push({ mesh, vx: (Math.random() - 0.5) * 0.01, vy: 0.015 + Math.random() * 0.01, vz: (Math.random() - 0.5) * 0.01, life: 1.0, isSteam: true });
    } else if (dec.type === 'fairyLights') {
      const colors = [COLORS.magenta, COLORS.cyan, COLORS.cyber, COLORS.green];
      for (let i = 0; i < 12; i++) {
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshBasicMaterial({ color: colors[i % colors.length] }));
        bulb.position.set(dec.position[0] - 2 + (i * 0.35), dec.position[1], dec.position[2] + 0.1);
        scene.add(bulb);
        if (i % 2 === 0) scene.add(makeLight(colors[i % colors.length], 0.3, 2, [dec.position[0] - 2 + (i * 0.35), dec.position[1], dec.position[2] + 0.1]));
      }
    }
  }

  // Lighting
  setupLighting(scene);

  // Ambient particles
  for (let i = 0; i < 30; i++) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? COLORS.cyan : COLORS.cyber, transparent: true, opacity: 0.5 }));
    mesh.position.set((Math.random() - 0.5) * 40, Math.random() * 4, (Math.random() - 0.5) * 40);
    scene.add(mesh);
    state.particles.push({ mesh, vx: (Math.random() - 0.5) * 0.015, vy: (Math.random() - 0.5) * 0.008, vz: (Math.random() - 0.5) * 0.015, life: 1.0 });
  }
}

function buildClosedDoor(x, z, rotY) {
  const group = new THREE.Group(); group.position.set(x, 0, z); group.rotation.y = rotY;
  const mat = new THREE.MeshBasicMaterial({ color: 0x3a3a55 });
  const glowMat = new THREE.MeshBasicMaterial({ color: COLORS.magenta });
  group.add(makeBox(mat, [1.5, 0.15, 0.15], [0, 2.2, 0]));
  group.add(makeBox(mat, [0.15, 2.2, 0.15], [-0.7, 1.1, 0]));
  group.add(makeBox(mat, [0.15, 2.2, 0.15], [0.7, 1.1, 0]));
  group.add(makeBox(mat, [1.3, 2.1, 0.08], [0, 1.1, 0]));
  group.add(makeBox(glowMat, [0.5, 0.25, 0.02], [0.2, 1.6, 0.05]));
  const c = document.createElement('canvas'); c.width = 128; c.height = 32;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 128, 32);
  ctx.fillStyle = '#ff003c'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center'; ctx.fillText('SEALED', 64, 22);
  const tex = new THREE.CanvasTexture(c);
  group.add(makePlane(new THREE.MeshBasicMaterial({ map: tex, transparent: true }), [0.5, 0.1], [0.2, 1.6, 0.06]));
  return group;
}

function setupLighting(scene) {
  // Very low ambient — dramatic shadows
  scene.add(new THREE.AmbientLight(0x201810, 0.6));
  scene.add(new THREE.HemisphereLight(0x443322, 0x110d08, 0.5));

  // Central ceiling lamp — warm, focused
  const ceilMain = new THREE.PointLight(0xffcc88, 3.5, 10, 1);
  ceilMain.position.set(0, 3.3, 0); scene.add(ceilMain);

  // Desk lamp — intense, focused
  const deskLamp = new THREE.PointLight(0xffeedd, 2.5, 5, 1);
  deskLamp.position.set(3, 1.6, -2.5); scene.add(deskLamp);

  // Floor lamp — warm glow near sofa
  const floorLamp = new THREE.PointLight(0xffaa55, 2.0, 6, 1);
  floorLamp.position.set(-0.5, 1.7, 2); scene.add(floorLamp);

  // TV / monitor glow
  const tvLight = new THREE.PointLight(COLORS.cyan, 3.0, 6, 1);
  tvLight.position.set(4.5, 1.4, 0); scene.add(tvLight);
  tvLight.userData = { flicker: true, baseIntensity: 3.0, flickerSpeed: 8, flickerPhase: 0 };

  // Terminal screen glow
  const termLight = new THREE.PointLight(COLORS.cyan, 2.0, 4, 1);
  termLight.position.set(3, 1.2, -2.5); scene.add(termLight);

  // Kitchen under-cabinet
  const kitLight = new THREE.PointLight(0xffeedd, 1.2, 5, 1);
  kitLight.position.set(3.5, 1.5, 2.5); scene.add(kitLight);

  // Bathroom
  const bathLight = new THREE.PointLight(0xffffff, 1.0, 4, 1);
  bathLight.position.set(-3.5, 2.5, 3); scene.add(bathLight);

  // Window city light — cold blue
  const cityLight = new THREE.PointLight(0x6688aa, 2.0, 10, 1);
  cityLight.position.set(0, 1.5, -3); scene.add(cityLight);

  // Neon ALPH0X glow
  scene.add(makeLight(COLORS.magenta, 1.5, 6, [-4.5, 2.6, 0]));
}

// ═══════════════════════════════════════════════════════════
// GAME CLASS (orchestrator — DIP: receives dependencies)
// ═══════════════════════════════════════════════════════════

export class Game {
  /**
   * @param {Object} deps — injected dependencies (renderer, scene, camera, controls, state, composer)
   */
  constructor({ renderer, scene, camera, controls, state, composer }) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.state = state;
    this.composer = composer;
    this.raycaster = new THREE.Raycaster();
    this.weaponGroup = null;
    this.muzzleLight = null;
    this.prevTime = performance.now();
    this._boundAnimate = this.animate.bind(this);
  }

  init() {
    buildLevel(this.scene, this.state);
    this.createWeapon();
    this.state.interactables.forEach((i) => {
      i.mesh.traverse((c) => { if (c.isMesh) c.userData = { label: i.label }; });
    });
    this.bindInput();
    this.setupLoading();
  }

  createWeapon() {
    this.weaponGroup = new THREE.Group();
    const gunMat = makeStd({ color: 0x3a3a55, roughness: 0.4, metalness: 0.6 });
    const accentMat = new THREE.MeshStandardMaterial({ color: COLORS.cyber, emissive: COLORS.cyber, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.2 });
    const barrelMat = makeStd({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.8 });
    this.weaponGroup.add(makeBox(gunMat, [0.15, 0.4, 0.15], [0, -0.2, 0.1]));
    this.weaponGroup.add(makeBox(gunMat, [0.2, 0.25, 0.6], [0, 0, -0.1]));
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), barrelMat); barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.05, -0.5); this.weaponGroup.add(barrel);
    this.weaponGroup.add(makeBox(accentMat, [0.22, 0.05, 0.4], [0, 0.13, -0.1]));
    this.weaponGroup.add(makeBox(accentMat, [0.08, 0.15, 0.2], [0.14, 0, -0.05]));
    this.weaponGroup.add(makeBox(accentMat, [0.08, 0.15, 0.2], [-0.14, 0, -0.05]));
    this.weaponGroup.position.set(0.6, -0.5, -1.0);
    this.camera.add(this.weaponGroup);
    this.muzzleLight = new THREE.PointLight(COLORS.cyber, 0, 5);
    this.muzzleLight.position.set(0, 0.05, -0.8);
    this.weaponGroup.add(this.muzzleLight);
  }

  bindInput() {
    this._onKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.state.moveForward = true; break;
        case 'KeyS': case 'ArrowDown': this.state.moveBackward = true; break;
        case 'KeyA': case 'ArrowLeft': this.state.moveLeft = true; break;
        case 'KeyD': case 'ArrowRight': this.state.moveRight = true; break;
        case 'KeyE': this.interact(); break;
        case 'Escape': this.closePanels(); break;
      }
    };
    this._onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.state.moveForward = false; break;
        case 'KeyS': case 'ArrowDown': this.state.moveBackward = false; break;
        case 'KeyA': case 'ArrowLeft': this.state.moveLeft = false; break;
        case 'KeyD': case 'ArrowRight': this.state.moveRight = false; break;
      }
    };
    this._onMouseDown = (e) => {
      if (e.button === 0 && this.controls.isLocked) this.shoot();
    };
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('resize', () => this.onResize());
  }

  setupLoading() {
    const loadBar = document.getElementById('loading-bar-fill');
    let loadProg = 0;
    const loadInt = setInterval(() => {
      loadProg += 15;
      loadBar.style.width = loadProg + '%';
      if (loadProg >= 100) {
        clearInterval(loadInt);
        setTimeout(() => {
          document.getElementById('loading').style.display = 'none';
          document.getElementById('start-screen').style.display = 'flex';
        }, 300);
      }
    }, 100);

    document.getElementById('start-btn').addEventListener('click', () => {
      document.getElementById('start-screen').style.display = 'none';
      this.controls.lock();
    });
    this.controls.addEventListener('unlock', () => {
      if (!this.state.isPanelOpen) document.getElementById('start-screen').style.display = 'flex';
    });
    this.controls.addEventListener('lock', () => {
      document.getElementById('start-screen').style.display = 'none';
    });
    document.querySelectorAll('.panel-close').forEach((btn) => {
      btn.addEventListener('click', () => this.closePanels());
    });
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  start() {
    requestAnimationFrame(this._boundAnimate);
  }

  animate() {
    requestAnimationFrame(this._boundAnimate);
    const time = performance.now();
    const delta = (time - this.prevTime) / 1000;
    this.prevTime = time;

    if (this.controls.isLocked) {
      const isDiagonal = (this.state.moveForward && (this.state.moveLeft || this.state.moveRight)) ||
                         (this.state.moveBackward && (this.state.moveLeft || this.state.moveRight));
      const speed = isDiagonal ? CFG.runSpeed * 0.85 : CFG.speed;

      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, this.camera.up).normalize();

      const mx = (this.state.moveRight ? 1 : 0) - (this.state.moveLeft ? 1 : 0);
      const mz = (this.state.moveForward ? 1 : 0) - (this.state.moveBackward ? 1 : 0);
      const moveDir = new THREE.Vector3();
      moveDir.addScaledVector(forward, mz);
      moveDir.addScaledVector(right, mx);
      if (moveDir.length() > 0) moveDir.normalize();

      const dx = moveDir.x * speed * delta;
      const dz = moveDir.z * speed * delta;

      // Use pure collision resolver from core (DIP: game logic depends on core abstraction)
      resolveMove(this.camera.position, dx, dz, this.state.walls);
    }

    // Implants animation
    this.state.implants.forEach((imp) => {
      if (imp.isTV) { imp.mesh.material.opacity = 0.02 + Math.random() * 0.06; return; }
      if (imp.isCar) { imp.mesh.position.x += Math.sin(time * 0.001 * imp.speed + imp.phase) * 0.02; imp.mesh.position.z += Math.cos(time * 0.001 * imp.speed + imp.phase) * 0.01; return; }
      imp.mesh.position.y = imp.baseY + Math.sin(time * 0.002 * imp.speed + imp.phase) * 0.3;
      imp.mesh.rotation.y += delta * 0.5;
      imp.mesh.rotation.z += delta * 0.3;
    });

    // Particles
    this.state.particles.forEach((p) => {
      p.mesh.position.x += p.vx; p.mesh.position.y += p.vy; p.mesh.position.z += p.vz;
      if (p.isSteam) {
        p.life -= delta * 0.3;
        p.mesh.scale.setScalar(1 + (1 - p.life) * 2);
        p.mesh.material.opacity = p.life * 0.12;
        p.mesh.lookAt(this.camera.position);
        if (p.life <= 0 || p.mesh.position.y > 3.5) { p.mesh.position.set((Math.random() - 0.5) * 10 + (Math.abs(p.mesh.position.x) > 5 ? Math.sign(p.mesh.position.x) * 20 : 0), 0.2, (Math.random() - 0.5) * 7 + (Math.abs(p.mesh.position.z) > 3.5 ? Math.sign(p.mesh.position.z) * 20 : 0)); p.life = 1; p.mesh.scale.setScalar(1); }
      } else {
        p.life -= delta * 0.1;
        p.mesh.material.opacity = p.life * 0.6;
        if (p.life <= 0 || p.mesh.position.y > 4 || p.mesh.position.y < 0) { p.mesh.position.set((Math.random() - 0.5) * 60, Math.random() * 4, (Math.random() - 0.5) * 60); p.life = 1; }
      }
    });

    // Weapon sway
    if (this.weaponGroup) {
      this.weaponGroup.position.y = -0.5 + Math.sin(time * 0.003) * 0.02;
      this.weaponGroup.rotation.z = Math.sin(time * 0.002) * 0.02;
    }

    // Flicker lights
    this.scene.traverse((obj) => {
      if (obj.isPointLight && obj.userData.flicker) {
        obj.intensity = obj.userData.baseIntensity + Math.sin(time * obj.userData.flickerSpeed + obj.userData.flickerPhase) * 0.3;
      }
    });

    this.updatePrompt();
    this.composer.render();
  }

  shoot() {
    if (this.state.isPanelOpen) return;
    if (this.state.ammo > 0) {
      this.state.ammo--;
      document.getElementById('ammo-num').textContent = this.state.ammo;
      this.muzzleLight.intensity = 3;
      setTimeout(() => { this.muzzleLight.intensity = 0; }, 50);
      this.weaponGroup.position.z -= 0.1;
      this.weaponGroup.rotation.x += 0.15;
      setTimeout(() => { this.weaponGroup.position.z += 0.1; this.weaponGroup.rotation.x -= 0.15; }, 80);
    }
    this.interact();
  }

  interact() {
    if (this.state.isPanelOpen) return;
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObjects(this.state.interactables.map((i) => i.mesh), true);
    if (hits.length > 0 && hits[0].distance < 5) {
      const obj = this.state.interactables.find((i) => i.mesh === hits[0].object || i.mesh === hits[0].object.parent);
      if (obj) this.openPanel(obj.panelId);
    }
  }

  updatePrompt() {
    if (this.state.isPanelOpen) { document.getElementById('prompt').classList.remove('active'); return; }
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObjects(this.state.interactables.map((i) => i.mesh), true);
    const prompt = document.getElementById('prompt');
    if (hits.length > 0 && hits[0].distance < 5) {
      prompt.textContent = `[CLICK OR E] ${hits[0].object.userData.label || 'INTERACT'}`;
      prompt.classList.add('active');
    } else {
      prompt.classList.remove('active');
    }
  }

  openPanel(id) {
    this.state.isPanelOpen = true;
    this.controls.unlock();
    document.querySelectorAll('.info-panel').forEach((p) => p.classList.remove('active'));
    const panel = document.getElementById(id);
    if (panel) panel.classList.add('active');
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'none';
  }

  closePanels() {
    this.state.isPanelOpen = false;
    document.querySelectorAll('.info-panel').forEach((p) => p.classList.remove('active'));
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'block';
    this.controls.lock();
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════

export function initGame() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
  if (isMobile) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('start-screen').style.display = 'none';
    return null;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x151520);
  scene.fog = new THREE.FogExp2(0x151520, 0.012);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, CFG.playerHeight, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
  renderer.setClearColor(0x151520);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setPixelRatio(0.5); // retro pixelated look
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  document.body.appendChild(renderer.domElement);

  // Post-processing: bloom
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.4, 0.85);
  composer.addPass(bloomPass);

  const controls = new PointerLockControls(camera, document.body);

  const state = {
    moveForward: false, moveBackward: false, moveLeft: false, moveRight: false,
    velocity: new THREE.Vector3(), direction: new THREE.Vector3(),
    prevTime: performance.now(), walls: [], interactables: [], implants: [], particles: [],
    ammo: 50, isPanelOpen: false, currentRoom: 'HUB',
  };

  const game = new Game({ renderer, scene, camera, controls, state, composer });
  game.init();
  game.start();
  return game;
}
