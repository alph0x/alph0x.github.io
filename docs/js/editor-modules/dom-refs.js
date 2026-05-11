/**
 * @fileoverview Centralized DOM element resolution for the Room Layout Editor.
 * Fail-fast: throws if any required element is missing so init errors surface immediately.
 */

const REQUIRED_IDS = [
  'canvas-wrap',
  'preview-wrap',
  'palette',
  'placedList',
  'selectionInfo',
  'toolPlayer',
  'toolLulu',
  'toolOutline',
  'btnResetRect',
  'btnViewMode',
  'btnRotate',
  'btnDelete',
  'btnUndo',
  'btnRedo',
  'btnExport',
  'colorFloor',
  'colorFloorText',
  'colorWall',
  'colorWallText',
  'colorCeiling',
  'colorCeilingText',
  'exportOutput',
  'roomDimensions',
  'roomAxisAligned',
  'error-display',
];

const OPTIONAL_IDS = ['selX', 'selZ', 'selY', 'selYRange', 'selRot', 'selName'];

export function getEditorDomRefs() {
  const refs = {};

  for (const id of REQUIRED_IDS) {
    const el = document.getElementById(id);
    if (!el) {
      throw new Error(`[EditorDomRefs] Missing required DOM element: #${id}`);
    }
    refs[id] = el;
  }

  for (const id of OPTIONAL_IDS) {
    refs[id] = document.getElementById(id);
  }

  return refs;
}
