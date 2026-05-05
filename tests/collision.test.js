/**
 * @fileoverview Tests for pure collision logic.
 *
 * Decision: Test AABB collision independently of Three.js.
 * Rationale (Clean Code / TDD): Michael Feathers' "Working Effectively with
 * Legacy Code" recommends creating "seams" — points where behavior can be
 * verified without the full system. Collision math is an ideal seam.
 */

import { describe, it, expect } from 'vitest';
import { checkCollision, resolveMove } from '../docs/js/core.js';

describe('checkCollision', () => {
  const walls = [
    { minX: -1, maxX: 1, minZ: -1, maxZ: 1 }, // centered 2x2 wall
  ];

  it('returns true when point is inside wall bounds', () => {
    expect(checkCollision(0, 0, walls)).toBe(true);
    expect(checkCollision(0.5, 0.5, walls)).toBe(true);
  });

  it('returns false when point is outside wall bounds', () => {
    expect(checkCollision(2, 2, walls)).toBe(false);
    expect(checkCollision(-2, -2, walls)).toBe(false);
  });

  it('respects the collision radius padding', () => {
    // With default radius=0.35, wall effectively spans (-1.35, 1.35)
    expect(checkCollision(1.2, 0, walls)).toBe(true);  // inside padded bound
    expect(checkCollision(1.4, 0, walls)).toBe(false); // outside padded bound
  });

  it('handles multiple walls', () => {
    const multiWalls = [
      { minX: 0, maxX: 2, minZ: 0, maxZ: 2 },
      { minX: 5, maxX: 7, minZ: 5, maxZ: 7 },
    ];
    expect(checkCollision(1, 1, multiWalls)).toBe(true);
    expect(checkCollision(6, 6, multiWalls)).toBe(true);
    expect(checkCollision(3, 3, multiWalls)).toBe(false);
  });
});

describe('resolveMove', () => {
  const walls = [
    { minX: -1, maxX: 1, minZ: -1, maxZ: 1 },
  ];

  it('allows movement when no collision', () => {
    const pos = { x: 3, z: 3 };
    resolveMove(pos, 1, 1, walls);
    expect(pos.x).toBe(4);
    expect(pos.z).toBe(4);
  });

  it('slides along Z when X is blocked (diagonal into wall)', () => {
    // Player at (1.7, 0.5) moving left-down (-0.5, -0.5)
    // With radius=0.35, padded bounds are ±1.35
    // X would go to 1.2 (inside padded bound) AND z=0.5 (inside) → blocked
    // Z would go to 0 (inside padded bound) BUT x=1.7 (outside) → allowed
    const pos = { x: 1.7, z: 0.5 };
    resolveMove(pos, -0.5, -0.5, walls);
    expect(pos.x).toBe(1.7); // X blocked
    expect(pos.z).toBe(0);   // Z slides
  });

  it('slides along X when Z is blocked (diagonal into wall)', () => {
    // Player at (0.5, 1.7) moving left-down (-0.5, -0.5)
    // Z would go to 1.2 (inside padded bound) AND x=0.5 (inside) → blocked
    // X would go to 0 (inside padded bound) BUT z=1.7 (outside) → allowed
    const pos = { x: 0.5, z: 1.7 };
    resolveMove(pos, -0.5, -0.5, walls);
    expect(pos.x).toBe(0);   // X slides
    expect(pos.z).toBe(1.7); // Z blocked
  });

  it('blocks both axes when both would collide', () => {
    const pos = { x: 1.2, z: 1.2 };
    resolveMove(pos, -0.5, -0.5, walls);
    // X: (0.7, 1.2) — both inside padded bounds → blocked
    // Z: (1.2, 0.7) — both inside padded bounds → blocked
    expect(pos.x).toBe(1.2);
    expect(pos.z).toBe(1.2);
  });

  it('blocks movement when heading directly into wall', () => {
    const pos = { x: 1.7, z: 0 };
    resolveMove(pos, -0.5, 0, walls);
    // Moving to x=1.2 enters padded wall bound → blocked
    expect(pos.x).toBe(1.7);
    expect(pos.z).toBe(0);
  });
});
