/**
 * @fileoverview Tests for editor pure utility functions.
 *
 * Decision: Extract geometry/config helpers to editor-utils.js so they can be
 * tested without a DOM, renderer, or global scene state.
 * Rationale (SRP / DIP): Each function has a single responsibility and receives
 * all dependencies via parameters (outline, mesh, result) rather than closures.
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  snap,
  extractMeshFromResult,
  buildPolygonShape,
  getClosestEdgePoint,
  fitMeshToPreview,
  normalizeRotation,
  getEdgeOpenings,
  getCurrentOpenings,
  calculateMeshOpeningDims,
  calculateRoomDimensions,
  countAxisParallel,
  formatExportOutput,
} from '../docs/js/editor-utils.js';
import { extractMeshFromResult, buildPolygonShape, getClosestEdgePoint, fitMeshToPreview, calculateMeshOpeningDims, getCurrentOpenings } from '../docs/js/primitives.js';

// ── snap ────────────────────────────────────────────────────────

describe('snap', () => {
  it('rounds to default 0.05 grid', () => {
    expect(snap(0.03)).toBe(0.05);
    expect(snap(0.07)).toBe(0.05);
    expect(snap(0.08)).toBe(0.1);
    expect(snap(0.12)).toBe(0.1);
  });

  it('rounds to custom grid size', () => {
    expect(snap(0.3, 0.5)).toBe(0.5);
    expect(snap(0.2, 0.5)).toBe(0);
    expect(snap(1.3, 1.0)).toBe(1.0);
  });

  it('handles negative values', () => {
    expect(snap(-0.03)).toBe(-0.05);
    expect(snap(-0.07)).toBe(-0.05);
    expect(snap(-0.13, 0.1)).toBe(-0.1);
  });

  it('returns zero for zero input', () => {
    expect(snap(0)).toBe(0);
  });
});

// ── extractMeshFromResult ───────────────────────────────────────

describe('extractMeshFromResult', () => {
  it('extracts mesh from { mesh } object', () => {
    const mesh = new THREE.Mesh();
    expect(extractMeshFromResult({ mesh })).toBe(mesh);
  });

  it('extracts mesh from [mesh, meta] array', () => {
    const mesh = new THREE.Mesh();
    expect(extractMeshFromResult([mesh, { foo: 1 }])).toBe(mesh);
  });

  it('extracts raw Mesh', () => {
    const mesh = new THREE.Mesh();
    expect(extractMeshFromResult(mesh)).toBe(mesh);
  });

  it('extracts raw Group', () => {
    const group = new THREE.Group();
    expect(extractMeshFromResult(group)).toBe(group);
  });

  it('returns null for invalid results', () => {
    expect(extractMeshFromResult(null)).toBeNull();
    expect(extractMeshFromResult(undefined)).toBeNull();
    expect(extractMeshFromResult('string')).toBeNull();
    expect(extractMeshFromResult([])).toBeNull();
    expect(extractMeshFromResult({})).toBeNull();
  });
});

// ── buildPolygonShape ───────────────────────────────────────────

describe('buildPolygonShape', () => {
  it('creates a Shape from rectangular outline', () => {
    const outline = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    const shape = buildPolygonShape(outline);
    expect(shape).toBeInstanceOf(THREE.Shape);
  });

  it('creates a Shape from triangular outline', () => {
    const outline = [[0, 0], [2, 0], [1, 2]];
    const shape = buildPolygonShape(outline);
    expect(shape).toBeInstanceOf(THREE.Shape);
  });
});

// ── getClosestEdgePoint ─────────────────────────────────────────

describe('getClosestEdgePoint', () => {
  const outline = [[-2, -1], [2, -1], [2, 1], [-2, 1]];

  it('finds closest point on a horizontal edge', () => {
    const point = new THREE.Vector3(0, 0, -1.2);
    const result = getClosestEdgePoint(point, outline);
    expect(result).not.toBeNull();
    expect(result.index).toBe(0);
    expect(result.point[0]).toBeCloseTo(0);
    expect(result.point[1]).toBeCloseTo(-1);
  });

  it('finds closest point on a vertical edge', () => {
    const point = new THREE.Vector3(2.2, 0, 0);
    const result = getClosestEdgePoint(point, outline);
    expect(result).not.toBeNull();
    expect(result.index).toBe(1);
    expect(result.point[0]).toBeCloseTo(2);
    expect(result.point[1]).toBeCloseTo(0);
  });

  it('returns null when too far from all edges', () => {
    const point = new THREE.Vector3(100, 0, 100);
    const result = getClosestEdgePoint(point, outline);
    expect(result).toBeNull();
  });

  it('clamps projection to segment endpoints', () => {
    const point = new THREE.Vector3(-2.3, 0, -1);
    const result = getClosestEdgePoint(point, outline);
    expect(result).not.toBeNull();
    expect(result.point[0]).toBeCloseTo(-2);
    expect(result.point[1]).toBeCloseTo(-1);
  });

  it('finds closest point inside the polygon', () => {
    const point = new THREE.Vector3(0, 0, -0.7); // slightly inside, closer to bottom edge
    const result = getClosestEdgePoint(point, outline);
    expect(result).not.toBeNull();
    expect(result.point[0]).toBeCloseTo(0);
    expect(result.point[1]).toBeCloseTo(-1);
  });

  it('handles degenerate edges gracefully', () => {
    const badOutline = [[0, 0], [0, 0], [1, 1]];
    const point = new THREE.Vector3(0.5, 0, 0.5);
    const result = getClosestEdgePoint(point, badOutline);
    expect(result).not.toBeNull();
  });
});

// ── fitMeshToPreview ────────────────────────────────────────────

describe('fitMeshToPreview', () => {
  it('scales a large mesh down to target size', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10));
    fitMeshToPreview(mesh, 2);
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    expect(Math.max(size.x, size.y, size.z)).toBeCloseTo(2);
  });

  it('scales a small mesh up to target size', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1));
    fitMeshToPreview(mesh, 1);
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    expect(Math.max(size.x, size.y, size.z)).toBeCloseTo(1);
  });

  it('centers mesh and lifts to sit on ground plane', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2));
    mesh.position.set(0, 0, 0);
    fitMeshToPreview(mesh, 2);
    // BoxGeometry(2,4,2) is centered at origin, so center = (0,0,0)
    // scale = 2/4 = 0.5, size.y = 4
    // position.y = 0 + (4 * 0.5) / 2 = 1
    expect(mesh.position.y).toBeCloseTo(1, 1);
  });

  it('does not crash on zero-size mesh', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0, 0, 0));
    expect(() => fitMeshToPreview(mesh, 1)).not.toThrow();
  });
});

// ── getEdgeOpenings ─────────────────────────────────────────────

describe('getEdgeOpenings', () => {
  const wallT = 0.2;

  it('returns empty array when no openings provided', () => {
    const p1 = [0, 0];
    const p2 = [4, 0];
    expect(getEdgeOpenings([], p1, p2, wallT)).toEqual([]);
  });

  it('maps a door centered on the edge', () => {
    const p1 = [0, 0];
    const p2 = [4, 0];
    const openings = [{ x: 2, z: 0, width: 1.6, height: 2.3, bottom: 0 }];
    const result = getEdgeOpenings(openings, p1, p2, wallT);
    expect(result.length).toBe(1);
    expect(result[0].t).toBeCloseTo(2, 1);
    expect(result[0].width).toBe(1.6);
  });

  it('excludes opening that is too far from the edge', () => {
    const p1 = [0, 0];
    const p2 = [4, 0];
    const openings = [{ x: 2, z: 2, width: 1.6, height: 2.3, bottom: 0 }];
    expect(getEdgeOpenings(openings, p1, p2, wallT)).toEqual([]);
  });

  it('sorts multiple openings by distance along edge', () => {
    const p1 = [0, 0];
    const p2 = [10, 0];
    const openings = [
      { x: 8, z: 0, width: 1.6, height: 2.3, bottom: 0 },
      { x: 2, z: 0, width: 2.0, height: 1.3, bottom: 1.5 },
    ];
    const result = getEdgeOpenings(openings, p1, p2, wallT);
    expect(result.length).toBe(2);
    expect(result[0].t).toBeCloseTo(2, 1);
    expect(result[1].t).toBeCloseTo(8, 1);
  });

  it('clips t to edge bounds when opening is slightly beyond', () => {
    const p1 = [0, 0];
    const p2 = [4, 0];
    const openings = [{ x: -0.1, z: 0, width: 1.6, height: 2.3, bottom: 0 }];
    const result = getEdgeOpenings(openings, p1, p2, wallT);
    expect(result.length).toBe(1);
    expect(result[0].t).toBe(0);
  });
});

// ── calculateMeshOpeningDims ────────────────────────────────────

describe('calculateMeshOpeningDims', () => {
  it('measures a simple box mesh', () => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.2)));
    group.position.set(5, 1, 7); // wrapper offset should be ignored
    const dims = calculateMeshOpeningDims(group);
    expect(dims.width).toBeCloseTo(2, 1);
    expect(dims.height).toBeCloseTo(3, 1);
    expect(dims.bottomOffset).toBeCloseTo(-1.5, 1); // box centered at origin
  });

  it('excludes parallax children', () => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1)));
    const cityscape = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100));
    cityscape.userData._parallax = true;
    group.add(cityscape);
    const dims = calculateMeshOpeningDims(group);
    expect(dims.width).toBeCloseTo(1, 1);
    expect(dims.height).toBeCloseTo(2, 1);
  });

  it('excludes descendants of a parallax group', () => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1)));
    const cityscape = new THREE.Group();
    cityscape.userData._parallax = true;
    cityscape.add(new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100)));
    cityscape.add(new THREE.Mesh(new THREE.BoxGeometry(200, 200, 200)));
    group.add(cityscape);
    const dims = calculateMeshOpeningDims(group);
    expect(dims.width).toBeCloseTo(1, 1);
    expect(dims.height).toBeCloseTo(2, 1);
  });
});

// ── getCurrentOpenings ──────────────────────────────────────────

describe('getCurrentOpenings', () => {
  it('returns empty array when no placed items', () => {
    expect(getCurrentOpenings([])).toEqual([]);
  });

  it('filters out non-opening furniture', () => {
    const placed = [
      { type: 'desk', config: { position: [1, 0, 2] } },
      { type: 'chair', config: { position: [3, 0, 4] } },
    ];
    expect(getCurrentOpenings(placed)).toEqual([]);
  });

  it('uses cached _openingDims from config when available', () => {
    const placed = [
      {
        type: 'window',
        config: { position: [0, 1.2, 3], _openingDims: { width: 1.95, height: 1.28, bottomOffset: -0.64 } },
      },
    ];
    const result = getCurrentOpenings(placed);
    expect(result.length).toBe(1);
    expect(result[0].x).toBe(0);
    expect(result[0].z).toBe(3);
    expect(result[0].width).toBeCloseTo(1.95, 2);
    expect(result[0].height).toBeCloseTo(1.28, 2);
    expect(result[0].bottom).toBeCloseTo(0.56, 2);
  });

  it('falls back to hardcoded defaults when no mesh or dims exist', () => {
    const placed = [
      { type: 'door', config: { position: [1.5, 0, 2.5] } },
    ];
    expect(getCurrentOpenings(placed)).toEqual([
      { x: 1.5, z: 2.5, width: 1.6, height: 2.3, bottom: 0 },
    ]);
  });

  it('computes dims dynamically from mesh when no cache exists', () => {
    const mesh = new THREE.Group();
    mesh.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.0, 0.1)));
    mesh.position.set(0, 0.5, 0);
    const placed = [
      { type: 'door', config: { position: [0, 0.5, 0] }, mesh },
    ];
    const result = getCurrentOpenings(placed);
    expect(result.length).toBe(1);
    expect(result[0].width).toBeCloseTo(1.5, 1);
    expect(result[0].height).toBeCloseTo(2.0, 1);
    expect(result[0].bottom).toBeCloseTo(-0.5, 1); // 0.5 + (-1.0) where bottomOffset = -1.0
  });

  it('mixes doors and windows, skipping furniture', () => {
    const placed = [
      { type: 'door', config: { position: [0, 0, 0], _openingDims: { width: 1.55, height: 2.28, bottomOffset: 0 } } },
      { type: 'sofa', config: { position: [1, 0, 1] } },
      { type: 'window', config: { position: [2, 0.8, 2], _openingDims: { width: 1.95, height: 1.28, bottomOffset: -0.64 } } },
    ];
    const result = getCurrentOpenings(placed);
    expect(result.length).toBe(2);
    expect(result[0].width).toBeCloseTo(1.55, 2);
    expect(result[0].height).toBeCloseTo(2.28, 2);
    expect(result[0].bottom).toBeCloseTo(0, 2);
    expect(result[1].width).toBeCloseTo(1.95, 2);
    expect(result[1].height).toBeCloseTo(1.28, 2);
    expect(result[1].bottom).toBeCloseTo(0.16, 2);
  });
});

// ── calculateRoomDimensions ─────────────────────────────────────

describe('calculateRoomDimensions', () => {
  it('calculates width and depth for a rectangle', () => {
    const outline = [[-2, -1], [2, -1], [2, 1], [-2, 1]];
    expect(calculateRoomDimensions(outline)).toEqual({
      width: 4,
      depth: 2,
      totalEdges: 4,
    });
  });

  it('calculates for an L-shaped room', () => {
    const outline = [[0, 0], [3, 0], [3, 2], [1, 2], [1, 3], [0, 3]];
    expect(calculateRoomDimensions(outline)).toEqual({
      width: 3,
      depth: 3,
      totalEdges: 6,
    });
  });

  it('handles negative-only coordinates', () => {
    const outline = [[-5, -3], [-1, -3], [-1, -1], [-5, -1]];
    expect(calculateRoomDimensions(outline)).toEqual({
      width: 4,
      depth: 2,
      totalEdges: 4,
    });
  });

  it('returns zero for single-point outline', () => {
    const outline = [[0, 0]];
    expect(calculateRoomDimensions(outline)).toEqual({
      width: 0,
      depth: 0,
      totalEdges: 1,
    });
  });
});

// ── countAxisParallel ───────────────────────────────────────────

describe('countAxisParallel', () => {
  it('counts all edges as parallel for a rectangle', () => {
    const outline = [[-2, -1], [2, -1], [2, 1], [-2, 1]];
    expect(countAxisParallel(outline)).toBe(4);
  });

  it('counts zero for a diamond', () => {
    const outline = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    expect(countAxisParallel(outline)).toBe(0);
  });

  it('counts mixed parallel and diagonal', () => {
    const outline = [[0, 0], [2, 0], [2, 2], [1, 3], [0, 2]];
    // edges: (0,0)->(2,0) parallel, (2,0)->(2,2) parallel,
    //        (2,2)->(1,3) diagonal, (1,3)->(0,2) diagonal, (0,2)->(0,0) parallel
    expect(countAxisParallel(outline)).toBe(3);
  });

  it('uses custom epsilon', () => {
    const outline = [[0, 0], [2, 0.005], [2, 2], [0, 2]];
    expect(countAxisParallel(outline, 0.01)).toBe(4);
    // With epsilon 0.001, only the nearly-horizontal top edge [2,2]->[0,2] (dz=0)
    // and the two vertical edges are axis-parallel; [0,0]->[2,0.005] is not.
    expect(countAxisParallel(outline, 0.001)).toBe(3);
  });
});

// ── formatExportOutput ──────────────────────────────────────────

describe('formatExportOutput', () => {
  it('formats seed string with comment header', () => {
    const out = formatExportOutput('abc123');
    expect(out).toContain("export const DEFAULT_SEED = 'abc123';");
    expect(out).toContain('Seed (copy this into core.js');
    expect(out).toContain("import { deserializeSeed } from './seed.js';");
  });

  it('handles empty seed string', () => {
    const out = formatExportOutput('');
    expect(out).toContain("export const DEFAULT_SEED = '';");
  });

  it('produces multiline output', () => {
    const out = formatExportOutput('x');
    const lines = out.split('\n');
    expect(lines.length).toBeGreaterThan(3);
  });
});
