/**
 * @fileoverview Pure, testable core logic for the 3D room game.
 */

import { deserializeSeed } from './seed.js';

// ── Configuration ───────────────────────────────────────────────

export const CFG = Object.freeze({
  speed: 3.5,
  runSpeed: 6,
  playerHeight: 1.7,
  radius: 0.25,
  wallH: 2.8,
  tile: 4,
});

export const COLORS = Object.freeze({
  accent: 0x7c3aed,
  cyan: 0x06b6d4,
  magenta: 0xec4899,
  green: 0x10b981,
  orange: 0xf59e0b,
  warm: 0xf5f5f4,
  dim: 0x57534e,
  void: 0x0c0a09,
  panel: 0x1c1917,
  metal: 0x44403c,
  bone: 0xe7e5e4,
});

// ── Default Seed (hardcoded layout) ─────────────────────────────

export const DEFAULT_SEED = 'eyJ2IjoyLCJvdXRsaW5lIjpbWy0yLjI1LC0xLjc1XSxbMi4yNSwtMS43NV0sWzIuMjUsMS43NV0sWy0yLjI1LDEuNzVdXSwiZiI6W3sidCI6ImJlZCIsInAiOlstMS4xLDAsLTAuOTVdLCJyIjo2LjI4M30seyJ0IjoibmlnaHRzdGFuZCIsInAiOlstMS44NSwwLDAuMDVdfSx7InQiOiJkZXNrIiwicCI6WzEuMiwwLC0xLjE1XSwiciI6Ni4yODR9LHsidCI6Im1hY0Jvb2siLCJwIjpbMS4wNSwwLjgyLC0xLjRdLCJyIjo2LjU0NX0seyJ0IjoidHYiLCJwIjpbMS4zNSwxLjQsMS42NV0sInIiOjMuMTQyfSx7InQiOiJtaW5pU2NobmF1emVyIiwicCI6Wy0wLjcsMC44OSwtMC45XSwiciI6NS4zNH0seyJ0IjoiY2VpbGluZ0xhbXAiLCJwIjpbMCwyLjcsMF0sImNvbCI6MTYxMTkyODQsImkiOjIsImRzdCI6OH1dLCJwcyI6WzAuNSwwLjVdLCJscyI6Wy0wLjksLTAuNjVdLCJtYXQiOnsiZmxvb3IiOiIjMWMxOTE3Iiwid2FsbCI6IiM0NDQwM2MiLCJjZWlsaW5nIjoiIzFjMTkxNyJ9LCJkZWMiOltdfQ==';

export const ROOM_LAYOUT = deserializeSeed(DEFAULT_SEED);

// ── Vector Math (plain objects, no Three.js) ────────────────────

export function vec3(x = 0, y = 0, z = 0) {
  return { x, y, z };
}

export function normalizeXZ(v) {
  const len = Math.sqrt(v.x * v.x + v.z * v.z);
  if (len === 0) return vec3(0, v.y, 0);
  return vec3(v.x / len, v.y, v.z / len);
}

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
    isPanelOpen: false,
    currentRoom: 'HUB',
  };
}

// ── Collision (pure AABB) ───────────────────────────────────────

export function checkCollision(x, z, walls, radius = 0.35) {
  for (const w of walls) {
    if (x > w.minX - radius && x < w.maxX + radius &&
        z > w.minZ - radius && z < w.maxZ + radius) {
      return true;
    }
  }
  return false;
}

export function resolveMove(pos, dx, dz, walls) {
  if (!checkCollision(pos.x + dx, pos.z, walls)) {
    pos.x += dx;
  }
  if (!checkCollision(pos.x, pos.z + dz, walls)) {
    pos.z += dz;
  }
}

// ── Movement Math ───────────────────────────────────────────────

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
