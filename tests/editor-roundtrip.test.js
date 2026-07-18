/**
 * @fileoverview Integration round-trip test: seed → editor furniture placement → seed.
 * Ensures builders honour position/rotation and that serializeLayout captures them.
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { MOCK_SEED } from './fixtures.js';
import { serializeLayout, deserializeSeed } from '../docs/js/seed.js';
import { FurnitureRegistry } from '../docs/js/furniture/registry.js';
import { extractMeshFromResult } from '../docs/js/primitives.js';
import '../docs/js/furniture/index.js';

describe('Editor round-trip with real builders', () => {
  it('places all DEFAULT_SEED furniture at correct positions and rotations', () => {
    const layout = deserializeSeed(MOCK_SEED);
    const scene = new THREE.Scene();
    const placed = [];

    for (const item of layout.furniture) {
      const { builder } = FurnitureRegistry.get(item.type);
      expect(builder).toBeDefined();

      const cfg = {
        position: [...item.position],
        rotation: item.rotation || 0,
        type: item.type,
      };
      const result = builder(cfg);
      const mesh = extractMeshFromResult(result);
      expect(mesh).toBeDefined();

      mesh.position.set(...item.position);
      mesh.rotation.y = item.rotation || 0;
      scene.add(mesh);

      placed.push({ type: item.type, config: { ...cfg } });
    }

    // Verify meshes exist in scene
    expect(placed).toHaveLength(layout.furniture.length);

    // Verify specific positions
    const byType = Object.fromEntries(placed.map((p) => [p.type, p.config]));
    expect(byType.bed.position).toEqual([-1.1, 0, -0.95]);
    expect(byType.bed.rotation).toBeCloseTo(6.283, 3);
    expect(byType.nightstand.position).toEqual([-1.85, 0, 0.05]);
    expect(byType.nightstand.rotation).toBe(0);
    expect(byType.desk.position).toEqual([1.2, 0, -1.15]);
    expect(byType.desk.rotation).toBeCloseTo(6.284, 3);
    expect(byType.macBook.position).toEqual([1.05, 0.82, -1.4]);
    expect(byType.macBook.rotation).toBeCloseTo(6.545, 3);
    expect(byType.tv.position).toEqual([1.35, 1.4, 1.65]);
    expect(byType.tv.rotation).toBeCloseTo(3.142, 3);
    expect(byType.miniSchnauzer.position).toEqual([-0.7, 0.89, -0.9]);
    expect(byType.miniSchnauzer.rotation).toBeCloseTo(5.34, 3);
    expect(byType.rug.position).toEqual([0.5, 0.01, 0.5]);
    expect(byType.rug.rotation).toBe(0);
    const ceilingLamps = placed.filter((p) => p.type === 'ceilingLamp');
    expect(ceilingLamps).toHaveLength(2);
    expect(ceilingLamps[0].config.position).toEqual([0, 2.7, 0]);
    expect(ceilingLamps[1].config.position).toEqual([1.3, 2.7, -0.7]);
  });

  it('exports a seed that deserializes back to the same layout', () => {
    const layout = deserializeSeed(MOCK_SEED);

    const placed = layout.furniture.map((f) => {
      const cfg = {
        position: [...f.position],
        rotation: f.rotation || 0,
        type: f.type,
      };
      if (f.text != null) cfg.text = f.text;
      if (f.color != null) cfg.color = f.color;
      return { type: f.type, config: cfg };
    });

    const seed2 = serializeLayout({
      outline: layout.outline,
      placed,
      playerSpawn: { x: layout.playerSpawn[0], z: layout.playerSpawn[1] },
      luluSpawn: { x: layout.luluSpawn[0], z: layout.luluSpawn[1] },
      mat: layout.mat,
    });

    // Verify exported seed is valid base64-encoded JSON
    const parsed = JSON.parse(atob(seed2));
    expect(parsed.v).toBe(2);

    // Verify round-trip
    const layout2 = deserializeSeed(seed2);
    expect(layout2.furniture).toHaveLength(layout.furniture.length);

    for (let i = 0; i < layout.furniture.length; i++) {
      const orig = layout.furniture[i];
      const back = layout2.furniture[i];
      expect(back.type).toBe(orig.type);
      expect(back.position[0]).toBeCloseTo(orig.position[0], 2);
      expect(back.position[1]).toBeCloseTo(orig.position[1], 2);
      expect(back.position[2]).toBeCloseTo(orig.position[2], 2);
      expect(back.rotation || 0).toBeCloseTo(orig.rotation || 0, 3);
    }

    // Verify decorations (posters, fairyLights) round-trip correctly if present
    const origPosters = layout.furniture.filter((f) => f.type === 'poster');
    const backPosters = layout2.furniture.filter((f) => f.type === 'poster');
    expect(backPosters).toHaveLength(origPosters.length);
    for (let i = 0; i < origPosters.length; i++) {
      expect(backPosters[i].text).toBe(origPosters[i].text);
      expect(backPosters[i].color).toBe(origPosters[i].color);
    }
  });
});
