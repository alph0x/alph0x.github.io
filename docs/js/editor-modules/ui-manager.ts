/**
 * @fileoverview UI bindings and DOM orchestration for the Room Layout Editor.
 * All DOM interactions live here. No direct Three.js or business logic — only callbacks.
 */

import * as THREE from 'three';
import type { EditorState, MatConfig } from './state.js';

interface PaletteItemMeta {
  category?: string;
  icon?: string;
  dimensions?: string;
}

interface PaletteItem {
  type: string;
  meta: PaletteItemMeta;
}

interface FurnitureManagerLike {
  rotateSelected(degrees: number): void;
  deleteSelected(): void;
  setX(value: string): void;
  setY(value: string): void;
  setZ(value: string): void;
  setRotation(value: string): void;
  setName(value: string): void;
  undo(): void;
  redo(): void;
}

interface PreviewManagerLike {
  show(type: string): void;
  clear(): void;
}

interface EditorUIDeps {
  outlineGroup: THREE.Group;
  previewManager: PreviewManagerLike;
  furnitureManager: FurnitureManagerLike;
  getPaletteItems?: () => PaletteItem[];
  onColorChange?: (key: string, value: string) => void;
  onViewModeToggle?: () => void;
  onResetRect?: () => void;
  onExport?: () => void;
  onCopyLink?: () => void;
  onSaveSlot?: (slot: number) => void;
  onLoadSlot?: (slot: number) => void;
  onSnapToggle?: (enabled: boolean) => void;
  onSnapSize?: (size: number) => void;
}

interface EditorDomRefs {
  palette: HTMLElement;
  placedList: HTMLElement;
  selectionInfo: HTMLElement;
  toolPlayer: HTMLElement;
  toolLulu: HTMLElement;
  toolOutline: HTMLElement;
  btnResetRect: HTMLElement;
  btnViewMode: HTMLElement;
  btnRotate: HTMLElement;
  btnDelete: HTMLElement;
  btnUndo: HTMLElement;
  btnRedo: HTMLElement;
  btnExport: HTMLElement;
  colorFloor: HTMLInputElement;
  colorFloorText: HTMLInputElement;
  colorWall: HTMLInputElement;
  colorWallText: HTMLInputElement;
  colorCeiling: HTMLInputElement;
  colorCeilingText: HTMLInputElement;
  exportOutput: HTMLElement;
  roomDimensions: HTMLElement;
  roomAxisAligned: HTMLElement;
  'error-display': HTMLElement;
  selX?: HTMLInputElement | null;
  selZ?: HTMLInputElement | null;
  selY?: HTMLInputElement | null;
  selYRange?: HTMLInputElement | null;
  selRot?: HTMLInputElement | null;
  selName?: HTMLInputElement | null;
  btnCopyLink?: HTMLElement | null;
  btnSaveSlot1?: HTMLElement | null;
  btnLoadSlot1?: HTMLElement | null;
  btnSaveSlot2?: HTMLElement | null;
  btnLoadSlot2?: HTMLElement | null;
  btnSaveSlot3?: HTMLElement | null;
  btnLoadSlot3?: HTMLElement | null;
  snapToggle?: HTMLInputElement | null;
  snapSize?: HTMLInputElement | null;
  [id: string]: HTMLElement | HTMLInputElement | null | undefined;
}

interface DimensionUpdate {
  width: number;
  depth: number;
  totalEdges: number;
  parallel: number;
}

export class EditorUIManager {
  private readonly _state: EditorState;
  private readonly _dom: EditorDomRefs;
  private readonly _deps: EditorUIDeps;

  constructor({ state, domRefs, deps }: { state: EditorState; domRefs: EditorDomRefs; deps: EditorUIDeps }) {
    this._state = state;
    this._dom = domRefs;
    this._deps = deps;
  }

  // ── Public API ──────────────────────────────────────────────────

  bindAll(): void {
    this._bindOutlineTool();
    this._bindResetRect();
    this._bindViewMode();
    this._bindColorInputs();
    this._bindSpawnTools();
    this._bindTransformControls();
    this._bindUndoRedo();
    this._bindExport();
    this._bindCopyLink();
    this._bindSaveSlots();
    this._bindSnap();
  }

  deactivateAllTools(): void {
    this._state.activeTool = null;
    this._dom.palette.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
    this._dom.toolPlayer.classList.remove('active');
    this._dom.toolLulu.classList.remove('active');
    this._dom.toolOutline.classList.remove('active');
    this._deps.outlineGroup.visible = false;
    this._deps.previewManager.clear();
  }

  updateDimensions({ width, depth, totalEdges, parallel }: DimensionUpdate): void {
    if (this._dom.roomDimensions) {
      this._dom.roomDimensions.textContent = `${width.toFixed(2)} × ${depth.toFixed(2)} m`;
    }
    if (this._dom.roomAxisAligned) {
      this._dom.roomAxisAligned.textContent = `${parallel} / ${totalEdges} walls`;
      this._dom.roomAxisAligned.style.color = parallel === totalEdges ? '#10b981' : '#f59e0b';
    }
  }

  setViewModeButton(mode: 'top' | '3d'): void {
    const btn = this._dom.btnViewMode;
    btn.textContent = mode === '3d' ? '⤒ Top View' : '↻ 3D View';
    btn.classList.toggle('active', mode === '3d');
  }

  updateColorInputs(mat: MatConfig): void {
    this._dom.colorFloor.value = mat.floor;
    this._dom.colorFloorText.value = mat.floor;
    this._dom.colorWall.value = mat.wall;
    this._dom.colorWallText.value = mat.wall;
    this._dom.colorCeiling.value = mat.ceiling;
    this._dom.colorCeilingText.value = mat.ceiling;
  }

  buildPalette(): void {
    const palette = this._dom.palette;
    palette.innerHTML = '';

    const items = this._deps.getPaletteItems ? this._deps.getPaletteItems() : [];
    const groups = new Map<string, PaletteItem[]>();
    for (const { type, meta } of items) {
      const cat = meta?.category || 'other';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push({ type, meta: meta || {} });
    }

    const catOrder = ['furniture', 'decor', 'lights', 'electronics', 'other'];
    for (const cat of catOrder) {
      if (!groups.has(cat)) continue;
      const catItems = groups.get(cat)!.sort((a, b) => a.type.localeCompare(b.type));

      const catDiv = document.createElement('div');
      catDiv.className = 'palette-category';
      catDiv.innerHTML = `<h3>${cat}</h3>`;

      const grid = document.createElement('div');
      grid.className = 'palette';

      for (const { type, meta } of catItems) {
        const btn = document.createElement('button');
        btn.innerHTML = `<span class="icon">${meta.icon || '📦'}</span><span>${type}</span>`;
        btn.title = meta.dimensions ? `${type} — ${meta.dimensions}` : type;
        btn.addEventListener('click', () => {
          const wasActive = this._state.activeTool === `place:${type}`;
          this.deactivateAllTools();
          if (!wasActive) {
            this._state.activeTool = `place:${type}`;
            btn.classList.add('active');
            this._deps.previewManager.show(type);
          }
        });
        grid.appendChild(btn);
      }

      catDiv.appendChild(grid);
      palette.appendChild(catDiv);
    }
  }

  // ── Private bindings ────────────────────────────────────────────

  private _bindOutlineTool(): void {
    this._bindToolToggle(this._dom.toolOutline, 'outline', () => {
      this._deps.outlineGroup.visible = true;
    });
  }

  private _bindResetRect(): void {
    this._dom.btnResetRect.addEventListener('click', () => {
      this._deps.onResetRect?.();
    });
  }

  private _bindViewMode(): void {
    this._dom.btnViewMode.addEventListener('click', () => {
      this._deps.onViewModeToggle?.();
    });
  }

  private _bindColorInputs(): void {
    const bindOne = (picker: HTMLInputElement, text: HTMLInputElement, key: string) => {
      picker.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        text.value = target.value;
        this._deps.onColorChange?.(key, target.value);
      });
      text.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        picker.value = target.value;
        this._deps.onColorChange?.(key, target.value);
      });
    };
    bindOne(this._dom.colorFloor, this._dom.colorFloorText, 'floor');
    bindOne(this._dom.colorWall, this._dom.colorWallText, 'wall');
    bindOne(this._dom.colorCeiling, this._dom.colorCeilingText, 'ceiling');
  }

  private _bindSpawnTools(): void {
    this._bindToolToggle(this._dom.toolPlayer, 'player');
    this._bindToolToggle(this._dom.toolLulu, 'lulu');
  }

  private _bindTransformControls(): void {
    this._dom.btnRotate.addEventListener('click', () => this._deps.furnitureManager.rotateSelected(45));
    this._dom.btnDelete.addEventListener('click', () => this._deps.furnitureManager.deleteSelected());

    if (this._dom.selX) {
      this._dom.selX.addEventListener('change', (e: Event) => this._deps.furnitureManager.setX((e.target as HTMLInputElement).value));
    }
    if (this._dom.selZ) {
      this._dom.selZ.addEventListener('change', (e: Event) => this._deps.furnitureManager.setZ((e.target as HTMLInputElement).value));
    }
    if (this._dom.selY && this._dom.selYRange) {
      const syncY = (v: string) => {
        this._deps.furnitureManager.setY(v);
        this._dom.selY!.value = v;
        this._dom.selYRange!.value = v;
      };
      this._dom.selY.addEventListener('input', (e: Event) => syncY((e.target as HTMLInputElement).value));
      this._dom.selYRange.addEventListener('input', (e: Event) => syncY((e.target as HTMLInputElement).value));
    }
    if (this._dom.selRot) {
      this._dom.selRot.addEventListener('change', (e: Event) => this._deps.furnitureManager.setRotation((e.target as HTMLInputElement).value));
    }
    if (this._dom.selName) {
      this._dom.selName.addEventListener('input', (e: Event) => this._deps.furnitureManager.setName((e.target as HTMLInputElement).value));
    }
  }

  private _bindUndoRedo(): void {
    this._dom.btnUndo.addEventListener('click', () => this._deps.furnitureManager.undo());
    this._dom.btnRedo.addEventListener('click', () => this._deps.furnitureManager.redo());
  }

  private _bindExport(): void {
    this._dom.btnExport.addEventListener('click', () => this._deps.onExport?.());
  }

  private _bindCopyLink(): void {
    this._dom.btnCopyLink?.addEventListener('click', () => this._deps.onCopyLink?.());
  }

  private _bindSaveSlots(): void {
    for (let i = 1; i <= 3; i++) {
      this._dom[`btnSaveSlot${i}`]?.addEventListener('click', () => this._deps.onSaveSlot?.(i));
      this._dom[`btnLoadSlot${i}`]?.addEventListener('click', () => this._deps.onLoadSlot?.(i));
    }
  }

  private _bindSnap(): void {
    this._dom.snapToggle?.addEventListener('change', (e: Event) => {
      this._deps.onSnapToggle?.((e.target as HTMLInputElement).checked);
    });
    this._dom.snapSize?.addEventListener('input', (e: Event) => {
      const v = parseFloat((e.target as HTMLInputElement).value);
      if (!isNaN(v) && v > 0) this._deps.onSnapSize?.(v);
    });
  }

  private _bindToolToggle(btn: HTMLElement, toolName: string, onToggle?: () => void): void {
    btn.addEventListener('click', () => {
      if (this._state.activeTool === toolName) {
        this._state.activeTool = null;
        btn.classList.remove('active');
      } else {
        this.deactivateAllTools();
        this._state.activeTool = toolName;
        btn.classList.add('active');
        onToggle?.();
      }
    });
  }
}
