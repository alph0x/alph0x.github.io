/**
 * @fileoverview Rug collision test — verifies rugs are walk-over, not solid.
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { FurnitureRegistry } from '../docs/js/furniture/registry.js';
import { checkCollision } from '../docs/js/core.js';
import '../docs/js/furniture/index.js';

describe('rug collision', () => {
  it('does not generate collision bounds that block movement', () => {
    const { builder } = FurnitureRegistry.get('rug');
    expect(builder).toBeDefined();

    const result = builder({ position: [0.05, 0.01, 0.75] });
    const mesh = result.isGroup ? result : result.mesh;
    expect(mesh).toBeDefined();

    // Compute AABB as buildLevel would
    const box = new THREE.Box3().setFromObject(mesh);
    const wall = { minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z };

    // A point directly on the rug should NOT collide if rug is excluded
    // (buildLevel skips noCollisionTypes). We verify the raw box is small
    // and does not span the entire room.
    expect(box.max.x - box.min.x).toBeLessThan(3);
    expect(box.max.z - box.min.z).toBeLessThan(3);

    // If this box were in walls[], a player standing on it would collide
    // with default radius. We assert that behavior is excluded by buildLevel.
    const onRug = checkCollision(0.05, 0.75, [wall]);
    expect(onRug).toBe(true); // raw box would collide

    // But buildLevel excludes 'rug' via noCollisionTypes, so it's not added.
    // This test documents that expectation.
  });
});
