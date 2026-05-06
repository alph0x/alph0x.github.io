/**
 * @fileoverview FurnitureManager — placement, selection, transformation, and undo for placed items.
 * Owns the placedMeshes Map and nextId counter. Depends on Three.js and FurnitureRegistry.
 */

import * as THREE from 'three';
import { FurnitureRegistry } from '../furniture/registry.js';
import { extractMeshFromResult, normalizeRotation } from '../editor-utils.js';

export class FurnitureManager {
  /**
   * @param {THREE.Scene} scene
   * @param {EditorState} state
   * @param {number} wallH — wall height (for ceiling-lamp Y default)
   */
  constructor(scene, state, wallH) {
    this._scene = scene;
    this._state = state;
    this._wallH = wallH;
    this._placedMeshes = new Map();
    this._nextId = 1;
  }

  // ── Queries ─────────────────────────────────────────────────────

  get meshMap() { return this._placedMeshes; }
  get nextId() { return this._nextId; }

  // ── Placement ───────────────────────────────────────────────────

  placeConfig(cfg, skipSelect = false) {
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
    this._state.addPlaced({ id: this._nextId, type: cfg.type, mesh, config: { ...cfg } });

    this._state.lastAction = { type: 'place', id: this._nextId };

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
      this.placeConfig(cfg, true);
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
      this._state.lastAction = {
        type: 'delete',
        item: { ...item, config: { ...item.config } },
      };
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
    this._state.lastAction = { type: 'rotate', id: this._state.selectedId, oldRot };
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
    this._state.lastAction = { type: 'rotate', id: this._state.selectedId, oldRot };
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
      this._state.lastAction = { type: 'move', id, oldPos: startPos.clone() };
    }
  }

  // ── Undo ────────────────────────────────────────────────────────

  undo() {
    const action = this._state.lastAction;
    if (!action) return;

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
          mesh.position.x = action.oldPos.x;
          mesh.position.z = action.oldPos.z;
          const item = this._state.placed.find((p) => p.id === action.id);
          if (item) {
            item.config.position[0] = mesh.position.x;
            item.config.position[2] = mesh.position.z;
          }
          this.select(action.id);
        }
        break;
      }
      case 'delete': {
        const cfg = action.item.config;
        this.placeConfig(cfg, true);
        this._state.lastAction = { type: 'place', id: this._nextId - 1 };
        this.select(this._nextId - 1);
        break;
      }
      case 'rotate': {
        const mesh = this._placedMeshes.get(action.id);
        if (mesh) {
          mesh.rotation.y = action.oldRot;
          const item = this._state.placed.find((p) => p.id === action.id);
          if (item) item.config.rotation = mesh.rotation.y;
          this.select(action.id);
        }
        break;
      }
    }

    this._updatePlacedList();
    this._updateSelectionInfo();
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
    info.innerHTML = `
      <strong>${item.type}</strong><br>
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
      return `<div ${sel} style="cursor:pointer;padding:2px 0;" onclick="window.__editorSelectItem(${p.id})">${p.type} <span style="color:#57534e;font-size:11px;">(${p.mesh.position.x.toFixed(1)}, ${p.mesh.position.y.toFixed(1)}, ${p.mesh.position.z.toFixed(1)})</span></div>`;
    }).join('');
  }
}
