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
  hexToInt,
  extractMeshFromResult,
  buildPolygonShape,
  getClosestEdgePoint,
  fitMeshToPreview,
  normalizeRotation,
} from '../docs/js/editor-utils.js';

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

// ── hexToInt ────────────────────────────────────────────────────

describe('hexToInt', () => {
  it('converts #ffffff to 16777215', () => {
    expect(hexToInt('#ffffff')).toBe(0xffffff);
  });

  it('converts shorthand #fff', () => {
    expect(hexToInt('#fff')).toBe(0xfff);
  });

  it('converts without hash prefix', () => {
    expect(hexToInt('ff0000')).toBe(0xff0000);
    expect(hexToInt('00ff00')).toBe(0x00ff00);
  });

  it('converts dark colors', () => {
    expect(hexToInt('#1c1917')).toBe(0x1c1917);
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
