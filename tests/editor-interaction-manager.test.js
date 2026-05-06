/**
 * @fileoverview Tests for InteractionManager event dispatching.
 */

import './setup-canvas-mock.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { InteractionManager } from '../docs/js/editor-modules/interaction-manager.js';
import { EditorState } from '../docs/js/editor-modules/state.js';

describe('InteractionManager', () => {
  let state, im, mockFurnitureManager, mockOutlineEditor, mockSpawnManager;

  beforeEach(() => {
    state = new EditorState();

    mockFurnitureManager = {
      hitTest: vi.fn(() => null),
      select: vi.fn(),
      place: vi.fn(),
      updateMove: vi.fn(),
      endMove: vi.fn(),
      undo: vi.fn(),
      deleteSelected: vi.fn(),
      rotateSelected: vi.fn(),
      meshMap: new Map(),
    };

    mockOutlineEditor = {
      onPointerDown: vi.fn(),
      onPointerMove: vi.fn(),
      onDeleteKey: vi.fn(),
    };

    mockSpawnManager = {
      moveDrag: vi.fn(),
      setSpawn: vi.fn(),
      _group: new THREE.Group(),
    };

    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });

    const renderer = {
      domElement: canvas,
    };

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 8, 0);
    camera.lookAt(0, 0, 0);

    const floorPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshBasicMaterial()
    );
    floorPlane.rotation.x = -Math.PI / 2;

    im = new InteractionManager({
      renderer,
      camera,
      state,
      floorPlane,
      furnitureManager: mockFurnitureManager,
      outlineEditor: mockOutlineEditor,
      spawnManager: mockSpawnManager,
      roomBuilder: {},
      config: { wallH: 2.8 },
      snap: (v) => Math.round(v / 0.05) * 0.05,
    });
  });

  it('dispatches pointerdown to outlineEditor when activeTool is outline', () => {
    state.activeTool = 'outline';
    const e = new PointerEvent('pointerdown', { button: 0, clientX: 400, clientY: 300 });
    im.onPointerDown(e);
    expect(mockOutlineEditor.onPointerDown).toHaveBeenCalled();
  });

  it('calls furnitureManager.select(null) on floor click with no tool', () => {
    const e = new PointerEvent('pointerdown', { button: 0, clientX: 400, clientY: 300 });
    im.onPointerDown(e);
    expect(mockFurnitureManager.select).toHaveBeenCalledWith(null);
  });

  it('calls spawnManager.setSpawn on floor click with player tool', () => {
    state.activeTool = 'player';
    const e = new PointerEvent('pointerdown', { button: 0, clientX: 400, clientY: 300 });
    im.onPointerDown(e);
    expect(mockSpawnManager.setSpawn).toHaveBeenCalledWith('player', expect.any(Number), expect.any(Number));
  });

  it('calls furnitureManager.place on floor click with place tool', () => {
    state.activeTool = 'place:bed';
    const e = new PointerEvent('pointerdown', { button: 0, clientX: 400, clientY: 300 });
    im.onPointerDown(e);
    expect(mockFurnitureManager.place).toHaveBeenCalledWith('bed', expect.any(Number), 0, expect.any(Number));
  });

  it('ignores non-left clicks', () => {
    const e = new PointerEvent('pointerdown', { button: 2, clientX: 400, clientY: 300 });
    im.onPointerDown(e);
    expect(mockOutlineEditor.onPointerDown).not.toHaveBeenCalled();
    expect(mockFurnitureManager.select).not.toHaveBeenCalled();
  });

  it('calls furnitureManager.undo on Ctrl+Z', () => {
    const e = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
    im.onKeyDown(e);
    expect(mockFurnitureManager.undo).toHaveBeenCalled();
  });

  it('calls outlineEditor.onDeleteKey on Delete when outline tool active', () => {
    state.activeTool = 'outline';
    const e = new KeyboardEvent('keydown', { key: 'Delete' });
    im.onKeyDown(e);
    expect(mockOutlineEditor.onDeleteKey).toHaveBeenCalled();
    expect(mockFurnitureManager.deleteSelected).not.toHaveBeenCalled();
  });

  it('calls furnitureManager.deleteSelected on Delete normally', () => {
    const e = new KeyboardEvent('keydown', { key: 'Delete' });
    im.onKeyDown(e);
    expect(mockFurnitureManager.deleteSelected).toHaveBeenCalled();
  });

  it('calls furnitureManager.rotateSelected on R key', () => {
    const e = new KeyboardEvent('keydown', { key: 'r' });
    im.onKeyDown(e);
    expect(mockFurnitureManager.rotateSelected).toHaveBeenCalledWith(45);
  });

  it('clears drag state on pointerup', () => {
    state.isDragging = true;
    state.dragTarget = 'furniture';
    const startPos = new THREE.Vector3(1, 0, 2);
    state.dragStartPos = startPos;
    state.selectedId = 1;
    im.onPointerUp();
    expect(state.isDragging).toBe(false);
    expect(state.dragTarget).toBeNull();
    expect(mockFurnitureManager.endMove).toHaveBeenCalledWith(1, startPos);
  });

  it('calls onDragMove during furniture drag', () => {
    const onDragMove = vi.fn();
    const im2 = new InteractionManager({
      renderer: im._renderer,
      camera: im._camera,
      state,
      floorPlane: im._floorPlane,
      furnitureManager: mockFurnitureManager,
      outlineEditor: mockOutlineEditor,
      spawnManager: mockSpawnManager,
      roomBuilder: {},
      config: { wallH: 2.8 },
      snap: (v) => v,
      onDragMove,
    });
    state.isDragging = true;
    state.dragTarget = 'furniture';
    state.selectedId = 1;
    const e = new PointerEvent('pointermove', { clientX: 400, clientY: 300 });
    im2.onPointerMove(e);
    expect(onDragMove).toHaveBeenCalled();
  });

  it('calls onDragEnd after pointerup', () => {
    const onDragEnd = vi.fn();
    const im2 = new InteractionManager({
      renderer: im._renderer,
      camera: im._camera,
      state,
      floorPlane: im._floorPlane,
      furnitureManager: mockFurnitureManager,
      outlineEditor: mockOutlineEditor,
      spawnManager: mockSpawnManager,
      roomBuilder: {},
      config: { wallH: 2.8 },
      snap: (v) => v,
      onDragEnd,
    });
    state.isDragging = true;
    state.dragTarget = 'furniture';
    state.dragStartPos = new THREE.Vector3(1, 0, 2);
    state.selectedId = 1;
    im2.onPointerUp();
    expect(onDragEnd).toHaveBeenCalled();
  });
});
