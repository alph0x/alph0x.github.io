/**
 * @fileoverview Tests for OutlineEditor drag mutations and self-intersection guard.
 */

import './setup-canvas-mock.js';
import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { OutlineEditor } from '../docs/js/editor-modules/outline-editor.js';
import { EditorState } from '../docs/js/editor-modules/state.js';
import { RoomBuilder } from '../docs/js/editor-modules/room-builder.js';
import { isSelfIntersecting, getClosestEdgePoint } from '../docs/js/editor-utils.js';

describe('OutlineEditor drag', () => {
  let scene, roomGroup, roomBuilder, state, outlineGroup, editor;

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
  };

  function snap(v) {
    return Math.round(v / 0.05) * 0.05;
  }

  beforeEach(() => {
    scene = new THREE.Scene();
    roomGroup = new THREE.Group();
    scene.add(roomGroup);
    roomBuilder = new RoomBuilder(roomGroup, scene, { wallH: 2.8, wallT: 0.2 });
    state = new EditorState();
    outlineGroup = new THREE.Group();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    editor = new OutlineEditor(
      outlineGroup, state, roomBuilder, CONFIG, () => camera,
      snap, isSelfIntersecting, getClosestEdgePoint
    );
  });

  it('moves a vertex via _moveDragVertex', () => {
    state.outline = [[0, 0], [2, 0], [2, 2], [0, 2]];
    editor.rebuild();

    editor._state.isDragging = true;
    editor._state.dragTarget = 'vertex';
    editor._state.dragVertexIndex = 1;

    editor._moveDragVertex({ x: 3, z: 0 });

    expect(state.outline[1]).toEqual([snap(3), 0]);
  });

  it('rejects vertex move that would self-intersect', () => {
    // Pentagon shape: moving vertex 2 down will cross edge 0
    state.outline = [[0, 0], [2, 0], [1, 1], [2, 2], [0, 2]];
    editor.rebuild();

    const original = JSON.parse(JSON.stringify(state.outline));

    editor._state.isDragging = true;
    editor._state.dragTarget = 'vertex';
    editor._state.dragVertexIndex = 2;

    // Move vertex 2 down below edge 0 — creates crossing
    editor._moveDragVertex({ x: 1, z: -1 });

    // Should remain unchanged due to self-intersection guard
    expect(state.outline).toEqual(original);
  });

  it('moves an edge via _moveDragEdge', () => {
    state.outline = [[0, 0], [2, 0], [2, 2], [0, 2]];
    editor.rebuild();

    editor._state.isDragging = true;
    editor._state.dragTarget = 'edge';
    editor._state.dragEdgeIndex = 0;
    editor._state.dragOffset = new THREE.Vector3(0, 0, 0);
    editor._state.dragEdgeVerts = [
      [state.outline[0][0], state.outline[0][1]],
      [state.outline[1][0], state.outline[1][1]],
    ];

    editor._moveDragEdge({ x: 0, z: 1 });

    expect(state.outline[0][1]).toBe(snap(1));
    expect(state.outline[1][1]).toBe(snap(1));
  });

  it('rejects edge move that would self-intersect', () => {
    // Pentagon shape: moving edge 1 left will cross edge 4 (left wall)
    state.outline = [[0, 0], [2, 0], [1, 1], [2, 2], [0, 2]];
    editor.rebuild();

    const original = JSON.parse(JSON.stringify(state.outline));

    editor._state.isDragging = true;
    editor._state.dragTarget = 'edge';
    editor._state.dragEdgeIndex = 1;
    editor._state.dragOffset = new THREE.Vector3(0, 0, 0);
    editor._state.dragEdgeVerts = [
      [state.outline[1][0], state.outline[1][1]],
      [state.outline[2][0], state.outline[2][1]],
    ];

    // Move edge 1 far left — crossing edge 4 (x=0 vertical)
    editor._moveDragEdge({ x: -3, z: 0 });

    // Should remain unchanged
    expect(state.outline).toEqual(original);
  });

  it('updates edge colors after drag to new axis-parallel state', () => {
    // House shape with two diagonal edges on the roof
    state.outline = [[0, 0], [2, 0], [2, 1], [1, 2], [0, 1]];
    editor.rebuild();

    const edgesBefore = outlineGroup.children.filter((c) => c.userData.isEdge);
    const nonParallelBefore = edgesBefore.filter((e) => !e.userData.isAxisParallel).length;
    expect(nonParallelBefore).toBe(2); // roof edges are diagonal

    // Flatten the roof by dragging vertex 3 down
    editor._state.isDragging = true;
    editor._state.dragTarget = 'vertex';
    editor._state.dragVertexIndex = 3;
    editor._moveDragVertex({ x: 1, z: 1 });

    editor.rebuild();
    const edgesAfter = outlineGroup.children.filter((c) => c.userData.isEdge);
    const nonParallelAfter = edgesAfter.filter((e) => !e.userData.isAxisParallel).length;
    expect(nonParallelAfter).toBe(0); // all edges now axis-parallel
  });
});
