/**
 * @fileoverview Tests for SpawnManager mesh construction and position updates.
 */

import './setup-canvas-mock.js';
import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { SpawnManager } from '../docs/js/editor-modules/spawn-manager.js';
import { EditorState } from '../docs/js/editor-modules/state.js';

describe('SpawnManager', () => {
  let group, state, manager;

  const CONFIG = {
    colors: { playerSpawn: 0x10b981, luluSpawn: 0xf59e0b },
    geometry: {
      spawnPlayerRadius: 0.12,
      spawnPlayerHeight: 0.25,
      spawnLuluRadius: 0.08,
      spawnLuluHeight: 0.12,
    },
  };

  beforeEach(() => {
    group = new THREE.Group();
    state = new EditorState();
    manager = new SpawnManager(group, state, CONFIG);
  });

  it('rebuild creates two child meshes', () => {
    manager.rebuild();
    expect(group.children.length).toBe(2);
  });

  it('creates player spawn with correct userData', () => {
    manager.rebuild();
    const player = group.children.find((c) => c.userData.spawnType === 'player');
    expect(player).toBeDefined();
    expect(player.position.x).toBe(state.playerSpawn.x);
    expect(player.position.z).toBe(state.playerSpawn.z);
  });

  it('creates lulu spawn with correct userData', () => {
    manager.rebuild();
    const lulu = group.children.find((c) => c.userData.spawnType === 'lulu');
    expect(lulu).toBeDefined();
    expect(lulu.position.x).toBe(state.luluSpawn.x);
    expect(lulu.position.z).toBe(state.luluSpawn.z);
  });

  it('setSpawn updates player position and rebuilds', () => {
    manager.rebuild();
    manager.setSpawn('player', 1.5, 2.5);
    const player = group.children.find((c) => c.userData.spawnType === 'player');
    expect(player.position.x).toBe(1.5);
    expect(player.position.z).toBe(2.5);
    expect(state.playerSpawn.x).toBe(1.5);
    expect(state.playerSpawn.z).toBe(2.5);
    expect(state.activeTool).toBeNull();
  });

  it('setSpawn updates lulu position and rebuilds', () => {
    manager.rebuild();
    manager.setSpawn('lulu', -1, -1);
    const lulu = group.children.find((c) => c.userData.spawnType === 'lulu');
    expect(lulu.position.x).toBe(-1);
    expect(lulu.position.z).toBe(-1);
    expect(state.luluSpawn.x).toBe(-1);
    expect(state.luluSpawn.z).toBe(-1);
  });

  it('moveDrag updates position without clearing activeTool', () => {
    state.activeTool = 'player';
    manager.rebuild();
    manager.moveDrag('player', 3, 4);
    expect(state.playerSpawn.x).toBe(3);
    expect(state.playerSpawn.z).toBe(4);
    expect(state.activeTool).toBe('player');
  });

  it('clears previous meshes on rebuild', () => {
    manager.rebuild();
    manager.setSpawn('player', 1, 1);
    expect(group.children.length).toBe(2);
  });
});
