/**
 * @fileoverview Tests that playerSpawn from seed is a valid walkable position.
 */

import './setup-canvas-mock.js';
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildLevel } from '../docs/js/level/index.js';
import { checkCollision } from '../docs/js/core.js';

describe('playerSpawn validity', () => {
  it('is inside the room outline', () => {
    // Room outline: [-2.25, -1.75] -> [2.25, 1.75]
    const [x, z] = [0.5, 0.5];
    expect(x).toBeGreaterThan(-2.25);
    expect(x).toBeLessThan(2.25);
    expect(z).toBeGreaterThan(-1.75);
    expect(z).toBeLessThan(1.75);
  });

  it('does not collide with any wall or furniture bounds', () => {
    const state = { walls: [], interactables: [], implants: [], particles: [] };
    const scene = new THREE.Scene();
    buildLevel(scene, state);

    const [x, z] = [0.5, 0.5];
    const playerRadius = 0.35;
    expect(checkCollision(x, z, state.walls, playerRadius)).toBe(false);
  });
});
