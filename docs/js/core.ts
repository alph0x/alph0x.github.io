/**
 * @fileoverview Pure, testable core logic for the 3D room game.
 */

import { deserializeSeed } from './seed.js';

export { DEFAULT_MAT, DEFAULT_WALL_T, DEFAULT_LULU_SPAWN } from './seed.js';

// ── Types ───────────────────────────────────────────────────────

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Wall {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface MovementVector {
  x: number;
  z: number;
}

export type TimeOfDayName = 'morning' | 'afternoon' | 'night';

export interface ControlsLike {
  isLocked: boolean;
  lock(): void;
  unlock(): void;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

// ── Configuration ───────────────────────────────────────────────

export const CFG = Object.freeze({
  speed: 3.5,
  runSpeed: 6,
  playerHeight: 1.7,
  playerRadius: 0.35,
  wallH: 2.8,
  tile: 4,
});

export const COLORS = Object.freeze({
  accent: 0xe76f51,
  cyan: 0x6fa8a0,
  magenta: 0xd77a61,
  green: 0x6a994e,
  orange: 0xe9c46a,
  warm: 0xfdf6e3,
  dim: 0x8a8071,
  void: 0x2e2a23,
  panel: 0x40392e,
  metal: 0x8d8272,
  bone: 0xf3ead8,
});

// ── Default Seed (hardcoded layout) ─────────────────────────────

export const DEFAULT_SEED = 'eyJ2IjoyLCJvdXRsaW5lIjpbWy0yLjI1LC0xLjc1XSxbMi4yNSwtMS43NV0sWzIuMjUsMS43NV0sWy0yLjI1LDEuNzVdXSwiZiI6W3sidCI6ImJlZCIsInAiOlstMS4yNSwwLC0xLjA1XSwiciI6MH0seyJ0IjoibmlnaHRzdGFuZCIsInAiOlstMS45NSwwLDAuMDhdLCJyIjoxLjU3MX0seyJ0IjoicnVnIiwicCI6WzAuMTUsMC4wMSwtMC4yXSwiciI6MH0seyJ0IjoibWluaVNjaG5hdXplciIsInAiOlstMS4wNSwwLjY1NSwtMS4wNV0sInIiOjEuNTcxfSx7InQiOiJkZXNrIiwicCI6WzAuOTIsMCwtMS4zNV0sInIiOjB9LHsidCI6Im1hY0Jvb2siLCJwIjpbMC43OCwwLjgzLC0xLjMyXSwiciI6MC4xMn0seyJ0IjoiZGVza0NoYWlyIiwicCI6WzAuNzcsMCwtMC42Ml0sInIiOjMuMTl9LHsidCI6Im11ZyIsInAiOlsxLjMsMC44NTUsLTEuNDJdLCJyIjowfSx7InQiOiJib29rU3RhY2siLCJwIjpbMS41LDAuODMsLTEuNDVdLCJyIjowLjUsImN0IjozfSx7InQiOiJib29rc2hlbGYiLCJwIjpbMi4wOCwwLC0wLjU1XSwiciI6LTEuNTcxfSx7InQiOiJwbGFudCIsInAiOlsyLjAsMCwwLjM1XSwiciI6MH0seyJ0IjoiZmxvb3JMYW1wIiwicCI6Wy0xLjk1LDAsMS40XSwiciI6MH0seyJ0IjoicG9zdGVyIiwicCI6Wy0yLjIsMS41NSwtMS4wXSwiciI6MS41NzEsImNvbCI6MTUxNjczMTMsInRleHQiOiJCVUVOT1NcbkFJUkVTIn0seyJ0IjoiZmFpcnlMaWdodHMiLCJwIjpbMCwyLjUsLTEuNjhdfSx7InQiOiJzaG9lcyIsInAiOlswLjU1LDAsMS41XSwiciI6MC4zfSx7InQiOiJjZWlsaW5nTGFtcCIsInAiOlswLDIuNywwXSwiY29sIjoxNjExOTI4NCwiaSI6MiwiZHN0Ijo4fSx7InQiOiJ3aW5kb3ciLCJwIjpbMCwxLjUsLTEuODVdfSx7InQiOiJkb29yIiwicCI6WzAsMCwxLjldfV0sInBzIjpbMC41LDAuNV0sImxzIjpbLTEuMDUsLTEuMDVdLCJtYXQiOnsiZmxvb3IiOiIjZTJjMTlhIiwid2FsbCI6IiNmN2VlZGEiLCJjZWlsaW5nIjoiI2ZhZjRlOCJ9LCJkZWMiOltdfQ==';

export const ROOM_LAYOUT = { ...deserializeSeed(DEFAULT_SEED) };

// ── Vector Math (plain objects, no Three.js) ────────────────────

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

export function normalizeXZ(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x * v.x + v.z * v.z);
  if (len === 0) return vec3(0, v.y, 0);
  return vec3(v.x / len, v.y, v.z / len);
}

export function rightFromForward(forward: Vec3): Vec3 {
  return normalizeXZ({ x: -forward.z, y: 0, z: forward.x });
}

export function scale(v: Vec3, s: number): Vec3 {
  return vec3(v.x * s, v.y * s, v.z * s);
}

export function add(a: Vec3, b: Vec3): Vec3 {
  return vec3(a.x + b.x, a.y + b.y, a.z + b.z);
}

// ── Collision (pure AABB) ───────────────────────────────────────

export function checkCollision(x: number, z: number, walls: readonly Wall[], radius = CFG.playerRadius): boolean {
  for (const w of walls) {
    if (x > w.minX - radius && x < w.maxX + radius &&
        z > w.minZ - radius && z < w.maxZ + radius) {
      return true;
    }
  }
  return false;
}

export function resolveMove(pos: Vec3, dx: number, dz: number, walls: readonly Wall[]): void {
  if (!checkCollision(pos.x + dx, pos.z, walls)) {
    pos.x += dx;
  }
  if (!checkCollision(pos.x, pos.z + dz, walls)) {
    pos.z += dz;
  }
}

// ── Movement Math ───────────────────────────────────────────────

export function computeMovementVector(
  moveF: boolean,
  moveB: boolean,
  moveL: boolean,
  moveR: boolean,
  forward: Vec3
): MovementVector {
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
