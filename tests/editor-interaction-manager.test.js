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
      onDragEnd: vi.fn(),
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

  it('disables controls when starting an outline edge drag', () => {
    const mockControls = { enabled: true };
    mockOutlineEditor.onPointerDown = vi.fn(() => {
      state.isDragging = true;
      state.dragTarget = 'edge';
      return true;
    });
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
      controls: mockControls,
    });
    state.activeTool = 'outline';
    const e = new PointerEvent('pointerdown', { button: 0, clientX: 400, clientY: 300 });
    im2.onPointerDown(e);
    expect(mockControls.enabled).toBe(false);
  });

  it('disables controls when starting a furniture drag', () => {
    const mockControls = { enabled: true };
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    mesh.userData._editorId = 42;
    mesh.userData._hitSize = 1;
    mockFurnitureManager.meshMap.set(42, mesh);
    mockFurnitureManager.hitTest = vi.fn(() => mesh);
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
      controls: mockControls,
    });
    const e = new PointerEvent('pointerdown', { button: 0, clientX: 400, clientY: 300 });
    im2.onPointerDown(e);
    expect(mockControls.enabled).toBe(false);
  });

  it('re-enables controls on pointerup after drag', () => {
    const mockControls = { enabled: false };
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
      controls: mockControls,
    });
    state.isDragging = true;
    state.dragTarget = 'furniture';
    state.dragStartPos = new THREE.Vector3(1, 0, 2);
    state.selectedId = 1;
    im2.onPointerUp();
    expect(mockControls.enabled).toBe(true);
  });

  it('re-enables controls on pointercancel after drag', () => {
    const mockControls = { enabled: false };
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
      controls: mockControls,
    });
    state.isDragging = true;
    state.dragTarget = 'furniture';
    state.dragStartPos = new THREE.Vector3(1, 0, 2);
    state.selectedId = 1;
    im2.onPointerCancel();
    expect(mockControls.enabled).toBe(true);
    expect(state.isDragging).toBe(false);
  });

  it('does not start a new drag if already dragging', () => {
    mockOutlineEditor.onPointerDown = vi.fn(() => {
      state.isDragging = true;
      state.dragTarget = 'edge';
      return true;
    });
    state.isDragging = true;
    state.dragTarget = 'furniture';
    state.activeTool = 'outline';
    const e = new PointerEvent('pointerdown', { button: 0, clientX: 400, clientY: 300 });
    im.onPointerDown(e);
    expect(mockOutlineEditor.onPointerDown).not.toHaveBeenCalled();
    expect(state.dragTarget).toBe('furniture');
  });

  it('falls through to furniture when outlineEditor does not handle the event', () => {
    const mockControls = { enabled: true };
    mockOutlineEditor.onPointerDown = vi.fn(() => false);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    mesh.userData._editorId = 99;
    mesh.userData._hitSize = 1;
    mockFurnitureManager.meshMap.set(99, mesh);
    mockFurnitureManager.hitTest = vi.fn(() => mesh);
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
      controls: mockControls,
    });
    state.activeTool = 'outline';
    const e = new PointerEvent('pointerdown', { button: 0, clientX: 400, clientY: 300 });
    im2.onPointerDown(e);
    expect(mockFurnitureManager.select).toHaveBeenCalledWith(99);
    expect(mockControls.enabled).toBe(false);
  });

  it('does not disable controls when outlineEditor handles but does not start a drag', () => {
    const mockControls = { enabled: true };
    mockOutlineEditor.onPointerDown = vi.fn(() => true); // handled, but no drag started
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
      controls: mockControls,
    });
    state.activeTool = 'outline';
    const e = new PointerEvent('pointerdown', { button: 0, clientX: 400, clientY: 300 });
    im2.onPointerDown(e);
    expect(mockControls.enabled).toBe(true);
  });

  it('clears edge drag state on pointercancel', () => {
    const mockControls = { enabled: false };
    state.isDragging = true;
    state.dragTarget = 'edge';
    state.dragEdgeIndex = 1;
    state.dragEdgeVerts = [[0, 0], [2, 0]];
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
      controls: mockControls,
    });
    im2.onPointerCancel();
    expect(state.isDragging).toBe(false);
    expect(state.dragTarget).toBeNull();
    expect(state.dragEdgeIndex).toBeNull();
    expect(state.dragEdgeVerts).toBeNull();
    expect(mockControls.enabled).toBe(true);
  });

  it('uses live controls via getter when controls is a function', () => {
    const oldControls = { enabled: true };
    const newControls = { enabled: false };
    let currentControls = oldControls;
    mockOutlineEditor.onPointerDown = vi.fn(() => {
      state.isDragging = true;
      state.dragTarget = 'edge';
      return true;
    });
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
      controls: () => currentControls,
    });
    state.activeTool = 'outline';
    const e = new PointerEvent('pointerdown', { button: 0, clientX: 400, clientY: 300 });
    im2.onPointerDown(e);
    expect(oldControls.enabled).toBe(false);

    // Simulate view-mode toggle: swap to new controls instance
    currentControls = newControls;
    oldControls.enabled = true;
    im2.onPointerUp();
    expect(newControls.enabled).toBe(true);
    expect(oldControls.enabled).toBe(true); // old was already true, but new got enabled
  });

  it('does not crash when controls is null', () => {
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
      controls: null,
    });
    state.isDragging = true;
    state.dragTarget = 'furniture';
    state.dragStartPos = new THREE.Vector3(1, 0, 2);
    state.selectedId = 1;
    expect(() => im2.onPointerUp()).not.toThrow();
    expect(() => im2.onPointerCancel()).not.toThrow();
  });

  it('ignores pointerdown with non-left button even when already dragging', () => {
    state.isDragging = true;
    state.dragTarget = 'furniture';
    const e = new PointerEvent('pointerdown', { button: 2, clientX: 400, clientY: 300 });
    im.onPointerDown(e);
    expect(state.dragTarget).toBe('furniture');
  });
});
