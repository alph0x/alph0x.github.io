/**
 * @fileoverview Tests for polygon shape generation and floor/ceiling geometry.
 */


import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildPolygonShape } from '../docs/js/primitives.js';

function shapeToVertices(shape) {
  const points = shape.getPoints();
  return points.map((p) => [p.x, p.y]);
}

function isCounterClockwise(outline) {
  let sum = 0;
  for (let i = 0; i < outline.length; i++) {
    const [x1, y1] = outline[i];
    const [x2, y2] = outline[(i + 1) % outline.length];
    sum += (x2 - x1) * (y2 + y1);
  }
  return sum < 0;
}

describe('buildPolygonShape', () => {
  it('preserves rectangle outline vertices', () => {
    const outline = [
      [-2.25, -1.75],
      [2.25, -1.75],
      [2.25, 1.75],
      [-2.25, 1.75],
    ];
    const shape = buildPolygonShape(outline);
    const verts = shapeToVertices(shape);
    expect(verts).toHaveLength(outline.length + 1); // closes path
    expect(verts[0]).toEqual(outline[0]);
    expect(verts[1]).toEqual(outline[1]);
    expect(verts[2]).toEqual(outline[2]);
    expect(verts[3]).toEqual(outline[3]);
    expect(verts[4]).toEqual(outline[0]); // closed
  });

  it('maintains counter-clockwise winding order for default rectangle', () => {
    const outline = [
      [-2.25, -1.75],
      [2.25, -1.75],
      [2.25, 1.75],
      [-2.25, 1.75],
    ];
    expect(isCounterClockwise(outline)).toBe(true);
  });

  it('maintains CCW order after expanding one vertex', () => {
    const outline = [
      [-2.25, -1.75],
      [3.0, -1.75],   // expanded right
      [3.0, 1.75],    // expanded right
      [-2.25, 1.75],
    ];
    expect(isCounterClockwise(outline)).toBe(true);
  });

  it('maintains CCW order after dragging top edge up', () => {
    const outline = [
      [-2.25, -1.75],
      [2.25, -1.75],
      [2.25, 2.5],    // dragged up
      [-2.25, 2.5],   // dragged up
    ];
    expect(isCounterClockwise(outline)).toBe(true);
  });

  it('detects clockwise (inverted) winding', () => {
    const outline = [
      [-2.25, -1.75],
      [-2.25, 1.75],
      [2.25, 1.75],
      [2.25, -1.75],
    ];
    expect(isCounterClockwise(outline)).toBe(false);
  });

  it('ShapeGeometry produces valid bounding box for default rectangle', () => {
    const outline = [
      [-2.25, -1.75],
      [2.25, -1.75],
      [2.25, 1.75],
      [-2.25, 1.75],
    ];
    const shape = buildPolygonShape(outline);
    const geo = new THREE.ShapeGeometry(shape);
    geo.computeBoundingBox();
    const box = geo.boundingBox;
    expect(box.min.x).toBeCloseTo(-2.25, 2);
    expect(box.max.x).toBeCloseTo(2.25, 2);
    expect(box.min.y).toBeCloseTo(-1.75, 2);
    expect(box.max.y).toBeCloseTo(1.75, 2);
  });

  it('ShapeGeometry produces valid bounding box after resizing', () => {
    const outline = [
      [-2.25, -1.75],
      [3.5, -1.75],
      [3.5, 2.5],
      [-2.25, 2.5],
    ];
    const shape = buildPolygonShape(outline);
    const geo = new THREE.ShapeGeometry(shape);
    geo.computeBoundingBox();
    const box = geo.boundingBox;
    expect(box.min.x).toBeCloseTo(-2.25, 2);
    expect(box.max.x).toBeCloseTo(3.5, 2);
    expect(box.min.y).toBeCloseTo(-1.75, 2);
    expect(box.max.y).toBeCloseTo(2.5, 2);
  });

  it('ShapeGeometry area is positive for CCW outline', () => {
    const outline = [
      [-2.25, -1.75],
      [2.25, -1.75],
      [2.25, 1.75],
      [-2.25, 1.75],
    ];
    const shape = buildPolygonShape(outline);
    const geo = new THREE.ShapeGeometry(shape);
    // Compute signed area from indexed triangles
    const posAttr = geo.attributes.position;
    const indexAttr = geo.index;
    let area = 0;
    for (let i = 0; i < indexAttr.count; i += 3) {
      const ai = indexAttr.getX(i);
      const bi = indexAttr.getX(i + 1);
      const ci = indexAttr.getX(i + 2);
      const ax = posAttr.getX(ai), ay = posAttr.getY(ai);
      const bx = posAttr.getX(bi), by = posAttr.getY(bi);
      const cx = posAttr.getX(ci), cy = posAttr.getY(ci);
      area += (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
    }
    expect(area).toBeGreaterThan(0);
  });

  it('ShapeGeometry area is positive after resizing', () => {
    const outline = [
      [-2.25, -1.75],
      [4.0, -1.75],
      [4.0, 3.0],
      [-2.25, 3.0],
    ];
    const shape = buildPolygonShape(outline);
    const geo = new THREE.ShapeGeometry(shape);
    const posAttr = geo.attributes.position;
    const indexAttr = geo.index;
    let area = 0;
    for (let i = 0; i < indexAttr.count; i += 3) {
      const ai = indexAttr.getX(i);
      const bi = indexAttr.getX(i + 1);
      const ci = indexAttr.getX(i + 2);
      const ax = posAttr.getX(ai), ay = posAttr.getY(ai);
      const bx = posAttr.getX(bi), by = posAttr.getY(bi);
      const cx = posAttr.getX(ci), cy = posAttr.getY(ci);
      area += (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
    }
    expect(area).toBeGreaterThan(0);
  });
});
