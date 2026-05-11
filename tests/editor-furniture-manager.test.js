/**
 * @fileoverview Tests for FurnitureManager placement, selection, and undo.
 */

import './setup-canvas-mock.js';
import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import '../docs/js/furniture/index.js';
import { FurnitureManager } from '../docs/js/editor-modules/furniture-manager.js';
import { EditorState } from '../docs/js/editor-modules/state.js';
import { UndoManager } from '../docs/js/editor-modules/undo-manager.js';

describe('FurnitureManager', () => {
  let scene, state, undoManager, manager;

  beforeEach(() => {
    scene = new THREE.Scene();
    state = new EditorState();
    undoManager = new UndoManager();
    manager = new FurnitureManager(scene, state, 2.8, undoManager);
  });

  it('places an item and increments nextId', () => {
    const before = manager.nextId;
    manager.place('bed', 1, 0, 2, 0);
    expect(manager.nextId).toBe(before + 1);
    expect(state.placedCount).toBe(1);
    expect(state.placed[0].type).toBe('bed');
  });

  it('selects an item by id', () => {
    manager.place('bed', 1, 0, 2, 0);
    const id = state.placed[0].id;
    manager.select(id);
    expect(state.selectedId).toBe(id);
  });

  it('deselects when select(null) is called', () => {
    manager.place('bed', 1, 0, 2, 0);
    manager.select(state.placed[0].id);
    manager.select(null);
    expect(state.selectedId).toBeNull();
  });

  it('deletes selected item', () => {
    manager.place('bed', 1, 0, 2, 0);
    const id = state.placed[0].id;
    manager.select(id);
    manager.deleteSelected();
    expect(state.placedCount).toBe(0);
    expect(state.selectedId).toBeNull();
  });

  it('rotateSelected changes rotation', () => {
    manager.place('bed', 1, 0, 2, 0);
    const id = state.placed[0].id;
    manager.select(id);
    const before = state.placed[0].config.rotation;
    manager.rotateSelected(90);
    expect(state.placed[0].config.rotation).not.toBe(before);
  });

  it('setRotation normalizes to radians', () => {
    manager.place('bed', 1, 0, 2, 0);
    manager.select(state.placed[0].id);
    manager.setRotation(180);
    expect(state.placed[0].config.rotation).toBeCloseTo(Math.PI, 5);
  });

  it('setY clamps to wall height', () => {
    manager.place('bed', 1, 0, 2, 0);
    manager.select(state.placed[0].id);
    manager.setY(10);
    expect(state.placed[0].config.position[1]).toBe(2.8);
    manager.setY(-1);
    expect(state.placed[0].config.position[1]).toBe(0);
  });

  it('undo removes placed item', () => {
    manager.place('bed', 1, 0, 2, 0);
    expect(state.placedCount).toBe(1);
    manager.undo();
    expect(state.placedCount).toBe(0);
  });

  it('undo restores deleted item', () => {
    manager.place('bed', 1, 0, 2, 0);
    const id = state.placed[0].id;
    manager.select(id);
    manager.deleteSelected();
    expect(state.placedCount).toBe(0);
    manager.undo();
    expect(state.placedCount).toBe(1);
    expect(state.placed[0].type).toBe('bed');
  });

  it('undo restores moved position', () => {
    manager.place('bed', 1, 0, 2, 0);
    const id = state.placed[0].id;
    const startPos = new THREE.Vector3(1, 0, 2);
    manager.updateMove(id, 5, 5);
    manager.endMove(id, startPos);
    manager.undo();
    expect(state.placed[0].config.position[0]).toBe(1);
    expect(state.placed[0].config.position[2]).toBe(2);
  });

  it('redo re-applies undone place', () => {
    manager.place('bed', 1, 0, 2, 0);
    expect(state.placedCount).toBe(1);
    manager.undo();
    expect(state.placedCount).toBe(0);
    manager.redo();
    expect(state.placedCount).toBe(1);
    expect(state.placed[0].type).toBe('bed');
  });

  it('redo re-applies undone delete', () => {
    manager.place('bed', 1, 0, 2, 0);
    const id = state.placed[0].id;
    manager.select(id);
    manager.deleteSelected();
    expect(state.placedCount).toBe(0);
    manager.undo();
    expect(state.placedCount).toBe(1);
    manager.redo();
    expect(state.placedCount).toBe(0);
  });

  it('redo re-applies undone move', () => {
    manager.place('bed', 1, 0, 2, 0);
    const id = state.placed[0].id;
    const startPos = new THREE.Vector3(1, 0, 2);
    manager.updateMove(id, 5, 5);
    manager.endMove(id, startPos);
    manager.undo();
    expect(state.placed[0].config.position[0]).toBe(1);
    expect(state.placed[0].config.position[2]).toBe(2);
    manager.redo();
    expect(state.placed[0].config.position[0]).toBe(5);
    expect(state.placed[0].config.position[2]).toBe(5);
  });

  it('redo re-applies undone rotation', () => {
    manager.place('bed', 1, 0, 2, 0);
    const id = state.placed[0].id;
    manager.select(id);
    manager.rotateSelected(90);
    const afterRotate = state.placed[0].config.rotation;
    manager.undo();
    expect(state.placed[0].config.rotation).toBe(0);
    manager.redo();
    expect(state.placed[0].config.rotation).toBe(afterRotate);
  });

  it('clearAll clears undo stack', () => {
    manager.place('bed', 1, 0, 2, 0);
    manager.clearAll();
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(false);
  });

  it('clearAll removes everything', () => {
    manager.place('bed', 1, 0, 2, 0);
    manager.place('desk', 2, 0, 3, 0);
    manager.clearAll();
    expect(state.placedCount).toBe(0);
    expect(manager.meshMap.size).toBe(0);
  });

  it('hitTest returns closest item by bounding box', () => {
    manager.place('bed', 0, 0, 0, 0);
    manager.place('nightstand', 5, 0, 5, 0);
    const raycaster = new THREE.Raycaster();
    raycaster.set(new THREE.Vector3(0, 5, 0), new THREE.Vector3(0, -1, 0));
    const hit = manager.hitTest(raycaster, Array.from(manager.meshMap.values()));
    expect(hit).toBeDefined();
  });

  it('beginMove returns start position and offset', () => {
    manager.place('bed', 1, 0, 2, 0);
    const id = state.placed[0].id;
    const offset = new THREE.Vector3(0.5, 0, 0.5);
    const result = manager.beginMove(id, offset);
    expect(result.startPos).toBeInstanceOf(THREE.Vector3);
    expect(result.offset).toBe(offset);
    expect(state.selectedId).toBe(id);
  });

  it('updateMove changes position', () => {
    manager.place('bed', 1, 0, 2, 0);
    const id = state.placed[0].id;
    manager.updateMove(id, 3, 4);
    expect(state.placed[0].config.position[0]).toBe(3);
    expect(state.placed[0].config.position[2]).toBe(4);
  });

  it('setX changes x position', () => {
    manager.place('bed', 1, 0, 2, 0);
    manager.select(state.placed[0].id);
    manager.setX(5.5);
    expect(state.placed[0].config.position[0]).toBe(5.5);
    expect(state.placed[0].mesh.position.x).toBe(5.5);
  });

  it('setZ changes z position', () => {
    manager.place('bed', 1, 0, 2, 0);
    manager.select(state.placed[0].id);
    manager.setZ(-3.2);
    expect(state.placed[0].config.position[2]).toBe(-3.2);
    expect(state.placed[0].mesh.position.z).toBe(-3.2);
  });

  it('setName updates item name', () => {
    manager.place('bed', 1, 0, 2, 0);
    manager.select(state.placed[0].id);
    manager.setName('My Bed');
    expect(state.placed[0].name).toBe('My Bed');
  });

  it('name defaults to empty string', () => {
    manager.place('bed', 1, 0, 2, 0);
    expect(state.placed[0].name).toBe('');
  });

  it('redo restores place action with the same id', () => {
    manager.place('bed', 1, 0, 2, 0);
    const id = state.placed[0].id;
    expect(manager.meshMap.has(id)).toBe(true);

    manager.undo();
    expect(manager.meshMap.has(id)).toBe(false);

    manager.redo();
    expect(manager.meshMap.has(id)).toBe(true);
    expect(state.placed[0].id).toBe(id);
    expect(state.placed[0].type).toBe('bed');
  });
});
