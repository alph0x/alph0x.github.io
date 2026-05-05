/**
 * @fileoverview Pure, testable core logic for the 3D apartment game.
 *
 * ARCHITECTURAL DECISIONS (fundamented theoretically):
 *
 * 1. SINGLE RESPONSIBILITY PRINCIPLE (SRP):
 *    Robert C. Martin defines SRP as "A module should be responsible to one,
 *    and only one, actor." This file is owned by the "game physics & rules"
 *    actor. It knows nothing about Three.js rendering, DOM manipulation, or
 *    asset creation. Any change in collision algorithms or movement math
 *    touches only this file.
 *
 * 2. DEPENDENCY INVERSION PRINCIPLE (DIP):
 *    High-level modules (game logic) should not depend on low-level modules
 *    (Three.js vectors). We use plain JS objects {x, y, z} instead of
 *    THREE.Vector3 in this domain. The rendering layer adapts to these
 *    abstractions, not the other way around.
 *
 * 3. CLEAN CODE — Pure Functions:
 *    Every exported function is pure (no side effects, same input → same output).
 *    This makes them trivially unit-testable without mocks.
 */

// ── Configuration ───────────────────────────────────────────────

export const CFG = Object.freeze({
  speed: 10,
  runSpeed: 18,
  playerHeight: 1.7,
  radius: 0.5,
  wallH: 3.5,
  tile: 4,
});

export const COLORS = Object.freeze({
  cyber: 0xfcee0a,
  magenta: 0xff003c,
  cyan: 0x00f0ff,
  green: 0x00ff88,
  orange: 0xff6b00,
  bone: 0xe8e8f0,
  dim: 0x4a4a60,
  void: 0x08080c,
  panel: 0x11111a,
  metal: 0x2a2a3a,
});

// ── Vector Math (plain objects, no Three.js) ────────────────────

/** @returns {{x:number,y:number,z:number}} */
export function vec3(x = 0, y = 0, z = 0) {
  return { x, y, z };
}

export function normalizeXZ(v) {
  const len = Math.sqrt(v.x * v.x + v.z * v.z);
  if (len === 0) return vec3(0, v.y, 0);
  return vec3(v.x / len, v.y, v.z / len);
}

/**
 * Cross product of forward × up(0,1,0) = (-fz, 0, fx)
 * This gives the right-vector in the XZ plane.
 */
export function rightFromForward(forward) {
  return normalizeXZ({ x: -forward.z, y: 0, z: forward.x });
}

export function scale(v, s) {
  return vec3(v.x * s, v.y * s, v.z * s);
}

export function add(a, b) {
  return vec3(a.x + b.x, a.y + b.y, a.z + b.z);
}

// ── State Factory ───────────────────────────────────────────────

/**
 * Factory function instead of global variables.
 * Rationale (Clean Code): "There is hardly anything more global than a global
 * variable." — R.C. Martin. A factory lets us reset state and test in isolation.
 */
export function createGameState() {
  return {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    velocity: vec3(),
    direction: vec3(),
    prevTime: 0,
    walls: [],
    interactables: [],
    implants: [],
    particles: [],
    ammo: 50,
    isPanelOpen: false,
    currentRoom: 'HUB',
  };
}

// ── Collision (pure AABB) ───────────────────────────────────────

/**
 * @typedef {Object} Wall
 * @property {number} minX
 * @property {number} maxX
 * @property {number} minZ
 * @property {number} maxZ
 */

/**
 * Checks point-in-rectangle collision against a list of walls.
 *
 * @param {number} x
 * @param {number} z
 * @param {Wall[]} walls
 * @returns {boolean}
 */
export function checkCollision(x, z, walls, radius = 0.35) {
  for (const w of walls) {
    if (x > w.minX - radius && x < w.maxX + radius &&
        z > w.minZ - radius && z < w.maxZ + radius) {
      return true;
    }
  }
  return false;
}

/**
 * Resolves movement by sliding along each axis independently.
 *
 * Decision: Separate X and Z resolution.
 * Rationale (Game Programming Patterns / Clean Code): Moving diagonally into
 * a corner with combined-vector collision causes the player to get stuck
 * ("corner snag"). Sliding along each axis independently is the standard FPS
 * solution and keeps the function under 10 lines.
 *
 * @param {{x:number,z:number}} pos — mutated
 * @param {number} dx
 * @param {number} dz
 * @param {Wall[]} walls
 */
export function resolveMove(pos, dx, dz, walls) {
  if (!checkCollision(pos.x + dx, pos.z, walls)) {
    pos.x += dx;
  }
  if (!checkCollision(pos.x, pos.z + dz, walls)) {
    pos.z += dz;
  }
}

// ── Movement Math ───────────────────────────────────────────────

/**
 * Computes camera-relative movement vector from input flags.
 *
 * @param {boolean} moveF
 * @param {boolean} moveB
 * @param {boolean} moveL
 * @param {boolean} moveR
 * @param {{x:number,y:number,z:number}} forward — camera forward vector (XZ-plane)
 * @returns {{x:number,z:number}} normalized movement delta
 */
export function computeMovementVector(moveF, moveB, moveL, moveR, forward) {
  const right = rightFromForward(forward);
  const mx = (moveR ? 1 : 0) - (moveL ? 1 : 0);
  const mz = (moveF ? 1 : 0) - (moveB ? 1 : 0);

  let dx = forward.x * mz + right.x * mx;
  let dz = forward.z * mz + right.z * mx;

  const len = Math.sqrt(dx * dx + dz * dz);
  if (len > 0) {
    dx /= len;
    dz /= len;
  }
  return { x: dx, z: dz };
}

// ── Layout Declaration (OCP-friendly) ───────────────────────────

/**
 * Declarative room layout.
 *
 * Decision: Data-driven layout instead of imperative buildLevel() calls.
 * Rationale (SOLID — Open/Closed Principle): To add a new piece of furniture
 * you append an entry here and register its builder in the FurnitureRegistry.
 * You do NOT modify the RoomBuilder logic.
 */
export const ROOM_LAYOUT = Object.freeze({
  width: 10,
  depth: 7,
  wallThickness: 0.3,
  furniture: [
    // Bedroom area (NW corner)
    { type: 'bed', position: [-3, 0, -2], rotation: Math.PI / 2 },
    { type: 'nightstand', position: [-3.8, 0, -0.8] },
    // Desk area (NE corner)
    { type: 'desk', position: [3, 0, -2.5], rotation: Math.PI, panelId: 'panel-profile' },
    { type: 'deskChair', position: [3, 0, -1.4], rotation: Math.PI },
    // Living area (center-S)
    { type: 'sofa', position: [0.5, 0, 1.5], rotation: -Math.PI / 2 },
    { type: 'coffeeTable', position: [0.5, 0, 0.3] },
    { type: 'rug', position: [0.5, 0.01, 0.8] },
    { type: 'floorLamp', position: [-0.5, 0, 2] },
    // Kitchen (SE corner, small)
    { type: 'kitchen', position: [3.5, 0, 2.5] },
    { type: 'fridge', position: [4, 0, 2.5], rotation: -Math.PI / 2 },
    // Bathroom (SW corner)
    { type: 'bathroom', position: [-3.5, 0, 3] },
    { type: 'mirror', position: [-3, 1.5, 3.35], rotation: Math.PI },
    // Storage
    { type: 'bookshelf', position: [4, 0, -2.5], rotation: Math.PI / 2 },
    { type: 'server', position: [-1, 0, -3], rotation: Math.PI / 4 },
    // Clutter / details
    { type: 'boxStack', position: [3.8, 0, -1] },
    { type: 'boxStack', position: [-4, 0, 0.5] },
    { type: 'plant', position: [-4.2, 0, 2] },
    { type: 'trash', position: [2, 0, 0.5] },
    // V's apartment — lived-in clutter
    { type: 'can', position: [3.1, 0.82, -2.3], color: 0xcc3333 },
    { type: 'bottle', position: [-3.2, 0, -0.5], color: 0x557733 },
    { type: 'bookStack', position: [-3.8, 0.5, -0.8], count: 3 },
    { type: 'shoes', position: [0, 0, 3.2], rotation: Math.PI / 2 },
    { type: 'clothes', position: [-3, 0, 2.5], color: 0x553333 },
    { type: 'gun', position: [2.8, 0.82, -2.2], rotation: Math.PI / 4 },
    { type: 'mug', position: [0.5, 0.42, 0.3] },
    { type: 'paper', position: [-0.5, 0, -2.5], count: 2 },
    { type: 'can', position: [0, 0, 1], color: 0x3355cc },
    { type: 'bottle', position: [3.2, 0, 2], color: 0x773355 },
    { type: 'paper', position: [-3, 0, 2.8], count: 3 },
    // Ceiling lights — dramatic, fewer
    { type: 'ceilingLamp', position: [0, 3.3, 0], color: 0xffcc88, intensity: 3, distance: 10 },
    { type: 'ceilingLamp', position: [3, 3.3, -2], color: 0xffcc88, intensity: 2, distance: 8 },
  ],
  decorations: [
    // Neon
    { type: 'neonSign', position: [-4.5, 2.6, 0], text: 'ALPH0X', color: COLORS.magenta },
    { type: 'neonSign', position: [0, 2.8, -3.35], text: 'NIGHT CITY', color: COLORS.cyan },
    // Posters — many, scattered
    { type: 'poster', position: [-4.85, 2.0, -1], text: 'SAMURAI', color: COLORS.magenta },
    { type: 'poster', position: [-4.85, 2.0, 1], text: 'CHOOH2', color: COLORS.orange },
    { type: 'poster', position: [4.85, 2.0, -1.5], text: 'ARASAKA', color: COLORS.cyan },
    { type: 'poster', position: [4.85, 2.0, 1.5], text: 'MILITECH', color: COLORS.green },
    { type: 'poster', position: [0, 2.0, -3.35], text: 'NEON', color: COLORS.cyan },
    { type: 'poster', position: [2, 1.5, 3.35], text: 'Kiroshi', color: COLORS.magenta },
    // Fairy lights on window
    { type: 'fairyLights', position: [0, 2.5, -3.35] },
    // Steam from bathroom/kitchen
    { type: 'steam', position: [-3.5, 0, 3] },
    { type: 'steam', position: [-3.2, 0, 3.2] },
    { type: 'steam', position: [3.5, 0, 2.5] },
  ],
});
