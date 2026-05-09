/**
 * @fileoverview Tests for level collision bounds — no double radius padding.
 */

import './setup-canvas-mock.js';
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildLevel } from '../docs/js/level/index.js';
import { checkCollision, resolveMove } from '../docs/js/core.js';

describe('buildLevel collision bounds', () => {
  it('stores raw AABB bounds without radius padding', () => {
    const worldState = {
      room: { walls: [], interactables: [] },
      pet: { mesh: null, model: null },
      effects: { implants: [], particles: [] },
      input: {}, ui: {}, meta: {},
    };
    const scene = new THREE.Scene();
    buildLevel(scene, worldState);

    // Verify at least one wall/piece was registered
    expect(worldState.room.walls.length).toBeGreaterThan(0);

    // Bed AABB should be within its real geometry size (~2.0 x 1.4)
    const bedWall = worldState.room.walls.find((w) =>
      w.minX < -1.0 && w.maxX > -1.0 && w.minZ < -0.9 && w.maxZ > -0.9
    );
    if (bedWall) {
      const width = bedWall.maxX - bedWall.minX;
      const depth = bedWall.maxZ - bedWall.minZ;
      expect(width).toBeGreaterThan(1.5);
      expect(width).toBeLessThan(2.5);
      expect(depth).toBeGreaterThan(1.0);
      expect(depth).toBeLessThan(2.0);
    }
  });
});

describe('checkCollision uses radius padding correctly', () => {
  it('treats a point inside bounds as collision', () => {
    const walls = [{ minX: 0, maxX: 1, minZ: 0, maxZ: 1 }];
    expect(checkCollision(0.5, 0.5, walls)).toBe(true);
  });

  it('rejects a point outside radius-padding range', () => {
    const walls = [{ minX: 0, maxX: 1, minZ: 0, maxZ: 1 }];
    // point is 1 unit away from box edge; with radius 0.35 should not collide
    expect(checkCollision(1.5, 0.5, walls)).toBe(false);
  });

  it('collides when within radius padding of wall edge', () => {
    const walls = [{ minX: 0, maxX: 1, minZ: 0, maxZ: 1 }];
    // point is 0.2 units from right edge; radius 0.35 includes it
    expect(checkCollision(1.2, 0.5, walls)).toBe(true);
  });
});

describe('resolveMove slides correctly', () => {
  it('allows movement along axis that is free', () => {
    const walls = [{ minX: 0, maxX: 1, minZ: 0, maxZ: 1 }];
    const pos = { x: 2, z: 0.5 };
    resolveMove(pos, -0.3, 0, walls);
    // x goes from 2 to 1.7, which is > 1 + 0.35 so no collision
    expect(pos.x).toBe(1.7);
    expect(pos.z).toBe(0.5);
  });
});

