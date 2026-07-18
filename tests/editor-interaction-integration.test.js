/**
 * @fileoverview Integration tests for InteractionManager + OutlineEditor + FurnitureManager
 * covering 3D view controls, drag recovery, and tool passthrough.
 */


import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import '../docs/js/furniture/index.js';
import { InteractionManager } from '../docs/js/editor-modules/interaction-manager.js';
import { OutlineEditor } from '../docs/js/editor-modules/outline-editor.js';
import { EditorState } from '../docs/js/editor-modules/state.js';
import { RoomBuilder } from '../docs/js/editor-modules/room-builder.js';
import { FurnitureManager } from '../docs/js/editor-modules/furniture-manager.js';
import { UndoManager } from '../docs/js/editor-modules/undo-manager.js';
import { isSelfIntersecting } from '../docs/js/editor-utils.js';
import { getClosestEdgePoint } from '../docs/js/primitives.js';

describe('InteractionManager integration', () => {
  let state, im, outlineEditor, furnitureManager, roomBuilder, mockControls;
  let scene, roomGroup, outlineGroup;

  const CONFIG = {
    colors: {
      vertex: 0x7c3aed,
      vertexSelected: 0xec4899,
      edgeHandle: 0x06b6d4,
      edgeHandleSelected: 0xec4899,
      edgeLine: 0x7c3aed,
      outlineOpacity: 0.5,
    },
    geometry: {
      vertexRadius: 0.08,
      edgeHandleSize: 0.14,
    },
    wallH: 2.8,
    wallT: 0.2,
  };

  function snap(v) {
    return Math.round(v / 0.05) * 0.05;
  }

  beforeEach(() => {
    state = new EditorState();
    scene = new THREE.Scene();
    roomGroup = new THREE.Group();
    scene.add(roomGroup);
    outlineGroup = new THREE.Group();
    scene.add(outlineGroup);

    const floorPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshBasicMaterial()
    );
    floorPlane.rotation.x = -Math.PI / 2;

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 8, 0);
    camera.lookAt(0, 0, 0);

    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });

    const renderer = { domElement: canvas };

    roomBuilder = new RoomBuilder(roomGroup, scene, { wallH: CONFIG.wallH, wallT: CONFIG.wallT });
    roomBuilder.rebuild(state.outline, state.mat);

    const undoManager = new UndoManager();
    furnitureManager = new FurnitureManager(scene, state, CONFIG.wallH, undoManager);

    outlineEditor = new OutlineEditor(
      outlineGroup, state, roomBuilder, CONFIG, () => camera,
      snap, isSelfIntersecting, getClosestEdgePoint
    );
    outlineEditor.rebuild();

    mockControls = { enabled: true };

    im = new InteractionManager({
      renderer,
      camera: () => camera,
      state,
      floorPlane,
      furnitureManager,
      outlineEditor,
      spawnManager: { moveDrag: vi.fn(), setSpawn: vi.fn(), _group: new THREE.Group() },
      roomBuilder: {},
      config: CONFIG,
      snap,
      controls: mockControls,
    });
  });

  it('allows selecting furniture in outline mode when clicking away from edges', () => {
    state.activeTool = 'outline';
    // Place a bed and mock hitTest to simulate a direct hit
    furnitureManager.place('bed', 0, 0, 0);
    const placed = Array.from(furnitureManager.meshMap.values())[0];
    placed.userData._hitSize = 1;
    vi.spyOn(furnitureManager, 'hitTest').mockReturnValue(placed);

    // Simulate a click far from any wall edge but on the furniture
    vi.spyOn(outlineEditor, '_intersectHandle').mockReturnValue(null);

    const e = new PointerEvent('pointerdown', { button: 0, clientX: 400, clientY: 300 });
    im.onPointerDown(e);

    expect(state.selectedId).toBe(1);
    expect(mockControls.enabled).toBe(false);
  });

  it('recovers from a stuck drag state via pointercancel', () => {
    // Simulate a drag that got stuck (no pointerup fired)
    state.isDragging = true;
    state.dragTarget = 'edge';
    state.dragEdgeIndex = 0;
    state.dragEdgeVerts = [[-2.25, -1.75], [2.25, -1.75]];
    mockControls.enabled = false;

    im.onPointerCancel();

    expect(state.isDragging).toBe(false);
    expect(state.dragTarget).toBeNull();
    expect(state.dragEdgeIndex).toBeNull();
    expect(mockControls.enabled).toBe(true);
  });

  it('does not start overlapping drags when multiple rapid clicks occur', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    mesh.userData._editorId = 1;
    mesh.userData._hitSize = 1;
    furnitureManager.meshMap.set(1, mesh);
    furnitureManager._placedMeshes = furnitureManager.meshMap;
    furnitureManager._scene.add(mesh);

    // Manually mock hitTest on the InteractionManager side by overriding the furnitureManager
    const hitTestSpy = vi.spyOn(furnitureManager, 'hitTest').mockReturnValue(mesh);

    const e1 = new PointerEvent('pointerdown', { button: 0, clientX: 400, clientY: 300 });
    im.onPointerDown(e1);

    expect(state.isDragging).toBe(true);
    expect(state.dragTarget).toBe('furniture');

    // Second click should be ignored
    const e2 = new PointerEvent('pointerdown', { button: 0, clientX: 410, clientY: 310 });
    im.onPointerDown(e2);

    expect(hitTestSpy).toHaveBeenCalledTimes(1);
  });

  it('re-enables controls even if pointerup fires without an event object', () => {
    state.isDragging = true;
    state.dragTarget = 'furniture';
    state.dragStartPos = new THREE.Vector3(1, 0, 2);
    state.selectedId = 1;
    mockControls.enabled = false;

    im.onPointerUp();

    expect(mockControls.enabled).toBe(true);
    expect(state.isDragging).toBe(false);
  });

  it('preserves camera controls when clicking empty floor in outline mode far from walls', () => {
    state.activeTool = 'outline';
    vi.spyOn(outlineEditor, '_intersectHandle').mockReturnValue(null);

    const e = new PointerEvent('pointerdown', { button: 0, clientX: 400, clientY: 300 });
    im.onPointerDown(e);

    // No drag started, controls should remain enabled
    expect(state.isDragging).toBe(false);
    expect(mockControls.enabled).toBe(true);
  });
});
