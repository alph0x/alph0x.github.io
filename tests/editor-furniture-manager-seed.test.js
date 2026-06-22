/**
 * @fileoverview Integration test: FurnitureManager.loadFromSeed with real builders.
 * Verifies that all DEFAULT_SEED furniture types create actual meshes in the scene.
 */


import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import '../docs/js/furniture/index.js';
import { FurnitureManager } from '../docs/js/editor-modules/furniture-manager.js';
import { EditorState } from '../docs/js/editor-modules/state.js';
import { UndoManager } from '../docs/js/editor-modules/undo-manager.js';
import { deserializeSeed } from '../docs/js/seed.js';
import { DEFAULT_SEED } from '../docs/js/core.js';

describe('FurnitureManager seed loading', () => {
  let scene, state, manager;

  beforeEach(() => {
    scene = new THREE.Scene();
    state = new EditorState();
    manager = new FurnitureManager(scene, state, 2.8, new UndoManager());
  });

  it('loads DEFAULT_SEED and places all items', () => {
    const layout = deserializeSeed(DEFAULT_SEED);
    manager.loadFromSeed(layout);

    expect(state.placedCount).toBe(layout.furniture.length);
    expect(manager.meshMap.size).toBe(layout.furniture.length);
  });

  it('places items at correct positions', () => {
    const layout = deserializeSeed(DEFAULT_SEED);
    manager.loadFromSeed(layout);

    for (let i = 0; i < layout.furniture.length; i++) {
      const expected = layout.furniture[i].position;
      const actual = state.placed[i].config.position;
      expect(actual[0]).toBeCloseTo(expected[0], 2);
      expect(actual[1]).toBeCloseTo(expected[1], 2);
      expect(actual[2]).toBeCloseTo(expected[2], 2);
    }
  });

  it('adds meshes to the scene', () => {
    const layout = deserializeSeed(DEFAULT_SEED);
    const before = scene.children.length;
    manager.loadFromSeed(layout);

    // Each placed item should add its mesh to the scene
    const added = scene.children.length - before;
    expect(added).toBe(layout.furniture.length);
  });

  it('each mesh is a Mesh or Group', () => {
    const layout = deserializeSeed(DEFAULT_SEED);
    manager.loadFromSeed(layout);

    for (const mesh of manager.meshMap.values()) {
      const isValid = mesh instanceof THREE.Mesh || mesh instanceof THREE.Group;
      expect(isValid).toBe(true);
    }
  });

  it('accumulates when loadFromSeed is called twice without clearAll', () => {
    manager.loadFromSeed(deserializeSeed(DEFAULT_SEED));
    const firstCount = manager.meshMap.size;

    manager.loadFromSeed(deserializeSeed(DEFAULT_SEED));
    expect(manager.meshMap.size).toBe(firstCount * 2);
    expect(state.placedCount).toBe(firstCount * 2);
  });

  it('clearAll + loadFromSeed replaces previous items', () => {
    manager.loadFromSeed(deserializeSeed(DEFAULT_SEED));
    const firstCount = manager.meshMap.size;

    manager.clearAll();
    manager.loadFromSeed(deserializeSeed(DEFAULT_SEED));
    expect(manager.meshMap.size).toBe(firstCount);
    expect(state.placedCount).toBe(firstCount);
  });

  it('preserves rotation from seed', () => {
    const layout = deserializeSeed(DEFAULT_SEED);
    manager.loadFromSeed(layout);

    for (let i = 0; i < layout.furniture.length; i++) {
      const expectedRot = layout.furniture[i].rotation || 0;
      const mesh = state.placed[i].mesh;
      expect(mesh.rotation.y).toBeCloseTo(expectedRot, 3);
    }
  });
});
