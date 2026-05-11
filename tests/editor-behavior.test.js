/**
 * @fileoverview Integration tests for editor.js post-init behavior.
 * Covers camera switching, UI bindings, guide group, dimensions, export, and error handling.
 */

import './setup-canvas-mock.js';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import * as THREE from 'three';

// Mock THREE.WebGLRenderer before editor imports it
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  class FakeRenderer {
    constructor() {
      this.domElement = document.createElement('canvas');
      this.domElement.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });
    }
    setSize() {}
    setPixelRatio() {}
    render() {}
  }
  return { ...actual, WebGLRenderer: FakeRenderer };
});

function buildEditorDOM() {
  document.body.innerHTML = `
    <div id="canvas-wrap" style="width:800px;height:600px;"></div>
    <div id="preview-wrap" style="display:none;"><div class="preview-label"></div></div>
    <div id="palette"></div>
    <div id="placedList"></div>
    <div id="selectionInfo"></div>
    <input id="selX" /><input id="selY" /><input id="selYRange" />
    <input id="selZ" /><input id="selRot" />
    <input id="selName" />
    <button id="toolPlayer"></button><button id="toolLulu"></button>
    <button id="toolOutline"></button><button id="btnResetRect"></button>
    <button id="btnViewMode"></button><button id="btnRotate"></button>
    <button id="btnDelete"></button><button id="btnUndo"></button>
    <button id="btnRedo"></button><button id="btnExport"></button>
    <input id="colorFloor" value="#1c1917"/><input id="colorFloorText" value="#1c1917"/>
    <input id="colorWall" value="#44403c"/><input id="colorWallText" value="#44403c"/>
    <input id="colorCeiling" value="#1c1917"/><input id="colorCeilingText" value="#1c1917"/>
    <textarea id="exportOutput"></textarea>
    <div id="roomDimensions"></div>
    <div id="roomAxisAligned"></div>
    <div id="error-display" style="display:none"></div>
  `;
}

function resetEditorState() {
  const s = window.__editorState;
  if (!s) return;
  s.viewMode = 'top';
  s.activeTool = null;
  s.selectedId = null;
  s.isDragging = false;
  s.dragTarget = null;
  s.dragVertexIndex = null;
  s.dragEdgeIndex = null;
  s.dragEdgeVerts = null;
  s.dragStartPos = null;
  s.outline = [
    [-2.25, -1.75],
    [2.25, -1.75],
    [2.25, 1.75],
    [-2.25, 1.75],
  ];
  // Clear placed items without touching nextId counter
  s.placed = [];
  // Hide selection info
  const info = document.getElementById('selectionInfo');
  if (info) info.classList.remove('visible');
}

describe('Editor behavior', () => {
  beforeAll(async () => {
    buildEditorDOM();
    await import('../docs/js/editor.js');
  });

  beforeEach(() => {
    resetEditorState();
    const fm = window.__furnitureManager;
    if (fm) {
      fm.clearAll();
    }
    // Reset view mode to top if a previous test left it in 3d
    const btnView = document.getElementById('btnViewMode');
    if (window.__editorState.viewMode === '3d' && btnView) {
      btnView.click();
    }
    // Deactivate all tools
    const toolOutline = document.getElementById('toolOutline');
    if (toolOutline && window.__editorState.activeTool === 'outline') {
      toolOutline.click();
    }
  });

  it('initializes in top view mode', () => {
    expect(window.__editorState.viewMode).toBe('top');
  });

  it('switches to 3D view when clicking btnViewMode', () => {
    const btn = document.getElementById('btnViewMode');
    btn.click();
    expect(window.__editorState.viewMode).toBe('3d');
    expect(btn.textContent).toContain('Top View');
  });

  it('switches back to top view when clicking btnViewMode again', () => {
    const btn = document.getElementById('btnViewMode');
    btn.click(); // to 3d
    btn.click(); // back to top
    expect(window.__editorState.viewMode).toBe('top');
    expect(btn.textContent).toContain('3D View');
  });

  it('activates outline tool and sets activeTool to outline', () => {
    const btn = document.getElementById('toolOutline');
    btn.click();
    expect(window.__editorState.activeTool).toBe('outline');
    expect(btn.classList.contains('active')).toBe(true);
  });

  it('deactivates outline tool when clicking again', () => {
    const btn = document.getElementById('toolOutline');
    btn.click();
    btn.click();
    expect(window.__editorState.activeTool).toBeNull();
    expect(btn.classList.contains('active')).toBe(false);
  });

  it('resets room to rectangle when clicking btnResetRect', () => {
    // Mutate outline first
    window.__editorState.outline = [[0, 0], [1, 0], [1, 1], [0, 1]];
    document.getElementById('btnResetRect').click();
    expect(window.__editorState.outline).toEqual([
      [-2.25, -1.75],
      [2.25, -1.75],
      [2.25, 1.75],
      [-2.25, 1.75],
    ]);
  });

  it('displays room dimensions after init', () => {
    const dimEl = document.getElementById('roomDimensions');
    expect(dimEl.textContent).toMatch(/\d+\.\d+ × \d+\.\d+ m/);
  });

  it('updates dimensions after resetting rectangle', () => {
    window.__editorState.outline = [[0, 0], [1, 0], [1, 1], [0, 1]];
    document.getElementById('btnResetRect').click();
    const dimEl = document.getElementById('roomDimensions');
    expect(dimEl.textContent).toContain('4.50 × 3.50 m');
  });

  it('exports a seed when clicking btnExport', () => {
    document.getElementById('btnExport').click();
    const output = document.getElementById('exportOutput');
    expect(output.value).toContain('DEFAULT_SEED');
    expect(output.value).toContain('deserializeSeed');
  });

  it('does not show error display on clean init', () => {
    const errorDisplay = document.getElementById('error-display');
    expect(errorDisplay.style.display).not.toBe('block');
  });

  it('has global helper functions exposed', () => {
    expect(typeof window.__editorSelectItem).toBe('function');
    expect(typeof window.__editorProject).toBe('function');
    expect(window.__editorState).toBeDefined();
    expect(window.__furnitureManager).toBeDefined();
  });

  it('places furniture via furniture manager', () => {
    const fm = window.__furnitureManager;
    fm.place('bed', 1, 0, 2);
    expect(fm.meshMap.size).toBe(1);
    expect(window.__editorState.placed.length).toBe(1);
    expect(window.__editorState.placed[0].type).toBe('bed');
  });

  it('selects placed furniture via global helper', () => {
    const fm = window.__furnitureManager;
    fm.place('bed', 1, 0, 2);
    const id = window.__editorState.placed[0].id;
    window.__editorSelectItem(id);
    expect(window.__editorState.selectedId).toBe(id);
  });

  it('rotates selected furniture on R key via interaction manager', () => {
    const fm = window.__furnitureManager;
    fm.place('bed', 1, 0, 2);
    const id = window.__editorState.placed[0].id;
    fm.select(id);
    const before = fm.meshMap.get(id).rotation.y;
    // Simulate keydown on document (InteractionManager listens on document)
    const e = new KeyboardEvent('keydown', { key: 'r' });
    document.dispatchEvent(e);
    const after = fm.meshMap.get(id).rotation.y;
    expect(after).toBe(before + (45 * Math.PI) / 180);
  });

  it('deletes selected furniture on Delete key', () => {
    const fm = window.__furnitureManager;
    fm.place('bed', 1, 0, 2);
    const id = window.__editorState.placed[0].id;
    fm.select(id);
    const e = new KeyboardEvent('keydown', { key: 'Delete' });
    document.dispatchEvent(e);
    expect(window.__editorState.selectedId).toBeNull();
    expect(fm.meshMap.has(id)).toBe(false);
  });

  it('clears furniture on clearAll', () => {
    const fm = window.__furnitureManager;
    fm.place('bed', 1, 0, 2);
    fm.place('desk', 2, 0, 3);
    fm.clearAll();
    expect(fm.meshMap.size).toBe(0);
    expect(window.__editorState.placed.length).toBe(0);
  });

  it('rotates selected furniture via btnRotate click', () => {
    const fm = window.__furnitureManager;
    fm.place('bed', 1, 0, 2);
    const id = window.__editorState.placed[0].id;
    fm.select(id);
    const before = fm.meshMap.get(id).rotation.y;
    document.getElementById('btnRotate').click();
    const after = fm.meshMap.get(id).rotation.y;
    expect(after).toBe(before + (45 * Math.PI) / 180);
  });

  it('deletes selected furniture via btnDelete click', () => {
    const fm = window.__furnitureManager;
    fm.place('bed', 1, 0, 2);
    const id = window.__editorState.placed[0].id;
    fm.select(id);
    document.getElementById('btnDelete').click();
    expect(window.__editorState.selectedId).toBeNull();
    expect(fm.meshMap.has(id)).toBe(false);
  });

  it('undoes a furniture placement via btnUndo click', () => {
    const fm = window.__furnitureManager;
    fm.place('bed', 1, 0, 2);
    expect(fm.meshMap.size).toBe(1);
    document.getElementById('btnUndo').click();
    expect(fm.meshMap.size).toBe(0);
  });

  it('redoes an undone furniture rotation via fm.redo()', () => {
    const fm = window.__furnitureManager;
    fm.clearAll();
    fm.place('bed', 1, 0, 2);
    const id = window.__editorState.placed[0].id;
    const beforeRot = fm.meshMap.get(id).rotation.y;
    fm.rotateSelected(45);
    const afterRot = fm.meshMap.get(id).rotation.y;
    expect(afterRot).not.toBe(beforeRot);
    fm.undo();
    expect(fm.meshMap.get(id).rotation.y).toBe(beforeRot);
    fm.redo();
    expect(fm.meshMap.get(id).rotation.y).toBe(afterRot);
  });

  it('updates floor color via colorFloor input', () => {
    const input = document.getElementById('colorFloor');
    input.value = '#ff0000';
    input.dispatchEvent(new Event('input'));
    expect(window.__editorState.mat.floor).toBe('#ff0000');
  });

  it('activates player spawn tool when clicking toolPlayer', () => {
    const btn = document.getElementById('toolPlayer');
    btn.click();
    expect(window.__editorState.activeTool).toBe('player');
    expect(btn.classList.contains('active')).toBe(true);
  });

  it('activates lulu spawn tool when clicking toolLulu', () => {
    const btn = document.getElementById('toolLulu');
    btn.click();
    expect(window.__editorState.activeTool).toBe('lulu');
    expect(btn.classList.contains('active')).toBe(true);
  });

  it('deactivates a tool when clicking the same tool again', () => {
    const btn = document.getElementById('toolPlayer');
    btn.click();
    btn.click();
    expect(window.__editorState.activeTool).toBeNull();
    expect(btn.classList.contains('active')).toBe(false);
  });
});
