/**
 * @fileoverview Pure utility functions for the Room Layout Editor.
 * Extracted to enable unit testing without DOM / Three.js scene side effects.
 */

import type * as THREE from 'three';
import type { OpeningDims } from './primitives.js';

export function snap(v: number, gridSize = 0.05): number {
  return Math.round(v / gridSize) * gridSize;
}

export function normalizeRotation(rad: number): number {
  const twoPi = Math.PI * 2;
  return ((rad % twoPi) + twoPi) % twoPi;
}

export interface Opening {
  x: number;
  z: number;
  width: number;
  height: number;
  bottom: number;
  t?: number;
}

/**
 * Map architectural openings (doors/windows) to a specific wall edge.
 * @param openings — list of openings
 * @param p1 — edge start [x, z]
 * @param p2 — edge end [x, z]
 * @param wallT — wall thickness
 * @returns openings projected onto the edge, sorted by distance from p1.
 */
export function getEdgeOpenings(
  openings: Opening[],
  p1: [number, number],
  p2: [number, number],
  wallT: number
): Opening[] {
  const dx = p2[0] - p1[0];
  const dz = p2[1] - p1[1];
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 0.01) return [];

  const result: Opening[] = [];
  for (const o of openings) {
    const px = o.x - p1[0];
    const pz = o.z - p1[1];
    const t = (px * dx + pz * dz) / len;
    const cross = px * dz - pz * dx;
    const perpDist = Math.abs(cross) / len;

    if (perpDist <= wallT / 2 + 0.15 && t >= -0.2 && t <= len + 0.2) {
      result.push({ ...o, t: Math.max(0, Math.min(len, t)) });
    }
  }
  return result.sort((a, b) => (a.t ?? 0) - (b.t ?? 0));
}

// ── Polygon validation ──────────────────────────────────────────

function orientation(p: [number, number], q: [number, number], r: [number, number]): number {
  const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
  if (Math.abs(val) < 1e-9) return 0;
  return val > 0 ? 1 : 2;
}

function onSegment(p: [number, number], q: [number, number], r: [number, number]): boolean {
  return (
    q[0] <= Math.max(p[0], r[0]) + 1e-9 &&
    q[0] >= Math.min(p[0], r[0]) - 1e-9 &&
    q[1] <= Math.max(p[1], r[1]) + 1e-9 &&
    q[1] >= Math.min(p[1], r[1]) - 1e-9
  );
}

function segmentsIntersect(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number]
): boolean {
  const o1 = orientation(p1, p2, p3);
  const o2 = orientation(p1, p2, p4);
  const o3 = orientation(p3, p4, p1);
  const o4 = orientation(p3, p4, p2);

  if (o1 !== o2 && o3 !== o4) return true;

  if (o1 === 0 && onSegment(p1, p3, p2)) return true;
  if (o2 === 0 && onSegment(p1, p4, p2)) return true;
  if (o3 === 0 && onSegment(p3, p1, p4)) return true;
  if (o4 === 0 && onSegment(p3, p2, p4)) return true;

  return false;
}


/**
 * Count how many edges of an outline are axis-parallel (horizontal or vertical).
 * Pure function — no side effects.
 */
export function countAxisParallel(outline: [number, number][], epsilon = 0.01): number {
  let count = 0;
  for (let i = 0; i < outline.length; i++) {
    const p1 = outline[i];
    const p2 = outline[(i + 1) % outline.length];
    if (Math.abs(p1[0] - p2[0]) < epsilon || Math.abs(p1[1] - p2[1]) < epsilon) {
      count++;
    }
  }
  return count;
}

/**
 * Calculate room width, depth, and edge count from an outline.
 * Pure function — no side effects.
 */
export function calculateRoomDimensions(outline: [number, number][]): { width: number; depth: number; totalEdges: number } {
  const xs = outline.map((v) => v[0]);
  const zs = outline.map((v) => v[1]);
  const width = Math.max(...xs) - Math.min(...xs);
  const depth = Math.max(...zs) - Math.min(...zs);
  return {
    width,
    depth,
    totalEdges: outline.length,
  };
}

/**
 * Format export string from a serialized seed.
 * Pure function — no side effects.
 */
export function formatExportOutput(seed: string): string {
  return [
    `// ── Seed (copy this into core.js as DEFAULT_SEED) ─────────────`,
    `export const DEFAULT_SEED = '${seed}';`,
    ``,
    `// ── Or load dynamically ────────────────────────────────────────`,
    `import { deserializeSeed } from './seed.js';`,
    `export const ROOM_LAYOUT = deserializeSeed(DEFAULT_SEED);`,
  ].join('\n');
}

export function isSelfIntersecting(outline: [number, number][]): boolean {
  const n = outline.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i++) {
    const p1 = outline[i];
    const p2 = outline[(i + 1) % n];
    for (let j = i + 1; j < n; j++) {
      const p3 = outline[j];
      const p4 = outline[(j + 1) % n];

      // Skip adjacent edges (share a vertex)
      if ((i + 1) % n === j) continue;
      if ((j + 1) % n === i) continue;

      if (segmentsIntersect(p1, p2, p3, p4)) {
        return true;
      }
    }
  }
  return false;
}
