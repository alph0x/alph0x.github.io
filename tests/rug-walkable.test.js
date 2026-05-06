/**
 * @fileoverview Tests that rug area is walkable (excluded from collision).
 */

import './setup-canvas-mock.js';
import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';

vi.mock('../docs/js/core.js', async (importOriginal) => {
  const actual = await importOriginal();
  const { deserializeSeed } = await import('../docs/js/seed.js');
  const { MOCK_SEED } = await import('./fixtures.js');
  return {
    ...actual,
    ROOM_LAYOUT: deserializeSeed(MOCK_SEED),
  };
});

import { buildLevel } from '../docs/js/level/index.js';
import { checkCollision } from '../docs/js/core.js';

describe('rug is walkable', () => {
  it('does not add rug bounds to state.walls', () => {
    const state = { walls: [], interactables: [], implants: [], particles: [] };
    const scene = new THREE.Scene();
    buildLevel(scene, state);

    // Rug position in MOCK_SEED: [0.5, 0.01, 0.5]
    const rugCollisions = state.walls.filter((w) => {
      const cx = (w.minX + w.maxX) / 2;
      const cz = (w.minZ + w.maxZ) / 2;
      return Math.abs(cx - 0.5) < 0.3 && Math.abs(cz - 0.5) < 0.3;
    });
    expect(rugCollisions.length).toBe(0);
  });

  it('player can stand on rug position', () => {
    const state = { walls: [], interactables: [], implants: [], particles: [] };
    const scene = new THREE.Scene();
    buildLevel(scene, state);

    const playerRadius = 0.35;
    expect(checkCollision(0.5, 0.5, state.walls, playerRadius)).toBe(false);
  });
});
