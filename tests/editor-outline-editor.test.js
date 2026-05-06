/**
 * @fileoverview Tests for OutlineEditor handle construction and mutations.
 */

import './setup-canvas-mock.js';
import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { OutlineEditor } from '../docs/js/editor-modules/outline-editor.js';
import { EditorState } from '../docs/js/editor-modules/state.js';
import { RoomBuilder } from '../docs/js/editor-modules/room-builder.js';
import { isSelfIntersecting, getClosestEdgePoint } from '../docs/js/editor-utils.js';

describe('OutlineEditor', () => {
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

  it('rebuild creates edge lines, edge handles, and vertex handles', () => {
    editor.rebuild();
    const edges = outlineGroup.children.filter((c) => c.userData.isEdge);
    const verts = outlineGroup.children.filter((c) => c.userData.isVertex);
    const lines = outlineGroup.children.filter((c) => c instanceof THREE.LineSegments);
    expect(edges.length).toBe(4);
    expect(verts.length).toBe(4);
    expect(lines.length).toBe(1);
  });

  it('rebuild matches state.outline length', () => {
    state.outline = [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 1.5]];
    editor.rebuild();
    const verts = outlineGroup.children.filter((c) => c.userData.isVertex);
    expect(verts.length).toBe(5);
  });

  it('syncVisibility shows group when activeTool is outline', () => {
    state.activeTool = 'outline';
    editor.syncVisibility();
    expect(outlineGroup.visible).toBe(true);
  });

  it('syncVisibility hides group when activeTool is null', () => {
    state.activeTool = null;
    editor.syncVisibility();
    expect(outlineGroup.visible).toBe(false);
  });

  it('onDeleteKey removes last vertex when > 3 vertices', () => {
    state.outline = [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 1.5]];
    editor.rebuild();
    editor.onDeleteKey();
    expect(state.outline.length).toBe(4);
  });

  it('onDeleteKey does nothing when exactly 3 vertices', () => {
    state.outline = [[0, 0], [1, 0], [0, 1]];
    editor.rebuild();
    editor.onDeleteKey();
    expect(state.outline.length).toBe(3);
  });

  it('rebuild clears previous handles', () => {
    editor.rebuild();
    const count1 = outlineGroup.children.length;
    state.outline = [[0, 0], [2, 0], [2, 2], [0, 2]];
    editor.rebuild();
    const count2 = outlineGroup.children.length;
    expect(count2).toBe(count1);
  });

  it('countAxisParallel returns 4 for rectangle', () => {
    state.outline = [[0, 0], [2, 0], [2, 2], [0, 2]];
    editor.rebuild();
    expect(editor.countAxisParallel()).toBe(4);
  });

  it('countAxisParallel returns 2 for trapezoid with two horizontal edges', () => {
    state.outline = [[0, 0], [2, 0], [1.5, 1], [0.5, 1]];
    editor.rebuild();
    expect(editor.countAxisParallel()).toBe(2);
  });

  it('axis-parallel edges are colored green', () => {
    state.outline = [[0, 0], [2, 0], [2, 2], [0, 2]];
    editor.rebuild();
    const edges = outlineGroup.children.filter((c) => c.userData.isEdge);
    const green = 0x10b981;
    for (const edge of edges) {
      expect(edge.material.color.getHex()).toBe(green);
      expect(edge.userData.isAxisParallel).toBe(true);
    }
  });

  it('non-axis-parallel edges keep default color', () => {
    state.outline = [[0, 0], [2, 0], [1.5, 1], [0.5, 1]];
    editor.rebuild();
    const edges = outlineGroup.children.filter((c) => c.userData.isEdge);
    const parallel = edges.filter((e) => e.userData.isAxisParallel);
    const nonParallel = edges.filter((e) => !e.userData.isAxisParallel);
    expect(parallel.length).toBe(2);
    expect(nonParallel.length).toBe(2);
    for (const edge of nonParallel) {
      expect(edge.material.color.getHex()).toBe(CONFIG.colors.edgeHandle);
    }
  });
});
