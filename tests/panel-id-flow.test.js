/**
 * @fileoverview panelId flow — builders' panelId reaches worldState interactables.
 * Regression: level/index.ts pushed only the seed's f.panelId, dropping the
 * builder result's panelId (May contract) → every interactable had null.
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildLevel } from '../docs/js/level/index.js';

function makeWorldState() {
  return {
    room: { walls: [], interactables: [] },
    pet: { mesh: null, model: null },
    effects: { implants: [], particles: [] },
    input: {}, ui: {}, meta: {},
  };
}

describe('panelId flow (builder result → interactable)', () => {
  it('macBook interactable carries panel-alphgpt from its builder result', async () => {
    const worldState = makeWorldState();
    await buildLevel(new THREE.Scene(), worldState);

    const macbook = worldState.room.interactables.find((i) => i.type === 'macBook');
    expect(macbook).toBeDefined();
    expect(macbook.panelId).toBe('panel-alphgpt');
  });

  it('unmapped furniture (bed, desk) carries no panelId', async () => {
    const worldState = makeWorldState();
    await buildLevel(new THREE.Scene(), worldState);

    for (const type of ['bed', 'desk']) {
      const item = worldState.room.interactables.find((i) => i.type === type);
      expect(item, type).toBeDefined();
      expect(item.panelId, type).toBeUndefined();
    }
  });
});
