/**
 * @fileoverview Tests for core vector math utilities.
 *
 * Decision: Test vec3, scale, add independently.
 * Rationale: These are pure arithmetic functions with no external dependencies.
 */

import { describe, it, expect } from 'vitest';
import { vec3, scale, add } from '../docs/js/core.js';

describe('vec3', () => {
  it('creates a vector with default zeros', () => {
    expect(vec3()).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('creates a vector with provided values', () => {
    expect(vec3(1, 2, 3)).toEqual({ x: 1, y: 2, z: 3 });
  });

  it('creates a vector with negative values', () => {
    expect(vec3(-5, 0, 10)).toEqual({ x: -5, y: 0, z: 10 });
  });
});

describe('scale', () => {
  it('multiplies each component by scalar', () => {
    expect(scale({ x: 1, y: 2, z: 3 }, 2)).toEqual({ x: 2, y: 4, z: 6 });
  });

  it('returns zero vector for zero scalar', () => {
    expect(scale({ x: 5, y: 3, z: 10 }, 0)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('handles negative scalar', () => {
    expect(scale({ x: 1, y: 1, z: 1 }, -1)).toEqual({ x: -1, y: -1, z: -1 });
  });

  it('preserves fractional values', () => {
    expect(scale({ x: 0.5, y: 1.5, z: 2.5 }, 2)).toEqual({ x: 1, y: 3, z: 5 });
  });
});

describe('add', () => {
  it('adds two vectors component-wise', () => {
    expect(add({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 })).toEqual({ x: 5, y: 7, z: 9 });
  });

  it('handles negative components', () => {
    expect(add({ x: -1, y: 2, z: -3 }, { x: 4, y: -5, z: 6 })).toEqual({ x: 3, y: -3, z: 3 });
  });

  it('returns zero vector when adding opposites', () => {
    expect(add({ x: 5, y: 5, z: 5 }, { x: -5, y: -5, z: -5 })).toEqual({ x: 0, y: 0, z: 0 });
  });
});
