/**
 * @fileoverview Helper to offset door/window meshes from wall centerline to interior surface.
 */

import { ROOM_LAYOUT } from '../../core.js';

/**
 * Compute interior-facing offset for a point on a polygon wall.
 * @param x — world X
 * @param z — world Z
 * @param itemDepth — depth of the item (m)
 * @returns offset in world space
 */
export function getInteriorOffset(x: number, z: number, itemDepth: number): { x: number; z: number } {
  const outline = ROOM_LAYOUT.outline;
  const wallT = ROOM_LAYOUT.wallThickness || 0.2;
  if (!outline || outline.length < 2) return { x: 0, z: 0 };

  let minDist = Infinity;
  let bestNx = 0;
  let bestNz = 0;

  for (let i = 0; i < outline.length; i++) {
    const p1 = outline[i];
    const p2 = outline[(i + 1) % outline.length];
    const dx = p2[0] - p1[0];
    const dz = p2[1] - p1[1];
    const len2 = dx * dx + dz * dz;
    if (len2 < 1e-6) continue;
    const t = Math.max(0, Math.min(1, ((x - p1[0]) * dx + (z - p1[1]) * dz) / len2));
    const projX = p1[0] + t * dx;
    const projZ = p1[1] + t * dz;
    const dist = Math.hypot(x - projX, z - projZ);
    if (dist < minDist) {
      minDist = dist;
      const len = Math.sqrt(len2);
      // Outward normal for CCW polygon is (dz, -dx)
      bestNx = dz / len;
      bestNz = -dx / len;
    }
  }

  const total = wallT / 2 + itemDepth / 2;
  return { x: -bestNx * total, z: -bestNz * total };
}
