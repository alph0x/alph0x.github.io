/**
 * @fileoverview Tests for polygon self-intersection detection.
 */

import { describe, it, expect } from 'vitest';
import { isSelfIntersecting } from '../docs/js/editor-utils.js';

describe('isSelfIntersecting', () => {
  it('returns false for a simple rectangle', () => {
    const outline = [
      [-2.25, -1.75],
      [2.25, -1.75],
      [2.25, 1.75],
      [-2.25, 1.75],
    ];
    expect(isSelfIntersecting(outline)).toBe(false);
  });

  it('returns false for a convex pentagon', () => {
    const outline = [
      [0, 0],
      [2, 0],
      [3, 1],
      [1.5, 2],
      [0, 1.5],
    ];
    expect(isSelfIntersecting(outline)).toBe(false);
  });

  it('returns true for a bowtie (hourglass) shape', () => {
    const outline = [
      [0, 0],
      [2, 2],
      [2, 0],
      [0, 2],
    ];
    expect(isSelfIntersecting(outline)).toBe(true);
  });

  it('returns true when one edge crosses a non-adjacent edge', () => {
    const outline = [
      [-2, -1],
      [2, -1],
      [-3, 1],  // moved left past the left edge
      [-2, 1],
    ];
    expect(isSelfIntersecting(outline)).toBe(true);
  });

  it('returns false when rectangle is just very narrow', () => {
    const outline = [
      [-2, -1],
      [2, -1],
      [2, 1],
      [-2, 1],
    ];
    expect(isSelfIntersecting(outline)).toBe(false);
  });

  it('returns false for a triangle', () => {
    const outline = [
      [0, 0],
      [2, 0],
      [1, 2],
    ];
    expect(isSelfIntersecting(outline)).toBe(false);
  });

  it('returns true for complex self-intersecting polygon', () => {
    const outline = [
      [0, 0],
      [3, 0],
      [1, 1],
      [3, 2],
      [0, 2],
      [2, 1],
    ];
    expect(isSelfIntersecting(outline)).toBe(true);
  });

  it('returns false when dragging an edge outward', () => {
    const outline = [
      [-2.25, -1.75],
      [3.5, -1.75],
      [3.5, 1.75],
      [-2.25, 1.75],
    ];
    expect(isSelfIntersecting(outline)).toBe(false);
  });

  it('returns true when a vertex is dragged across an opposite edge', () => {
    const outline = [
      [-2.25, -1.75],
      [2.25, -1.75],
      [2.25, 1.75],
      [0, -2.0],  // dragged bottom-left vertex below the bottom edge
    ];
    expect(isSelfIntersecting(outline)).toBe(true);
  });
});
