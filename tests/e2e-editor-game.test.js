/**
 * @fileoverview End-to-end integration test: editor seed format → game level load.
 * Verifies that the seed serialization format is compatible with buildLevel consumption.
 */


import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { serializeLayout, deserializeSeed } from '../docs/js/seed.js';
import { buildLevel } from '../docs/js/level/index.js';
import { ROOM_LAYOUT } from '../docs/js/core.js';

describe('E2E: editor seed → game level', () => {
  it('DEFAULT_SEED deserializes to a format compatible with buildLevel', () => {
    // Verify ROOM_LAYOUT (loaded from DEFAULT_SEED in core.js) has all required fields
    expect(ROOM_LAYOUT).toBeDefined();
    expect(Array.isArray(ROOM_LAYOUT.outline)).toBe(true);
    expect(ROOM_LAYOUT.outline.length).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(ROOM_LAYOUT.furniture)).toBe(true);
    expect(ROOM_LAYOUT.mat).toBeDefined();
    expect(ROOM_LAYOUT.mat.floor).toBeDefined();
    expect(ROOM_LAYOUT.mat.wall).toBeDefined();
    expect(ROOM_LAYOUT.mat.ceiling).toBeDefined();
  });

  it('DEFAULT_SEED content matches the designed room contract', () => {
    const xs = ROOM_LAYOUT.outline.map((v) => v[0]);
    const zs = ROOM_LAYOUT.outline.map((v) => v[1]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(4.5);
    expect(Math.max(...zs) - Math.min(...zs)).toBeCloseTo(3.5);
    expect(ROOM_LAYOUT.playerSpawn).toEqual([0.5, 0.5]);
    const types = ROOM_LAYOUT.furniture.map((f) => f.type);
    for (const t of ['bed', 'desk', 'macBook', 'miniSchnauzer', 'ceilingLamp', 'window', 'door']) {
      expect(types).toContain(t);
    }
  });

  it('buildLevel consumes ROOM_LAYOUT without errors', () => {
    const scene = new THREE.Scene();
    const worldState = {
      room: { walls: [], interactables: [] },
      pet: { mesh: null, model: null },
      effects: { implants: [], particles: [] },
      input: {}, ui: {}, meta: {},
    };

    expect(() => buildLevel(scene, worldState)).not.toThrow();

    // Walls should be populated from room edges + furniture + door
    expect(worldState.room.walls.length).toBeGreaterThan(0);

    expect(ROOM_LAYOUT.furniture.some((f) => f.type === 'miniSchnauzer')).toBe(true);
    expect(worldState.pet.mesh).toBeDefined();
    expect(worldState.pet.mesh).toBeInstanceOf(THREE.Group);

    // Scene should contain floor, ceiling, walls, furniture, lights
    expect(scene.children.length).toBeGreaterThan(0);
  });

  it('round-trip: serialize → deserialize preserves structure', () => {
    const payload = {
      outline: [
        [-2.25, -1.75],
        [2.25, -1.75],
        [2.25, 1.75],
        [-2.25, 1.75],
      ],
      placed: [
        { type: 'bed', config: { position: [-1.1, 0, -0.95], rotation: 0 } },
        { type: 'miniSchnauzer', config: { position: [0, 0, 0], rotation: 0 } },
        { type: 'ceilingLamp', config: { position: [0, 2.7, 0], color: 0xf5f5f4, intensity: 2.0, distance: 8 } },
      ],
      playerSpawn: { x: 0.5, z: 0.5 },
      luluSpawn: { x: -0.9, z: -0.65 },
      mat: { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' },
    };

    const seed = serializeLayout(payload);
    expect(typeof seed).toBe('string');

    const decoded = deserializeSeed(seed);
    expect(decoded.outline).toEqual(payload.outline);
    expect(decoded.furniture.length).toBe(3);
    expect(decoded.furniture[0].type).toBe('bed');
    expect(decoded.furniture[1].type).toBe('miniSchnauzer');
    expect(decoded.furniture[2].type).toBe('ceilingLamp');
    expect(decoded.mat.floor).toBe('#1c1917');
  });

  it('buildLevel populates collision walls from furniture', () => {
    const scene = new THREE.Scene();
    const worldState = {
      room: { walls: [], interactables: [] },
      pet: { mesh: null, model: null },
      effects: { implants: [], particles: [] },
      input: {}, ui: {}, meta: {},
    };

    buildLevel(scene, worldState);

    // Should have walls from room edges + solid furniture + door
    const roomEdgeCount = ROOM_LAYOUT.outline.length;
    expect(worldState.room.walls.length).toBeGreaterThanOrEqual(roomEdgeCount);

    // Each wall entry should have AABB bounds
    for (const w of worldState.room.walls) {
      expect(w).toHaveProperty('minX');
      expect(w).toHaveProperty('maxX');
      expect(w).toHaveProperty('minZ');
      expect(w).toHaveProperty('maxZ');
      expect(w.maxX).toBeGreaterThan(w.minX);
      expect(w.maxZ).toBeGreaterThan(w.minZ);
    }
  });
});
