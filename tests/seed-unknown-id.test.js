/**
 * @fileoverview D-13 seed policy: unknown furniture ids in a seed are skipped
 * with a console warning (both consumers: game buildLevel + editor placeConfig).
 * Old shared URLs carrying removed ids must never throw.
 */

import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { buildLevel } from '../docs/js/level/index.js';
import { ROOM_LAYOUT } from '../docs/js/core.js';
import { applySeedFromUrl, serializeLayout } from '../docs/js/seed.js';

describe('unknown furniture id skip-with-warn (D-13)', () => {
  it('warns on the unknown id, does not throw, and still spawns known items', () => {
    const seed = serializeLayout({
      outline: [[-2.25, -1.75], [2.25, -1.75], [2.25, 1.75], [-2.25, 1.75]],
      placed: [
        { type: 'bed', config: { position: [-1.1, 0, -0.9], rotation: 6.283 } },
        { type: 'nopeChairs', config: { position: [0, 0, 0] } },
      ],
      playerSpawn: { x: -0.4, z: 0.55 },
      luluSpawn: { x: 1.45, z: 1.15 },
      mat: { floor: '#f4ecd8', wall: '#e6dbc2', ceiling: '#f4ecd8' },
    });
    expect(applySeedFromUrl(`?seed=${encodeURIComponent(seed)}`, ROOM_LAYOUT)).toBe(true);

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const worldState = {
      room: { walls: [], interactables: [] },
      pet: { mesh: null, model: null },
      effects: { implants: [], particles: [] },
      input: {}, ui: {}, meta: {},
    };
    const scene = new THREE.Scene();
    expect(() => buildLevel(scene, worldState)).not.toThrow();

    expect(warn).toHaveBeenCalledWith('[seed] unknown furniture id, skipping:', 'nopeChairs');
    const types = worldState.room.interactables.map((i) => i.type);
    expect(types).toContain('bed');
    expect(types).not.toContain('nopeChairs');
    warn.mockRestore();
  });
});
