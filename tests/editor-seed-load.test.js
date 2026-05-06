/**
 * @fileoverview Integration test: full editor init + seed load.
 * Verifies that DEFAULT_SEED creates furniture meshes and updates the DOM.
 */

import './setup-canvas-mock.js';
import { describe, it, expect, vi } from 'vitest';

vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  class FakeRenderer {
    constructor() {
      this.domElement = document.createElement('canvas');
    }
    setSize() {}
    setPixelRatio() {}
    render() {}
  }
  return { ...actual, WebGLRenderer: FakeRenderer };
});

describe('Editor seed load integration', () => {
  it('loads DEFAULT_SEED without errors and updates the DOM', async () => {
    document.body.innerHTML = `
      <div id="canvas-wrap" style="width:800px;height:600px;"></div>
      <div id="preview-wrap" style="display:none;"><div class="preview-label"></div></div>
      <div id="palette"></div>
      <div id="placedList"></div>
      <div id="selectionInfo"></div>
      <input id="selX" /><input id="selY" /><input id="selYRange" />
      <input id="selZ" /><input id="selRot" />
      <button id="toolPlayer"></button><button id="toolLulu"></button>
      <button id="toolOutline"></button><button id="btnResetRect"></button>
      <button id="btnViewMode"></button><button id="btnRotate"></button>
      <button id="btnDelete"></button><button id="btnUndo"></button>
      <button id="btnExport"></button>
      <input id="colorFloor" value="#000000"/><input id="colorFloorText" value="#000000"/>
      <input id="colorWall" value="#000000"/><input id="colorWallText" value="#000000"/>
      <input id="colorCeiling" value="#000000"/><input id="colorCeilingText" value="#000000"/>
      <textarea id="exportOutput"></textarea>
      <div id="roomDimensions"></div>
      <div id="roomAxisAligned"></div>
      <div id="error-display"></div>
    `;

    await import('../docs/js/editor.js');

    const errorDisplay = document.getElementById('error-display');
    expect(errorDisplay.style.display).not.toBe('block');
    expect(errorDisplay.textContent).toBe('');

    // Color inputs should reflect seed materials
    expect(document.getElementById('colorFloor').value).toBe('#1c1917');
    expect(document.getElementById('colorWall').value).toBe('#44403c');
    expect(document.getElementById('colorCeiling').value).toBe('#1c1917');

    // Placed list should show items, not "None"
    const placedList = document.getElementById('placedList');
    expect(placedList.innerHTML).not.toContain('None');
    expect(placedList.innerHTML).toContain('bed');
    expect(placedList.innerHTML).toContain('tv');
  });
});
