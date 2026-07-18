/**
 * @fileoverview Tests for camera-relative movement vector computation.
 *
 * Decision: Test movement math with plain vectors.
 * Rationale (DIP): The movement system depends on abstract {x,z} vectors,
 * not on THREE.Vector3. These tests verify the math without mocking Three.js.
 */

import { describe, it, expect } from 'vitest';
import { computeMovementVector, rightFromForward, normalizeXZ } from '../docs/js/core.js';

describe('normalizeXZ', () => {
  it('normalizes a non-zero vector', () => {
    const v = normalizeXZ({ x: 3, y: 99, z: 4 });
    expect(v.x).toBeCloseTo(0.6);
    expect(v.z).toBeCloseTo(0.8);
    expect(v.y).toBe(99); // Y preserved
  });

  it('returns zero vector for zero input', () => {
    const v = normalizeXZ({ x: 0, y: 5, z: 0 });
    expect(v.x).toBe(0);
    expect(v.z).toBe(0);
  });
});

describe('rightFromForward', () => {
  it('returns correct right vector for north-facing forward', () => {
    // Forward = (0, 0, -1) => Right = (1, 0, 0) (east)
    const r = rightFromForward({ x: 0, y: 0, z: -1 });
    expect(r.x).toBeCloseTo(1);
    expect(r.z).toBeCloseTo(0);
  });

  it('returns correct right vector for east-facing forward', () => {
    // Forward = (1, 0, 0) => Right = (0, 0, 1) (south)
    const r = rightFromForward({ x: 1, y: 0, z: 0 });
    expect(r.x).toBeCloseTo(0);
    expect(r.z).toBeCloseTo(1);
  });

  it('returns normalized vector even for non-unit forward', () => {
    const r = rightFromForward({ x: 0, y: 0, z: -5 });
    expect(Math.abs(r.x)).toBeCloseTo(1);
    expect(Math.abs(r.z)).toBeCloseTo(0);
  });
});

describe('computeMovementVector', () => {
  it('moves forward when only W is pressed', () => {
    const forward = { x: 0, y: 0, z: -1 };
    const result = computeMovementVector(true, false, false, false, forward);
    expect(result.x).toBeCloseTo(0);
    expect(result.z).toBeCloseTo(-1);
  });

  it('moves right when only D is pressed', () => {
    const forward = { x: 0, y: 0, z: -1 };
    const result = computeMovementVector(false, false, false, true, forward);
    expect(result.x).toBeCloseTo(1);
    expect(result.z).toBeCloseTo(0);
  });

  it('normalizes diagonal movement', () => {
    const forward = { x: 0, y: 0, z: -1 };
    const result = computeMovementVector(true, false, false, true, forward);
    // Forward-Right diagonal should be normalized
    const len = Math.sqrt(result.x * result.x + result.z * result.z);
    expect(len).toBeCloseTo(1);
    expect(result.x).toBeGreaterThan(0);
    expect(result.z).toBeLessThan(0);
  });

  it('returns zero when no keys pressed', () => {
    const forward = { x: 0, y: 0, z: -1 };
    const result = computeMovementVector(false, false, false, false, forward);
    expect(result.x).toBe(0);
    expect(result.z).toBe(0);
  });

  it('cancels opposing keys W+S to a zero vector', () => {
    const forward = { x: 0, y: 0, z: -1 };
    const result = computeMovementVector(true, true, false, false, forward);
    expect(result.x).toBe(0);
    expect(result.z).toBe(0);
  });

  it('cancels opposing keys A+D to a zero vector', () => {
    const forward = { x: 0, y: 0, z: -1 };
    const result = computeMovementVector(false, false, true, true, forward);
    expect(result.x).toBe(0);
    expect(result.z).toBe(0);
  });
});
