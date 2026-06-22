/**
 * @fileoverview Tests that buildLevel spawns Lulu from luluSpawn when no
 * miniSchnauzer furniture item is present.
 */


import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';

// Mock core.js to provide a layout without miniSchnauzer but with luluSpawn
vi.mock('../docs/js/core.js', async () => {
  const actual = await vi.importActual('../docs/js/core.js');
  return {
    ...actual,
    ROOM_LAYOUT: {
      ...actual.ROOM_LAYOUT,
      furniture: actual.ROOM_LAYOUT.furniture.filter((f) => f.type !== 'miniSchnauzer'),
      luluSpawn: [-0.5, -0.5],
    },
  };
});

import { buildLevel } from '../docs/js/level/index.js';

describe('buildLevel luluSpawn fallback', () => {
  it('spawns pet from luluSpawn when no miniSchnauzer furniture exists', () => {
    const worldState = {
      room: { walls: [], interactables: [] },
      pet: { mesh: null, model: null },
      effects: { implants: [], particles: [] },
      input: {}, ui: {}, meta: {},
    };
    const scene = new THREE.Scene();
    buildLevel(scene, worldState);

    expect(worldState.pet.mesh).not.toBeNull();
    expect(worldState.pet.model).not.toBeNull();
    expect(worldState.pet.model.position.x).toBe(-0.5);
    expect(worldState.pet.model.position.z).toBe(-0.5);
  });
});
