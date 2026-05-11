/**
 * @fileoverview Pure utility functions for the Room Layout Editor.
 * Extracted to enable unit testing without DOM / Three.js scene side effects.
 */

import * as THREE from 'three';

export function snap(v, gridSize = 0.05) {
  return Math.round(v / gridSize) * gridSize;
}

export function hexToInt(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

export function extractMeshFromResult(result) {
  if (result && result.mesh) return result.mesh;
  if (Array.isArray(result) && result[0]) return result[0];
  if (result instanceof THREE.Mesh || result instanceof THREE.Group) return result;
  return null;
}

export function buildPolygonShape(outline) {
  const shape = new THREE.Shape();
  shape.moveTo(outline[0][0], outline[0][1]);
  for (let i = 1; i < outline.length; i++) {
    shape.lineTo(outline[i][0], outline[i][1]);
  }
  shape.closePath();
  return shape;
}

export function getClosestEdgePoint(point, outline) {
  let best = null;
  let bestDist = Infinity;
  for (let i = 0; i < outline.length; i++) {
    const p1 = new THREE.Vector3(outline[i][0], 0, outline[i][1]);
    const p2 = new THREE.Vector3(outline[(i + 1) % outline.length][0], 0, outline[(i + 1) % outline.length][1]);
    const closest = new THREE.Vector3();
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    if (len < 0.001) continue;
    dir.normalize();
    const t = Math.max(0, Math.min(len, new THREE.Vector3().subVectors(point, p1).dot(dir)));
    closest.copy(p1).add(dir.clone().multiplyScalar(t));
    const d = point.distanceTo(closest);
    if (d < bestDist) {
      bestDist = d;
      best = { index: i, point: [closest.x, closest.z] };
    }
  }
  return best && bestDist < 0.5 ? best : null;
}

export function fitMeshToPreview(mesh, targetSize = 1.2) {
  const box = new THREE.Box3().setFromObject(mesh);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? targetSize / maxDim : 1;
  mesh.scale.setScalar(scale);
  mesh.position.sub(center.clone().multiplyScalar(scale));
  mesh.position.y += (size.y * scale) / 2;
}

export function normalizeRotation(rad) {
  const twoPi = Math.PI * 2;
  return ((rad % twoPi) + twoPi) % twoPi;
}

/**
 * Map architectural openings (doors/windows) to a specific wall edge.
 * @param {Array<{x:number,z:number,width:number,height:number,bottom:number}>} openings
 * @param {Array<number>} p1 — edge start [x, z]
 * @param {Array<number>} p2 — edge end [x, z]
 * @param {number} wallT — wall thickness
 * @returns {Array<{t:number,width:number,height:number,bottom:number}>} openings projected onto the edge, sorted by distance from p1.
 */
export function getEdgeOpenings(openings, p1, p2, wallT) {
  const dx = p2[0] - p1[0];
  const dz = p2[1] - p1[1];
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 0.01) return [];

  const result = [];
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
  return result.sort((a, b) => a.t - b.t);
}

// ── Polygon validation ──────────────────────────────────────────

function orientation(p, q, r) {
  const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
  if (Math.abs(val) < 1e-9) return 0;
  return val > 0 ? 1 : 2;
}

function onSegment(p, q, r) {
  return (
    q[0] <= Math.max(p[0], r[0]) + 1e-9 &&
    q[0] >= Math.min(p[0], r[0]) - 1e-9 &&
    q[1] <= Math.max(p[1], r[1]) + 1e-9 &&
    q[1] >= Math.min(p[1], r[1]) - 1e-9
  );
}

function segmentsIntersect(p1, p2, p3, p4) {
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
 * Extract architectural openings (doors/windows) from placed furniture list.
 * Pure function — no side effects.
 */
/**
 * Calculate the structural bounding box of a furniture mesh for wall-opening purposes.
 * Excludes decorative/parallax children (e.g. cityscape backdrops).
 * Operates on a zeroed clone so rotation/position of the wrapper don't distort sizes.
 */
export function calculateMeshOpeningDims(mesh) {
  const clone = mesh.clone();
  clone.position.set(0, 0, 0);
  clone.rotation.set(0, 0, 0);
  clone.scale.set(1, 1, 1);

  const box = new THREE.Box3();
  clone.traverse((child) => {
    if (child.userData?._parallax) return;
    if (child.isMesh && child.geometry) {
      box.expandByObject(child);
    }
  });

  const size = new THREE.Vector3();
  box.getSize(size);

  return {
    width: size.x,
    height: size.y,
    bottomOffset: box.min.y,
  };
}

/**
 * Extract architectural openings (doors/windows) from placed furniture list.
 * Dimensions are read from the cached _openingDims config when available;
 * otherwise computed dynamically from the mesh bounding box.
 * Pure function — no side effects.
 */
export function getCurrentOpenings(placed) {
  return placed
    .filter((p) => p.type === 'door' || p.type === 'window')
    .map((p) => {
      const dims = p.config?._openingDims || (p.mesh ? calculateMeshOpeningDims(p.mesh) : null);
      const width = dims?.width ?? (p.type === 'door' ? 1.6 : 2.0);
      const height = dims?.height ?? (p.type === 'door' ? 2.3 : 1.3);
      const bottomOffset = dims?.bottomOffset ?? 0;
      return {
        x: p.config.position[0],
        z: p.config.position[2],
        width,
        height,
        bottom: p.config.position[1] + bottomOffset,
      };
    });
}

/**
 * Count how many edges of an outline are axis-parallel (horizontal or vertical).
 * Pure function — no side effects.
 */
export function countAxisParallel(outline, epsilon = 0.01) {
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
export function calculateRoomDimensions(outline) {
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
export function formatExportOutput(seed) {
  return [
    `// ── Seed (copy this into core.js as DEFAULT_SEED) ─────────────`,
    `export const DEFAULT_SEED = '${seed}';`,
    ``,
    `// ── Or load dynamically ────────────────────────────────────────`,
    `import { deserializeSeed } from './seed.js';`,
    `export const ROOM_LAYOUT = deserializeSeed(DEFAULT_SEED);`,
  ].join('\n');
}

export function isSelfIntersecting(outline) {
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
