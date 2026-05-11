/**
 * @fileoverview InteractionManager — pointer, keyboard, and raycast orchestration.
 * Dispatches events to SpawnManager, FurnitureManager, and OutlineEditor.
 */

import * as THREE from 'three';

export class InteractionManager {
  /**
   * @param {object} deps
   * @param {THREE.WebGLRenderer} deps.renderer
   * @param {THREE.Camera} deps.camera
   * @param {EditorState} deps.state
   * @param {THREE.Mesh} deps.floorPlane
   * @param {FurnitureManager} deps.furnitureManager
   * @param {OutlineEditor} deps.outlineEditor
   * @param {SpawnManager} deps.spawnManager
   * @param {RoomBuilder} deps.roomBuilder
   * @param {object} deps.config — editor CONFIG
   * @param {Function} deps.snap — snap function
   * @param {Function} [deps.onSpawnPlaced] — callback(type) when spawn is placed via floor click
   */
  constructor(deps) {
    this._renderer = deps.renderer;
    this._getCamera = typeof deps.camera === 'function' ? deps.camera : () => deps.camera;
    this._state = deps.state;
    this._floorPlane = deps.floorPlane;
    this._furnitureManager = deps.furnitureManager;
    this._outlineEditor = deps.outlineEditor;
    this._spawnManager = deps.spawnManager;
    this._roomBuilder = deps.roomBuilder;
    this._config = deps.config;
    this._snap = deps.snap;
    this._controls = deps.controls || null;
    this._onSpawnPlaced = deps.onSpawnPlaced || (() => {});
    this._onFurniturePlaced = deps.onFurniturePlaced || (() => {});
    this._onDragMove = deps.onDragMove || (() => {});
    this._onDragEnd = deps.onDragEnd || (() => {});
    this._boundOnPointerDown = this.onPointerDown.bind(this);
    this._boundOnPointerMove = this.onPointerMove.bind(this);
    this._boundOnPointerUp = this.onPointerUp.bind(this);
    this._boundOnPointerCancel = this.onPointerCancel.bind(this);
    this._boundOnKeyDown = this.onKeyDown.bind(this);
  }

  /** Backward-compat getter for tests that read im._camera */
  get _camera() {
    return this._getCamera();
  }

  attach() {
    this._renderer.domElement.addEventListener('pointerdown', this._boundOnPointerDown);
    this._renderer.domElement.addEventListener('pointermove', this._boundOnPointerMove);
    this._renderer.domElement.addEventListener('pointerup', this._boundOnPointerUp);
    this._renderer.domElement.addEventListener('pointercancel', this._boundOnPointerCancel);
    this._renderer.domElement.addEventListener('pointerleave', this._boundOnPointerCancel);
    document.addEventListener('keydown', this._boundOnKeyDown);
  }

  detach() {
    this._renderer.domElement.removeEventListener('pointerdown', this._boundOnPointerDown);
    this._renderer.domElement.removeEventListener('pointermove', this._boundOnPointerMove);
    this._renderer.domElement.removeEventListener('pointerup', this._boundOnPointerUp);
    this._renderer.domElement.removeEventListener('pointercancel', this._boundOnPointerCancel);
    this._renderer.domElement.removeEventListener('pointerleave', this._boundOnPointerCancel);
    document.removeEventListener('keydown', this._boundOnKeyDown);
  }

  // ── Public event handlers ───────────────────────────────────────

  onPointerDown(e) {
    if (e.button !== 0) return;
    if (this._state.isDragging) return;

    if (this._state.activeTool === 'outline') {
      const handled = this._outlineEditor.onPointerDown(e, this._intersectFloor.bind(this));
      if (handled) {
        if (this._state.isDragging && e.target && e.target.setPointerCapture) {
          e.target.setPointerCapture(e.pointerId);
        }
        if (this._state.isDragging) {
          this._disableControls();
        }
        return;
      }
      // If outlineEditor did not handle the event, fall through to furniture/spawn/floor.
    }

    if (this._tryStartSpawnDrag(e)) {
      if (e.target && e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId);
      this._disableControls();
      return;
    }
    if (this._tryStartFurnitureDrag(e)) {
      if (e.target && e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId);
      this._disableControls();
      return;
    }

    const pt = this._intersectFloor(e);
    if (pt) this._handleFloorClick(pt);
  }

  onPointerMove(e) {
    if (!this._state.isDragging) return;
    const pt = this._intersectFloor(e);
    if (!pt) return;

    switch (this._state.dragTarget) {
      case 'edge':
      case 'vertex':
        this._outlineEditor.onPointerMove(pt);
        break;
      case 'player':
      case 'lulu':
        this._spawnManager.moveDrag(this._state.dragTarget, this._snap(pt.x), this._snap(pt.z));
        break;
      case 'furniture':
        this._moveDragFurniture(pt);
        break;
    }
    this._onDragMove(pt);
  }

  onPointerUp(e) {
    if (e && e.target && e.target.releasePointerCapture && e.pointerId !== undefined) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
    if (this._state.dragTarget === 'furniture' && this._state.dragStartPos && this._state.selectedId !== null) {
      this._furnitureManager.endMove(this._state.selectedId, this._state.dragStartPos);
    }
    if (this._state.dragTarget === 'edge' || this._state.dragTarget === 'vertex') {
      this._outlineEditor.onDragEnd();
    }
    this._state.isDragging = false;
    this._state.dragTarget = null;
    this._state.dragVertexIndex = null;
    this._state.dragEdgeIndex = null;
    this._state.dragEdgeVerts = null;
    this._state.dragStartPos = null;
    this._enableControls();
    this._onDragEnd();
  }

  onPointerCancel(e) {
    if (e && e.target && e.target.releasePointerCapture && e.pointerId !== undefined) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
    if (this._state.dragTarget === 'furniture' && this._state.dragStartPos && this._state.selectedId !== null) {
      this._furnitureManager.endMove(this._state.selectedId, this._state.dragStartPos);
    }
    if (this._state.dragTarget === 'edge' || this._state.dragTarget === 'vertex') {
      this._outlineEditor.onDragEnd();
    }
    this._state.isDragging = false;
    this._state.dragTarget = null;
    this._state.dragVertexIndex = null;
    this._state.dragEdgeIndex = null;
    this._state.dragEdgeVerts = null;
    this._state.dragStartPos = null;
    this._enableControls();
    this._onDragEnd();
  }

  onKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        this._furnitureManager.redo();
      } else {
        this._furnitureManager.undo();
      }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
      e.preventDefault();
      this._furnitureManager.redo();
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (this._state.activeTool === 'outline') {
        this._outlineEditor.onDeleteKey();
      } else {
        this._furnitureManager.deleteSelected();
      }
    } else if (e.key === 'r' || e.key === 'R') {
      this._furnitureManager.rotateSelected(45);
    }
  }

  // ── Private controls helpers ────────────────────────────────────

  _disableControls() {
    if (this._controls) this._controls.enabled = false;
  }

  _enableControls() {
    if (this._controls) this._controls.enabled = true;
  }

  // ── Private raycasting ──────────────────────────────────────────

  _getPointerNDC(e) {
    const rect = this._renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
  }

  _intersectFloor(e) {
    const ndc = this._getPointerNDC(e);
    this._state.raycaster.setFromCamera(ndc, this._getCamera());
    const hits = this._state.raycaster.intersectObject(this._floorPlane);
    return hits.length > 0 ? hits[0].point : null;
  }

  _intersectSpawn(e) {
    const ndc = this._getPointerNDC(e);
    this._state.raycaster.setFromCamera(ndc, this._getCamera());
    const hits = this._state.raycaster.intersectObjects(this._spawnManager._group.children, true);
    return hits.length > 0 ? hits[0].object.userData.spawnType : null;
  }

  // ── Private drag starters ───────────────────────────────────────

  _tryStartSpawnDrag(e) {
    const spawnHit = this._intersectSpawn(e);
    if (!spawnHit) return false;
    this._state.isDragging = true;
    this._state.dragTarget = spawnHit;
    return true;
  }

  _tryStartFurnitureDrag(e) {
    const ndc = this._getPointerNDC(e);
    this._state.raycaster.setFromCamera(ndc, this._getCamera());
    const placedHit = this._furnitureManager.hitTest(
      this._state.raycaster,
      Array.from(this._furnitureManager.meshMap.values())
    );
    if (!placedHit) return false;
    this._furnitureManager.select(placedHit.userData._editorId);
    this._state.isDragging = true;
    this._state.dragTarget = 'furniture';
    this._state.dragStartPos = placedHit.position.clone();
    const pt = this._intersectFloor(e);
    if (pt) {
      this._state.dragOffset.set(pt.x - placedHit.position.x, 0, pt.z - placedHit.position.z);
    }
    return true;
  }

  // ── Private click handler ───────────────────────────────────────

  _handleFloorClick(pt) {
    const s = this._snap;
    if (this._state.activeTool === 'player') {
      this._spawnManager.setSpawn('player', s(pt.x), s(pt.z));
      this._onSpawnPlaced('player');
    } else if (this._state.activeTool === 'lulu') {
      this._spawnManager.setSpawn('lulu', s(pt.x), s(pt.z));
      this._onSpawnPlaced('lulu');
    } else if (this._state.activeTool && this._state.activeTool.startsWith('place:')) {
      const type = this._state.activeTool.slice(6);
      const y = type === 'ceilingLamp' ? this._config.wallH : type === 'window' ? 1.5 : 0;
      this._furnitureManager.place(type, s(pt.x), y, s(pt.z));
      this._onFurniturePlaced();
    } else {
      this._furnitureManager.select(null);
    }
  }

  _moveDragFurniture(pt) {
    if (this._state.selectedId === null) return;
    const mesh = this._furnitureManager.meshMap.get(this._state.selectedId);
    if (!mesh) return;
    const x = this._snap(pt.x - this._state.dragOffset.x);
    const z = this._snap(pt.z - this._state.dragOffset.z);
    this._furnitureManager.updateMove(this._state.selectedId, x, z);
  }
}
