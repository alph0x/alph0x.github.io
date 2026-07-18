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
] as const;

const OPTIONAL_IDS = [
  'selX',
  'selZ',
  'selY',
  'selYRange',
  'selRot',
  'selName',
  'btnCopyLink',
  'btnSaveSlot1',
  'btnLoadSlot1',
  'btnSaveSlot2',
  'btnLoadSlot2',
  'btnSaveSlot3',
  'btnLoadSlot3',
  'snapToggle',
  'snapSize',
] as const;

export type RequiredDomRefId = (typeof REQUIRED_IDS)[number];
export type OptionalDomRefId = (typeof OPTIONAL_IDS)[number];
export type DomRefId = RequiredDomRefId | OptionalDomRefId;

export type EditorDomRefs = Record<RequiredDomRefId, HTMLElement> & Record<OptionalDomRefId, HTMLElement | null>;

/**
 * Lazy, non-throwing lookup for editor chrome by id.
 * Unlike getEditorDomRefs(), safe when the element may be absent (e.g. unit tests).
 */
export function getEditorEl<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function getEditorDomRefs(): EditorDomRefs {
  const refs = {} as EditorDomRefs;

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
