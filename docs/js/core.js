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

export const DEFAULT_SEED = 'eyJ2IjoyLCJvdXRsaW5lIjpbWy0yLjI1LC0xLjc1XSxbMi4yNSwtMS43NV0sWzIuMjUsMS43NV0sWy0yLjI1LDEuNzVdXSwiZiI6W3sidCI6ImJlZCIsInAiOlstMS4xLDAsLTAuOV0sInIiOjYuMjgzfSx7InQiOiJuaWdodHN0YW5kIiwicCI6Wy0xLjksMCwwLjFdLCJyIjoxLjU3MX0seyJ0IjoiZGVzayIsInAiOlsxLjIsMCwtMS4xNV0sInIiOjYuMjg0fSx7InQiOiJtYWNCb29rIiwicCI6WzEuNiwwLjgyLC0xLjJdLCJyIjo1Ljc2fSx7InQiOiJtaW5pU2NobmF1emVyIiwicCI6Wy0wLjg1LDAuODksLTAuODVdLCJyIjo1LjM0fSx7InQiOiJjZWlsaW5nTGFtcCIsInAiOlswLDIuNywwXSwiY29sIjoxNjExOTI4NCwiaSI6MiwiZHN0Ijo4fSx7InQiOiJ3aW5kb3ciLCJwIjpbMCwxLjUsLTEuODVdfSx7InQiOiJkb29yIiwicCI6WzAsMCwxLjldfV0sInBzIjpbMC41LDAuNV0sImxzIjpbLTAuOSwtMC42NV0sIm1hdCI6eyJmbG9vciI6IiMxYzE5MTciLCJ3YWxsIjoiIzQ0NDAzYyIsImNlaWxpbmciOiIjMWMxOTE3In0sImRlYyI6W119';

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
