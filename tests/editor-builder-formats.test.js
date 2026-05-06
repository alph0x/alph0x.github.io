/**
 * @fileoverview Verifies that FurnitureManager.placeConfig handles all builder
 * return formats: raw Group, [Group, meta], { mesh, type }, and raw Mesh.
 */

import './setup-canvas-mock.js';
import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import '../docs/js/furniture/index.js';
import { FurnitureManager } from '../docs/js/editor-modules/furniture-manager.js';
import { EditorState } from '../docs/js/editor-modules/state.js';

describe('Builder return formats', () => {
  let scene, state, manager;

  beforeEach(() => {
    scene = new THREE.Scene();
    state = new EditorState();
    manager = new FurnitureManager(scene, state, 2.8);
  });

  it('handles raw Group (bed)', () => {
    manager.place('bed', 1, 0, 2, 0);
    expect(state.placedCount).toBe(1);
    const mesh = state.placed[0].mesh;
    expect(mesh).toBeInstanceOf(THREE.Group);
    expect(mesh.position.x).toBe(1);
    expect(mesh.position.z).toBe(2);
  });

  it('handles array [Group, meta] (tv)', () => {
    manager.place('tv', 1.35, 1.4, 1.65, Math.PI);
    expect(state.placedCount).toBe(1);
    const mesh = state.placed[0].mesh;
    expect(mesh).toBeInstanceOf(THREE.Group);
    expect(mesh.position.x).toBe(1.35);
    expect(mesh.position.y).toBe(1.4);
    expect(mesh.position.z).toBe(1.65);
  });

  it('handles object { mesh, type } (macBook)', () => {
    manager.place('macBook', 1.05, 0.82, -1.4, 0);
    expect(state.placedCount).toBe(1);
    const mesh = state.placed[0].mesh;
    expect(mesh).toBeInstanceOf(THREE.Group);
    expect(mesh.position.x).toBe(1.05);
    expect(mesh.position.y).toBe(0.82);
  });

  it('handles raw Mesh (poster)', () => {
    manager.placeConfig({ type: 'poster', position: [0, 1.6, 0], rotation: 0, text: 'TEST', color: 0xff0000 });
    expect(state.placedCount).toBe(1);
    const mesh = state.placed[0].mesh;
    expect(mesh).toBeInstanceOf(THREE.Mesh);
  });

  it('handles Group with lights (ceilingLamp)', () => {
    manager.place('ceilingLamp', 0, 2.7, 0, 0);
    expect(state.placedCount).toBe(1);
    const mesh = state.placed[0].mesh;
    expect(mesh).toBeInstanceOf(THREE.Group);
    const hasLight = mesh.children.some((c) => c instanceof THREE.PointLight);
    expect(hasLight).toBe(true);
  });

  it('handles fairyLights (Group with bulbs)', () => {
    manager.place('fairyLights', 0, 2.2, 0, 0);
    expect(state.placedCount).toBe(1);
    const mesh = state.placed[0].mesh;
    expect(mesh).toBeInstanceOf(THREE.Group);
    const bulbs = mesh.children.filter((c) => c instanceof THREE.Mesh && c.geometry instanceof THREE.SphereGeometry);
    expect(bulbs.length).toBeGreaterThan(0);
  });

  it('rejects unknown type gracefully', () => {
    manager.place('nonexistent', 0, 0, 0, 0);
    expect(state.placedCount).toBe(0);
    expect(manager.meshMap.size).toBe(0);
  });
});
