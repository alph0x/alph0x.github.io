/**
 * @fileoverview Tests that buildLevel spawns Lulu from luluSpawn when no
 * miniSchnauzer furniture item is present.
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildLevel } from '../docs/js/level/index.js';
import { createWorldState } from '../docs/js/domain/world-state.js';

describe('buildLevel luluSpawn fallback', () => {
  it('spawns pet from luluSpawn when no miniSchnauzer furniture exists', () => {
    const worldState = createWorldState({ playerSpawn: [0.5, 0.5], playerHeight: 1.7 });
    worldState.room.luluSpawn = { x: -0.5, z: -0.5 };
    const scene = new THREE.Scene();
    buildLevel(scene, worldState);

    expect(worldState.pet.mesh).not.toBeNull();
    expect(worldState.pet.model).not.toBeNull();
    expect(worldState.pet.model.position.x).toBe(-0.5);
    expect(worldState.pet.model.position.z).toBe(-0.5);
  });
});
