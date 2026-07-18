/**
 * @fileoverview Shared editor DOM scaffold for editor integration tests.
 * Superset of the elements editor.js binds to; color inputs start at #000000
 * so tests can observe the seed overwriting them on init.
 */
export function buildEditorDOM() {
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
    <button id="btnCopyLink"></button>
    <button id="btnSaveSlot1"></button><button id="btnLoadSlot1"></button>
    <button id="btnSaveSlot2"></button><button id="btnLoadSlot2"></button>
    <button id="btnSaveSlot3"></button><button id="btnLoadSlot3"></button>
    <input id="colorFloor" value="#000000"/><input id="colorFloorText" value="#000000"/>
    <input id="colorWall" value="#000000"/><input id="colorWallText" value="#000000"/>
    <input id="colorCeiling" value="#000000"/><input id="colorCeilingText" value="#000000"/>
    <textarea id="exportOutput"></textarea>
    <div id="roomDimensions"></div>
    <div id="roomAxisAligned"></div>
    <div id="error-display" style="display:none"></div>
  `;
}
