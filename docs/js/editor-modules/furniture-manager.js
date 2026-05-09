/**
 * @fileoverview FurnitureManager — placement, selection, transformation, and undo/redo for placed items.
 * Owns the placedMeshes Map and nextId counter. Depends on Three.js and FurnitureRegistry.
 * Undo/redo is delegated to an injected UndoManager (SRP + DIP).
 */

import * as THREE from 'three';
import { FurnitureRegistry } from '../furniture/registry.js';
import { extractMeshFromResult, normalizeRotation } from '../editor-utils.js';

export class FurnitureManager {
  /**
   * @param {THREE.Scene} scene
   * @param {EditorState} state
   * @param {number} wallH — wall height (for ceiling-lamp Y default)
   * @param {UndoManager} undoManager — generic undo/redo stack
   */
  constructor(scene, state, wallH, undoManager) {
    this._scene = scene;
    this._state = state;
    this._wallH = wallH;
    this._undoManager = undoManager;
    this._placedMeshes = new Map();
    this._nextId = 1;
  }

  // ── Queries ─────────────────────────────────────────────────────

  get meshMap() { return this._placedMeshes; }
  get nextId() { return this._nextId; }
  get canUndo() { return this._undoManager.canUndo; }
  get canRedo() { return this._undoManager.canRedo; }

  // ── Placement ───────────────────────────────────────────────────

  placeConfig(cfg, skipSelect = false, skipUndo = false) {
    const entry = FurnitureRegistry.get(cfg.type);
    const builder = entry?.builder;
    if (!builder) return;

    const result = builder(cfg);
    const mesh = extractMeshFromResult(result);
    if (!mesh) return;

    mesh.position.set(...cfg.position);
    mesh.rotation.y = cfg.rotation || 0;
    this._attachOutline(mesh, this._nextId, cfg.type);

    // Cache bounding-box volume for smarter raycast selection
    const bb = new THREE.Box3().setFromObject(mesh);
    const bbSize = new THREE.Vector3();
    bb.getSize(bbSize);
    mesh.userData._hitSize = bbSize.x * bbSize.y * bbSize.z;

    this._scene.add(mesh);
    this._placedMeshes.set(this._nextId, mesh);
    this._state.addPlaced({ id: this._nextId, type: cfg.type, name: cfg.name || '', mesh, config: { ...cfg } });

    if (!skipUndo) {
      this._undoManager.record({ type: 'place', id: this._nextId, config: { ...cfg } });
    }

    if (!skipSelect) {
      this.select(this._nextId);
      this._updatePlacedList();
    }
    this._nextId++;
  }

  place(type, x, y, z, rotation = 0, skipSelect = false) {
    this.placeConfig({ type, position: [x, y, z], rotation }, skipSelect);
  }

  /** Clear all placed items (used on seed reload). */
  clearAll() {
    for (const mesh of this._placedMeshes.values()) {
      this._scene.remove(mesh);
      if (mesh.userData._outline) {
        mesh.userData._outline.geometry.dispose();
        mesh.userData._outline.material.dispose();
      }
    }
    this._placedMeshes.clear();
    this._state.placed = [];
    this._nextId = 1;
    this._undoManager.clear();
  }

  /** Load items from a deserialized seed layout. */
  loadFromSeed(layout) {
    for (const item of layout.furniture || []) {
      const cfg = {
        type: item.type,
        position: [...item.position],
        rotation: item.rotation || 0,
      };
      if (item.text != null) cfg.text = item.text;
      if (item.color != null) cfg.color = item.color;
      if (item.intensity != null) { cfg.intensity = item.intensity; cfg.distance = item.distance; }
      if (item.name != null) cfg.name = item.name;
      this.placeConfig(cfg, true, true);
    }
    this.select(null);
    this._updatePlacedList();
  }

  // ── Selection ───────────────────────────────────────────────────

  select(id) {
    if (this._state.selectedId !== null) {
      const prev = this._placedMeshes.get(this._state.selectedId);
      if (prev && prev.userData._outline) prev.userData._outline.material.opacity = 0;
    }
    this._state.selectedId = id;
    if (id !== null) {
      const mesh = this._placedMeshes.get(id);
      if (mesh && mesh.userData._outline) mesh.userData._outline.material.opacity = 1;
      this._updateSelectionInfo();
      this._syncSelectionControls();
    } else {
      const el = document.getElementById('selectionInfo');
      if (el) el.classList.remove('visible');
    }
  }

  deleteSelected() {
    if (this._state.selectedId === null) return;
    const item = this._state.placed.find((p) => p.id === this._state.selectedId);
    if (item) {
      this._undoManager.record({
        type: 'delete',
        id: this._state.selectedId,
        item: { ...item, config: { ...item.config } },
      });
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

  rotateSelected(deg = 45) {
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
    });
    this._rebuildOutline(mesh);
    if (mesh.userData._outline) mesh.userData._outline.material.opacity = 1;
    this._updateSelectionInfo();
  }

  setRotation(deg) {
    if (this._state.selectedId === null) return;
    const mesh = this._placedMeshes.get(this._state.selectedId);
    if (!mesh) return;
    const oldRot = mesh.rotation.y;
    const rad = (parseFloat(deg) * Math.PI) / 180;
    mesh.rotation.y = normalizeRotation(rad);
    const item = this._state.placed.find((p) => p.id === this._state.selectedId);
    if (item) item.config.rotation = mesh.rotation.y;
    this._undoManager.record({
      type: 'rotate',
      id: this._state.selectedId,
      oldRot,
      newRot: mesh.rotation.y,
    });
    this._rebuildOutline(mesh);
    if (mesh.userData._outline) mesh.userData._outline.material.opacity = 1;
    this._updateSelectionInfo();
  }

  setX(x) {
    if (this._state.selectedId === null) return;
    const mesh = this._placedMeshes.get(this._state.selectedId);
    if (!mesh) return;
    mesh.position.x = parseFloat(x);
    const item = this._state.placed.find((p) => p.id === this._state.selectedId);
    if (item) item.config.position[0] = mesh.position.x;
    this._updateSelectionInfo();
    this._updatePlacedList();
  }

  setY(y) {
    if (this._state.selectedId === null) return;
    const mesh = this._placedMeshes.get(this._state.selectedId);
    if (!mesh) return;
    mesh.position.y = Math.max(0, Math.min(this._wallH, parseFloat(y)));
    const item = this._state.placed.find((p) => p.id === this._state.selectedId);
    if (item) item.config.position[1] = mesh.position.y;
    this._updateSelectionInfo();
  }

  setZ(z) {
    if (this._state.selectedId === null) return;
    const mesh = this._placedMeshes.get(this._state.selectedId);
    if (!mesh) return;
    mesh.position.z = parseFloat(z);
    const item = this._state.placed.find((p) => p.id === this._state.selectedId);
    if (item) item.config.position[2] = mesh.position.z;
    this._updateSelectionInfo();
    this._updatePlacedList();
  }

  setName(name) {
    if (this._state.selectedId === null) return;
    const item = this._state.placed.find((p) => p.id === this._state.selectedId);
    if (item) item.name = String(name || '');
    this._updatePlacedList();
  }

  // ── Drag move (used by InteractionManager) ──────────────────────

  beginMove(id, offset) {
    const mesh = this._placedMeshes.get(id);
    if (!mesh) return null;
    this.select(id);
    return { startPos: mesh.position.clone(), offset };
  }

  updateMove(id, x, z) {
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

  endMove(id, startPos) {
    const mesh = this._placedMeshes.get(id);
    if (!mesh || !startPos) return;
    if (mesh.position.x !== startPos.x || mesh.position.z !== startPos.z) {
      this._undoManager.record({
        type: 'move',
        id,
        oldPos: { x: startPos.x, y: startPos.y, z: startPos.z },
        newPos: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
      });
    }
  }

  // ── Undo / Redo ─────────────────────────────────────────────────

  undo() {
    const action = this._undoManager.popUndo();
    if (!action) return;
    this._applyInverse(action);
    this._updateUIAfterUndoRedo();
  }

  redo() {
    const action = this._undoManager.popRedo();
    if (!action) return;
    this._applyForward(action);
    this._updateUIAfterUndoRedo();
  }

  // ── Raycast helpers ─────────────────────────────────────────────

  hitTest(raycaster, meshes) {
    const hits = raycaster.intersectObjects(meshes, true);
    if (hits.length === 0) return null;

    const candidates = [];
    for (const hit of hits) {
      let obj = hit.object;
      if (obj.isLineSegments) continue;
      while (obj && obj.userData._editorId == null && obj.parent) {
        obj = obj.parent;
      }
      if (obj && obj.userData._editorId != null) {
        candidates.push({ obj, size: obj.userData._hitSize || Infinity });
      }
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.size - b.size);
    return candidates[0].obj;
  }

  // ── Private ─────────────────────────────────────────────────────

  _applyInverse(action) {
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
            mesh.position.set(...cfg.position);
            mesh.rotation.y = cfg.rotation || 0;
            this._attachOutline(mesh, action.id, cfg.type);
            const bb = new THREE.Box3().setFromObject(mesh);
            const bbSize = new THREE.Vector3();
            bb.getSize(bbSize);
            mesh.userData._hitSize = bbSize.x * bbSize.y * bbSize.z;
            this._scene.add(mesh);
            this._placedMeshes.set(action.id, mesh);
            this._state.placed.push({ id: action.id, type: cfg.type, mesh, config: { ...cfg } });
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

  _applyForward(action) {
    switch (action.type) {
      case 'place': {
        this.placeConfig(action.config, false, true);
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

  _updateUIAfterUndoRedo() {
    this._updatePlacedList();
    this._updateSelectionInfo();
    this._syncSelectionControls();
    this._syncUndoRedoButtons();
  }

  _syncUndoRedoButtons() {
    const undoBtn = document.getElementById('btnUndo');
    const redoBtn = document.getElementById('btnRedo');
    if (undoBtn) undoBtn.disabled = !this.canUndo;
    if (redoBtn) redoBtn.disabled = !this.canRedo;
  }

  _attachOutline(mesh, editorId, type) {
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
    mesh.userData._outline = outline;
    mesh.userData._editorId = editorId;
    mesh.userData._type = type;
  }

  _rebuildOutline(mesh) {
    const oldOutline = mesh.userData._outline;
    if (oldOutline) {
      mesh.remove(oldOutline);
      oldOutline.geometry.dispose();
      oldOutline.material.dispose();
      mesh.userData._outline = null;
    }
    this._attachOutline(mesh, mesh.userData._editorId, mesh.userData._type);
  }

  _updateSelectionInfo() {
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
    const displayName = item.name ? `${item.name} <span style="color:#78716c;font-size:11px;">(${item.type})</span>` : `<strong>${item.type}</strong>`;
    info.innerHTML = `
      ${displayName}<br>
      x: ${m.position.x.toFixed(2)} &nbsp; y: ${m.position.y.toFixed(2)} &nbsp; z: ${m.position.z.toFixed(2)}<br>
      rot: ${deg}°
    `;
    info.classList.add('visible');
  }

  _syncSelectionControls() {
    const mesh = this._state.selectedId !== null ? this._placedMeshes.get(this._state.selectedId) : null;
    const xInput = document.getElementById('selX');
    const zInput = document.getElementById('selZ');
    const yNum = document.getElementById('selY');
    const yRange = document.getElementById('selYRange');
    const rotInput = document.getElementById('selRot');
    if (xInput) xInput.value = mesh ? mesh.position.x.toFixed(2) : '0';
    if (zInput) zInput.value = mesh ? mesh.position.z.toFixed(2) : '0';
    const yVal = mesh ? mesh.position.y.toFixed(2) : '0';
    if (yNum) yNum.value = yVal;
    if (yRange) yRange.value = yVal;
    const rotDeg = mesh ? ((mesh.rotation.y * 180) / Math.PI).toFixed(0) : '0';
    if (rotInput) rotInput.value = rotDeg;
    const nameInput = document.getElementById('selName');
    const item = this._state.selectedId !== null ? this._state.placed.find((p) => p.id === this._state.selectedId) : null;
    if (nameInput) nameInput.value = item ? (item.name || '') : '';
  }

  _updatePlacedList() {
    const list = document.getElementById('placedList');
    if (!list) return;
    if (this._state.placed.length === 0) {
      list.innerHTML = '<em>None</em>';
      return;
    }
    list.innerHTML = this._state.placed.map((p) => {
      const sel = p.id === this._state.selectedId ? 'style="color:#7c3aed;font-weight:600;"' : '';
      const label = p.name ? `${p.name} <span style="color:#57534e;font-size:11px;">(${p.type})</span>` : p.type;
      return `<div ${sel} style="cursor:pointer;padding:2px 0;" onclick="window.__editorSelectItem(${p.id})">${label} <span style="color:#57534e;font-size:11px;">(${p.mesh.position.x.toFixed(1)}, ${p.mesh.position.y.toFixed(1)}, ${p.mesh.position.z.toFixed(1)})</span></div>`;
    }).join('');
  }
}
