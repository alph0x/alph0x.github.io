/**
 * @fileoverview FurnitureManager — placement, selection, transformation, and undo/redo for placed items.
 * Owns the placedMeshes Map and nextId counter. Depends on Three.js and FurnitureRegistry.
 * Undo/redo is delegated to an injected UndoManager (SRP + DIP).
 */

import * as THREE from 'three';
import { FurnitureRegistry } from '../furniture/registry.js';
import { extractMeshFromResult, normalizeRotation, calculateMeshOpeningDims } from '../editor-utils.js';
import type { FurnitureConfig } from '../seed.js';
import { EditorState, type PlacedItem } from './state.js';
import { UndoManager } from './undo-manager.js';

interface MeshUserData {
  _outline?: THREE.LineSegments;
  _editorId?: number;
  _type?: string;
  _hitSize?: number;
}

type UndoAction =
  | { type: 'place'; id: number; config: FurnitureConfig }
  | { type: 'move'; id: number; oldPos: THREE.Vector3Like; newPos: THREE.Vector3Like }
  | { type: 'delete'; id: number; item: PlacedItem }
  | { type: 'rotate'; id: number; oldRot: number; newRot: number };

export class FurnitureManager {
  private _scene: THREE.Scene;
  private _state: EditorState;
  private _wallH: number;
  private _undoManager: UndoManager;
  private _placedMeshes: Map<number, THREE.Object3D>;
  private _nextId: number;

  /**
   * @param scene — Three.js scene
   * @param state — editor state
   * @param wallH — wall height (for ceiling-lamp Y default)
   * @param undoManager — generic undo/redo stack
   */
  constructor(scene: THREE.Scene, state: EditorState, wallH: number, undoManager: UndoManager) {
    this._scene = scene;
    this._state = state;
    this._wallH = wallH;
    this._undoManager = undoManager;
    this._placedMeshes = new Map();
    this._nextId = 1;
  }

  // ── Queries ─────────────────────────────────────────────────────

  get meshMap(): Map<number, THREE.Object3D> { return this._placedMeshes; }
  get nextId(): number { return this._nextId; }
  get canUndo(): boolean { return this._undoManager.canUndo; }
  get canRedo(): boolean { return this._undoManager.canRedo; }

  // ── Placement ───────────────────────────────────────────────────

  placeConfig(cfg: FurnitureConfig, skipSelect = false, skipUndo = false, forcedId: number | null = null): void {
    const entry = FurnitureRegistry.get(cfg.type);
    const builder = entry?.builder;
    if (!builder) return;

    const result = builder(cfg);
    const mesh = extractMeshFromResult(result);
    if (!mesh) return;

    const [x, y, z] = cfg.position;
    mesh.position.set(x, y, z);
    mesh.rotation.y = cfg.rotation ?? 0;

    const id = forcedId ?? this._nextId;
    this._attachOutline(mesh, id, cfg.type);

    // Cache bounding-box volume for smarter raycast selection
    const bb = new THREE.Box3().setFromObject(mesh);
    const bbSize = new THREE.Vector3();
    bb.getSize(bbSize);
    this._userData(mesh)._hitSize = bbSize.x * bbSize.y * bbSize.z;

    this._scene.add(mesh);
    this._placedMeshes.set(id, mesh);

    // Cache opening dimensions so wall rebuilds use the real mesh size
    const openingDims = calculateMeshOpeningDims(mesh);
    this._state.addPlaced({
      id,
      type: cfg.type,
      name: cfg.name || '',
      mesh,
      config: { ...cfg, _openingDims: openingDims } as PlacedItem['config'],
    });

    if (!skipUndo) {
      this._undoManager.record({ type: 'place', id, config: { ...cfg } } as UndoAction);
    }

    if (!skipSelect) {
      this.select(id);
      this._updatePlacedList();
    }
    if (forcedId == null) {
      this._nextId++;
    }
  }

  place(type: string, x: number, y: number, z: number, rotation = 0, skipSelect = false): void {
    this.placeConfig({ type, position: [x, y, z], rotation }, skipSelect);
  }

  /** Clear all placed items (used on seed reload). */
  clearAll(): void {
    for (const mesh of this._placedMeshes.values()) {
      this._scene.remove(mesh);
      const outline = this._userData(mesh)._outline;
      if (outline) {
        outline.geometry.dispose();
        const mat = outline.material as THREE.LineBasicMaterial;
        mat.dispose();
      }
    }
    this._placedMeshes.clear();
    this._state.placed = [];
    this._nextId = 1;
    this._undoManager.clear();
  }

  /** Load items from a deserialized seed layout. */
  loadFromSeed(layout: { furniture?: FurnitureConfig[] }): void {
    for (const item of layout.furniture || []) {
      const cfg: FurnitureConfig = {
        type: item.type,
        position: [...item.position],
        rotation: item.rotation || 0,
      };
      if (item.text != null) cfg.text = item.text;
      if (item.color != null) cfg.color = item.color;
      if (item.intensity != null) {
        cfg.intensity = item.intensity;
        cfg.distance = item.distance;
      }
      if (item.name != null) cfg.name = item.name;
      if (item.panelId != null) cfg.panelId = item.panelId;
      if (item.coat != null) cfg.coat = item.coat;
      if (item.pose != null) cfg.pose = item.pose;
      if (item.noCollision != null) cfg.noCollision = item.noCollision;
      if (item.count != null) cfg.count = item.count;
      this.placeConfig(cfg, true, true);
    }
    this.select(null);
    this._updatePlacedList();
  }

  // ── Selection ───────────────────────────────────────────────────

  select(id: number | null): void {
    if (this._state.selectedId !== null) {
      const prev = this._placedMeshes.get(this._state.selectedId);
      const prevOutline = prev ? this._userData(prev)._outline : undefined;
      if (prevOutline) (prevOutline.material as THREE.LineBasicMaterial).opacity = 0;
    }
    this._state.selectedId = id;
    if (id !== null) {
      const mesh = this._placedMeshes.get(id);
      const outline = mesh ? this._userData(mesh)._outline : undefined;
      if (outline) (outline.material as THREE.LineBasicMaterial).opacity = 1;
      this._updateSelectionInfo();
      this._syncSelectionControls();
    } else {
      const el = document.getElementById('selectionInfo');
      if (el) el.classList.remove('visible');
    }
  }

  deleteSelected(): void {
    if (this._state.selectedId === null) return;
    const item = this._state.placed.find((p) => p.id === this._state.selectedId);
    if (item) {
      this._undoManager.record({
        type: 'delete',
        id: this._state.selectedId,
        item: { ...item, config: { ...item.config } },
      } as UndoAction);
    }
    const mesh = this._placedMeshes.get(this._state.selectedId);
    if (mesh) {
      this._scene.remove(mesh);
      this._placedMeshes.delete(this._state.selectedId);
    }
    this._state.placed = this._state.placed.filter((p) => p.id !== this._state.selectedId);
    this.select(null);
    this._updatePlacedList();
  }

  // ── Transform ───────────────────────────────────────────────────

  rotateSelected(deg = 45): void {
    if (this._state.selectedId === null) return;
    const mesh = this._placedMeshes.get(this._state.selectedId);
    if (!mesh) return;
    const oldRot = mesh.rotation.y;
    mesh.rotation.y += (deg * Math.PI) / 180;
    mesh.rotation.y = normalizeRotation(mesh.rotation.y);
    const item = this._state.placed.find((p) => p.id === this._state.selectedId);
    if (item) item.config.rotation = mesh.rotation.y;
    this._undoManager.record({
      type: 'rotate',
      id: this._state.selectedId,
      oldRot,
      newRot: mesh.rotation.y,
    } as UndoAction);
    this._rebuildOutline(mesh);
    const outline = this._userData(mesh)._outline;
    if (outline) (outline.material as THREE.LineBasicMaterial).opacity = 1;
    this._updateSelectionInfo();
  }

  setRotation(deg: number | string): void {
    if (this._state.selectedId === null) return;
    const mesh = this._placedMeshes.get(this._state.selectedId);
    if (!mesh) return;
    const oldRot = mesh.rotation.y;
    const rad = (parseFloat(String(deg)) * Math.PI) / 180;
    mesh.rotation.y = normalizeRotation(rad);
    const item = this._state.placed.find((p) => p.id === this._state.selectedId);
    if (item) item.config.rotation = mesh.rotation.y;
    this._undoManager.record({
      type: 'rotate',
      id: this._state.selectedId,
      oldRot,
      newRot: mesh.rotation.y,
    } as UndoAction);
    this._rebuildOutline(mesh);
    const outline = this._userData(mesh)._outline;
    if (outline) (outline.material as THREE.LineBasicMaterial).opacity = 1;
    this._updateSelectionInfo();
  }

  setX(x: number | string): void {
    if (this._state.selectedId === null) return;
    const mesh = this._placedMeshes.get(this._state.selectedId);
    if (!mesh) return;
    mesh.position.x = parseFloat(String(x));
    const item = this._state.placed.find((p) => p.id === this._state.selectedId);
    if (item) item.config.position[0] = mesh.position.x;
    this._updateSelectionInfo();
    this._updatePlacedList();
  }

  setY(y: number | string): void {
    if (this._state.selectedId === null) return;
    const mesh = this._placedMeshes.get(this._state.selectedId);
    if (!mesh) return;
    mesh.position.y = Math.max(0, Math.min(this._wallH, parseFloat(String(y))));
    const item = this._state.placed.find((p) => p.id === this._state.selectedId);
    if (item) item.config.position[1] = mesh.position.y;
    this._updateSelectionInfo();
  }

  setZ(z: number | string): void {
    if (this._state.selectedId === null) return;
    const mesh = this._placedMeshes.get(this._state.selectedId);
    if (!mesh) return;
    mesh.position.z = parseFloat(String(z));
    const item = this._state.placed.find((p) => p.id === this._state.selectedId);
    if (item) item.config.position[2] = mesh.position.z;
    this._updateSelectionInfo();
    this._updatePlacedList();
  }

  setName(name: unknown): void {
    if (this._state.selectedId === null) return;
    const item = this._state.placed.find((p) => p.id === this._state.selectedId);
    if (item) item.name = String(name || '');
    this._updatePlacedList();
  }

  // ── Drag move (used by InteractionManager) ──────────────────────

  beginMove(id: number, offset: THREE.Vector3): { startPos: THREE.Vector3; offset: THREE.Vector3 } | null {
    const mesh = this._placedMeshes.get(id);
    if (!mesh) return null;
    this.select(id);
    return { startPos: mesh.position.clone(), offset };
  }

  updateMove(id: number, x: number, z: number): void {
    const mesh = this._placedMeshes.get(id);
    if (!mesh) return;
    mesh.position.x = x;
    mesh.position.z = z;
    const item = this._state.placed.find((p) => p.id === id);
    if (item) {
      item.config.position[0] = x;
      item.config.position[2] = z;
    }
    this._updateSelectionInfo();
    this._updatePlacedList();
  }

  endMove(id: number, startPos: THREE.Vector3 | null): void {
    const mesh = this._placedMeshes.get(id);
    if (!mesh || !startPos) return;
    if (mesh.position.x !== startPos.x || mesh.position.z !== startPos.z) {
      this._undoManager.record({
        type: 'move',
        id,
        oldPos: { x: startPos.x, y: startPos.y, z: startPos.z },
        newPos: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
      } as UndoAction);
    }
  }

  // ── Undo / Redo ─────────────────────────────────────────────────

  undo(): void {
    const action = this._undoManager.popUndo() as UndoAction | undefined;
    if (!action) return;
    this._applyInverse(action);
    this._updateUIAfterUndoRedo();
  }

  redo(): void {
    const action = this._undoManager.popRedo() as UndoAction | undefined;
    if (!action) return;
    this._applyForward(action);
    this._updateUIAfterUndoRedo();
  }

  // ── Raycast helpers ─────────────────────────────────────────────

  hitTest(raycaster: THREE.Raycaster, meshes: THREE.Object3D[]): THREE.Object3D | null {
    const hits = raycaster.intersectObjects(meshes, true);
    if (hits.length === 0) return null;

    const candidates: { obj: THREE.Object3D; size: number }[] = [];
    for (const hit of hits) {
      let obj: THREE.Object3D | null = hit.object;
      if (obj instanceof THREE.LineSegments) continue;
      while (obj && this._userData(obj)._editorId == null && obj.parent) {
        obj = obj.parent;
      }
      if (obj && this._userData(obj)._editorId != null) {
        candidates.push({ obj, size: this._userData(obj)._hitSize || Infinity });
      }
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.size - b.size);
    return candidates[0].obj;
  }

  // ── Private ─────────────────────────────────────────────────────

  private _applyInverse(action: UndoAction): void {
    switch (action.type) {
      case 'place': {
        const mesh = this._placedMeshes.get(action.id);
        if (mesh) {
          this._scene.remove(mesh);
          this._placedMeshes.delete(action.id);
        }
        this._state.placed = this._state.placed.filter((p) => p.id !== action.id);
        this.select(null);
        break;
      }
      case 'move': {
        const mesh = this._placedMeshes.get(action.id);
        if (mesh) {
          mesh.position.set(action.oldPos.x, action.oldPos.y, action.oldPos.z);
          const item = this._state.placed.find((p) => p.id === action.id);
          if (item) {
            item.config.position[0] = action.oldPos.x;
            item.config.position[1] = action.oldPos.y;
            item.config.position[2] = action.oldPos.z;
          }
          this.select(action.id);
        }
        break;
      }
      case 'delete': {
        // Rebuild the deleted mesh with its original id (do not use placeConfig to avoid new undo record)
        const cfg = action.item.config;
        const entry = FurnitureRegistry.get(cfg.type);
        const builder = entry?.builder;
        if (builder) {
          const result = builder(cfg);
          const mesh = extractMeshFromResult(result);
          if (mesh) {
            const [x, y, z] = cfg.position;
            mesh.position.set(x, y, z);
            mesh.rotation.y = cfg.rotation ?? 0;
            this._attachOutline(mesh, action.id, cfg.type);
            const bb = new THREE.Box3().setFromObject(mesh);
            const bbSize = new THREE.Vector3();
            bb.getSize(bbSize);
            this._userData(mesh)._hitSize = bbSize.x * bbSize.y * bbSize.z;
            this._scene.add(mesh);
            this._placedMeshes.set(action.id, mesh);
            this._state.placed.push({
              id: action.id,
              type: cfg.type,
              name: action.item.name || '',
              mesh,
              config: { ...cfg } as PlacedItem['config'],
            });
            this.select(action.id);
          }
        }
        break;
      }
      case 'rotate': {
        const mesh = this._placedMeshes.get(action.id);
        if (mesh) {
          mesh.rotation.y = action.oldRot;
          const item = this._state.placed.find((p) => p.id === action.id);
          if (item) item.config.rotation = action.oldRot;
          this.select(action.id);
        }
        break;
      }
    }
  }

  private _applyForward(action: UndoAction): void {
    switch (action.type) {
      case 'place': {
        this.placeConfig(action.config, false, true, action.id);
        break;
      }
      case 'move': {
        const mesh = this._placedMeshes.get(action.id);
        if (mesh) {
          mesh.position.set(action.newPos.x, action.newPos.y, action.newPos.z);
          const item = this._state.placed.find((p) => p.id === action.id);
          if (item) {
            item.config.position[0] = action.newPos.x;
            item.config.position[1] = action.newPos.y;
            item.config.position[2] = action.newPos.z;
          }
          this.select(action.id);
        }
        break;
      }
      case 'delete': {
        const mesh = this._placedMeshes.get(action.id);
        if (mesh) {
          this._scene.remove(mesh);
          this._placedMeshes.delete(action.id);
        }
        this._state.placed = this._state.placed.filter((p) => p.id !== action.id);
        this.select(null);
        break;
      }
      case 'rotate': {
        const mesh = this._placedMeshes.get(action.id);
        if (mesh) {
          mesh.rotation.y = action.newRot;
          const item = this._state.placed.find((p) => p.id === action.id);
          if (item) item.config.rotation = action.newRot;
          this.select(action.id);
        }
        break;
      }
    }
  }

  private _updateUIAfterUndoRedo(): void {
    this._updatePlacedList();
    this._updateSelectionInfo();
    this._syncSelectionControls();
    this._syncUndoRedoButtons();
  }

  private _syncUndoRedoButtons(): void {
    const undoBtn = document.getElementById('btnUndo') as HTMLButtonElement | null;
    const redoBtn = document.getElementById('btnRedo') as HTMLButtonElement | null;
    if (undoBtn) undoBtn.disabled = !this.canUndo;
    if (redoBtn) redoBtn.disabled = !this.canRedo;
  }

  private _userData(mesh: THREE.Object3D): MeshUserData {
    return mesh.userData as MeshUserData;
  }

  private _attachOutline(mesh: THREE.Object3D, editorId: number, type: string): void {
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x, size.y, size.z)),
      new THREE.LineBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0 })
    );
    outline.position.copy(center).sub(mesh.position);
    mesh.add(outline);
    this._userData(mesh)._outline = outline;
    this._userData(mesh)._editorId = editorId;
    this._userData(mesh)._type = type;
  }

  private _rebuildOutline(mesh: THREE.Object3D): void {
    const oldOutline = this._userData(mesh)._outline;
    if (oldOutline) {
      mesh.remove(oldOutline);
      oldOutline.geometry.dispose();
      const mat = oldOutline.material as THREE.LineBasicMaterial;
      mat.dispose();
      this._userData(mesh)._outline = undefined;
    }
    this._attachOutline(mesh, this._userData(mesh)._editorId ?? 0, this._userData(mesh)._type ?? '');
  }

  private _updateSelectionInfo(): void {
    const info = document.getElementById('selectionInfo');
    if (!info) return;
    if (this._state.selectedId === null) {
      info.classList.remove('visible');
      return;
    }
    const item = this._state.placed.find((p) => p.id === this._state.selectedId);
    if (!item) return;
    const m = item.mesh;
    const deg = Math.round((m.rotation.y * 180) / Math.PI);
    const displayName = item.name
      ? `${item.name} <span style="color:#78716c;font-size:11px;">(${item.type})</span>`
      : `<strong>${item.type}</strong>`;
    info.innerHTML = `
      ${displayName}<br>
      x: ${m.position.x.toFixed(2)} &nbsp; y: ${m.position.y.toFixed(2)} &nbsp; z: ${m.position.z.toFixed(2)}<br>
      rot: ${deg}°
    `;
    info.classList.add('visible');
  }

  private _syncSelectionControls(): void {
    const mesh =
      this._state.selectedId !== null ? this._placedMeshes.get(this._state.selectedId) : null;
    const xInput = document.getElementById('selX') as HTMLInputElement | null;
    const zInput = document.getElementById('selZ') as HTMLInputElement | null;
    const yNum = document.getElementById('selY') as HTMLInputElement | null;
    const yRange = document.getElementById('selYRange') as HTMLInputElement | null;
    const rotInput = document.getElementById('selRot') as HTMLInputElement | null;
    if (xInput) xInput.value = mesh ? mesh.position.x.toFixed(2) : '0';
    if (zInput) zInput.value = mesh ? mesh.position.z.toFixed(2) : '0';
    const yVal = mesh ? mesh.position.y.toFixed(2) : '0';
    if (yNum) yNum.value = yVal;
    if (yRange) yRange.value = yVal;
    const rotDeg = mesh ? ((mesh.rotation.y * 180) / Math.PI).toFixed(0) : '0';
    if (rotInput) rotInput.value = rotDeg;
    const nameInput = document.getElementById('selName') as HTMLInputElement | null;
    const item =
      this._state.selectedId !== null
        ? this._state.placed.find((p) => p.id === this._state.selectedId)
        : null;
    if (nameInput) nameInput.value = item ? item.name || '' : '';
  }

  private _updatePlacedList(): void {
    const list = document.getElementById('placedList');
    if (!list) return;
    if (this._state.placed.length === 0) {
      list.innerHTML = '<em>None</em>';
      return;
    }
    list.innerHTML = this._state.placed
      .map((p) => {
        const sel = p.id === this._state.selectedId ? 'style="color:#7c3aed;font-weight:600;"' : '';
        const label = p.name
          ? `${p.name} <span style="color:#57534e;font-size:11px;">(${p.type})</span>`
          : p.type;
        return `<div ${sel} style="cursor:pointer;padding:2px 0;" onclick="window.__editorSelectItem(${p.id})">${label} <span style="color:#57534e;font-size:11px;">(${p.mesh.position.x.toFixed(1)}, ${p.mesh.position.y.toFixed(1)}, ${p.mesh.position.z.toFixed(1)})</span></div>`;
      })
      .join('');
  }
}
