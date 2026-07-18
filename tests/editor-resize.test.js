/**
 * @fileoverview Tests for room outline resizing via production computeEdgeDrag.
 */

import { describe, it, expect } from 'vitest';
import { snap, computeEdgeDrag, isSelfIntersecting } from '../docs/js/editor-utils.js';

const RECT = [
  [-2.25, -1.75],
  [2.25, -1.75],
  [2.25, 1.75],
  [-2.25, 1.75],
];

describe('computeEdgeDrag', () => {
  it('moves both edge vertices by the same delta', () => {
    const result = computeEdgeDrag(RECT, 1, 0.75, 0);
    expect(result).not.toBeNull();
    expect(result[1][0]).toBeCloseTo(snap(2.25 + 0.75));
    expect(result[2][0]).toBeCloseTo(snap(2.25 + 0.75));
    expect(result[1][1]).toBe(RECT[1][1]);
    expect(result[2][1]).toBe(RECT[2][1]);
  });

  it('locks vertical edges to X-only movement', () => {
    const result = computeEdgeDrag(RECT, 1, 0.5, 0.9);
    expect(result).not.toBeNull();
    expect(result[1][0]).toBeCloseTo(snap(2.25 + 0.5));
    expect(result[1][1]).toBe(RECT[1][1]);
    expect(result[2][1]).toBe(RECT[2][1]);
  });

  it('locks horizontal edges to Z-only movement', () => {
    const result = computeEdgeDrag(RECT, 0, 0.5, -0.4);
    expect(result).not.toBeNull();
    expect(result[0][0]).toBe(RECT[0][0]);
    expect(result[1][0]).toBe(RECT[1][0]);
    expect(result[0][1]).toBeCloseTo(snap(-1.75 - 0.4));
    expect(result[1][1]).toBeCloseTo(snap(-1.75 - 0.4));
  });

  it('snaps dragged vertices to the grid', () => {
    const result = computeEdgeDrag(RECT, 1, 0.73, 0);
    expect(result[1][0]).toBe(snap(2.25 + 0.73));
  });

  it('rejects drags that would self-intersect the outline', () => {
    // L-shaped room: dragging the inner vertical edge left across the west wall creates a bowtie.
    const lShape = [
      [0, 0],
      [4, 0],
      [4, 2],
      [2, 2],
      [2, 4],
      [0, 4],
    ];
    const result = computeEdgeDrag(lShape, 3, -3, 0);
    expect(result).toBeNull();
    const wouldBe = lShape.map((v) => [...v]);
    wouldBe[3] = [snap(2 - 3), 2];
    wouldBe[4] = [snap(2 - 3), 4];
    expect(isSelfIntersecting(wouldBe)).toBe(true);
  });

  it('does not mutate the input outline', () => {
    const before = JSON.stringify(RECT);
    computeEdgeDrag(RECT, 1, 0.5, 0);
    expect(JSON.stringify(RECT)).toBe(before);
  });
});
