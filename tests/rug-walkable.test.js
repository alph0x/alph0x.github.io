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
  function makeWorldState() {
    return {
      room: { walls: [], interactables: [] },
      pet: { mesh: null, model: null },
      effects: { implants: [], particles: [] },
      input: {}, ui: {}, meta: {},
    };
  }

  it('does not add rug bounds to room.walls', () => {
    const worldState = makeWorldState();
    const scene = new THREE.Scene();
    buildLevel(scene, worldState);

    // Rug position in MOCK_SEED: [0.5, 0.01, 0.5]
    const rugCollisions = worldState.room.walls.filter((w) => {
      const cx = (w.minX + w.maxX) / 2;
      const cz = (w.minZ + w.maxZ) / 2;
      return Math.abs(cx - 0.5) < 0.3 && Math.abs(cz - 0.5) < 0.3;
    });
    expect(rugCollisions.length).toBe(0);
  });

  it('player can stand on rug position', () => {
    const worldState = makeWorldState();
    const scene = new THREE.Scene();
    buildLevel(scene, worldState);

    const playerRadius = 0.35;
    expect(checkCollision(0.5, 0.5, worldState.room.walls, playerRadius)).toBe(false);
  });
});
