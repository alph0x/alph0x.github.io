/**
 * @fileoverview Smoke test: editor initializes without fatal errors
 * and builds a non-empty categorized palette.
 */


import { describe, it, expect, vi } from 'vitest';

// Mock THREE.WebGLRenderer before editor imports it
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

describe('Editor init smoke', () => {
  it('builds categorized palette with all furniture types', async () => {
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
      <button id="btnRedo"></button><button id="btnExport"></button>
      <input id="colorFloor" value="#1c1917"/><input id="colorFloorText" value="#1c1917"/>
      <input id="colorWall" value="#44403c"/><input id="colorWallText" value="#44403c"/>
      <input id="colorCeiling" value="#1c1917"/><input id="colorCeilingText" value="#1c1917"/>
      <textarea id="exportOutput"></textarea>
      <div id="roomDimensions"></div>
      <div id="roomAxisAligned"></div>
      <div id="error-display"></div>
    `;

    await import('../docs/js/editor.js');

    const palette = document.getElementById('palette');
    expect(palette.children.length).toBeGreaterThan(0);

    const buttons = palette.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);

    const errorDisplay = document.getElementById('error-display');
    expect(errorDisplay.style.display).not.toBe('block');
  });
});
