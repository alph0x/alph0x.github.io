/**
 * @fileoverview InteractionManager — pointer, keyboard, and raycast orchestration.
 * Dispatches events to SpawnManager, FurnitureManager, and OutlineEditor.
 */

import * as THREE from 'three';
import { closeLegend, isLegendBlocking, isTypingTarget, pointerNDC, toggleLegend } from '../systems/input-utils.js';
import { EditorState } from './state.js';
import type { FurnitureManager } from './furniture-manager.js';
import type { OutlineEditor } from './outline-editor.js';
import type { SpawnManager } from './spawn-manager.js';
import type { RoomBuilder } from './room-builder.js';

interface InteractionConfig {
  wallH: number;
}

interface ControlsLike {
  enabled: boolean;
}

interface InteractionDeps {
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera | (() => THREE.Camera);
  state: EditorState;
  floorPlane: THREE.Mesh;
  furnitureManager: FurnitureManager;
  outlineEditor: OutlineEditor;
  spawnManager: SpawnManager;
  roomBuilder: RoomBuilder;
  config: InteractionConfig;
  snap: (v: number) => number;
  controls?: ControlsLike | (() => ControlsLike) | null;
  onSpawnPlaced?: (type: string) => void;
  onFurniturePlaced?: () => void;
  onDragMove?: (pt: THREE.Vector3) => void;
  onDragEnd?: () => void;
}

// EditorState types dragTarget/dragEdgeVerts too narrowly for string/pair usage.
interface StateCompat extends Omit<EditorState, 'dragTarget' | 'dragEdgeVerts'> {
  dragTarget: string | null;
  dragEdgeVerts: [[number, number], [number, number]] | null;
}

interface FurnitureUserData {
  _editorId?: number;
  _hitSize?: number;
}

export class InteractionManager {
  private _renderer: THREE.WebGLRenderer;
  private _getCamera: () => THREE.Camera;
  private _state: EditorState;
  private _floorPlane: THREE.Mesh;
  private _furnitureManager: FurnitureManager;
  private _outlineEditor: OutlineEditor;
  private _spawnManager: SpawnManager;
  private _roomBuilder: RoomBuilder;
  private _config: InteractionConfig;
  private _snap: (v: number) => number;
  private _getControls: (() => ControlsLike) | null;
  private _controls: ControlsLike | null;
  private _onSpawnPlaced: (type: string) => void;
  private _onFurniturePlaced: () => void;
  private _onDragMove: (pt: THREE.Vector3) => void;
  private _onDragEnd: () => void;
  private _boundOnPointerDown: (e: PointerEvent) => void;
  private _boundOnPointerMove: (e: PointerEvent) => void;
  private _boundOnPointerUp: (e?: PointerEvent) => void;
  private _boundOnPointerCancel: (e?: PointerEvent) => void;
  private _boundOnKeyDown: (e: KeyboardEvent) => void;

  /**
   * @param deps — editor subsystem dependencies
   */
  constructor(deps: InteractionDeps) {
    this._renderer = deps.renderer;
    this._getCamera = typeof deps.camera === 'function'
      ? (deps.camera as () => THREE.Camera)
      : () => deps.camera as THREE.Camera;
    this._state = deps.state;
    this._floorPlane = deps.floorPlane;
    this._furnitureManager = deps.furnitureManager;
    this._outlineEditor = deps.outlineEditor;
    this._spawnManager = deps.spawnManager;
    this._roomBuilder = deps.roomBuilder;
    this._config = deps.config;
    this._snap = deps.snap;
    if (typeof deps.controls === 'function') {
      this._getControls = deps.controls as () => ControlsLike;
      this._controls = null;
    } else {
      this._getControls = null;
      this._controls = deps.controls || null;
    }
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
  get _camera(): THREE.Camera {
    return this._getCamera();
  }

  attach(): void {
    this._renderer.domElement.addEventListener('pointerdown', this._boundOnPointerDown);
    this._renderer.domElement.addEventListener('pointermove', this._boundOnPointerMove);
    this._renderer.domElement.addEventListener('pointerup', this._boundOnPointerUp);
    this._renderer.domElement.addEventListener('pointercancel', this._boundOnPointerCancel);
    this._renderer.domElement.addEventListener('pointerleave', this._boundOnPointerCancel);
    document.addEventListener('keydown', this._boundOnKeyDown);
  }

  detach(): void {
    this._renderer.domElement.removeEventListener('pointerdown', this._boundOnPointerDown);
    this._renderer.domElement.removeEventListener('pointermove', this._boundOnPointerMove);
    this._renderer.domElement.removeEventListener('pointerup', this._boundOnPointerUp);
    this._renderer.domElement.removeEventListener('pointercancel', this._boundOnPointerCancel);
    this._renderer.domElement.removeEventListener('pointerleave', this._boundOnPointerCancel);
    document.removeEventListener('keydown', this._boundOnKeyDown);
  }

  // ── Public event handlers ───────────────────────────────────────

  onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    if (this._state.isDragging) return;

    if (this._state.activeTool === 'outline') {
      const handled = this._outlineEditor.onPointerDown(e, this._intersectFloor.bind(this));
      if (handled) {
        const s = this._state as unknown as StateCompat;
        const target = e.target as HTMLElement;
        if (s.isDragging && target && target.setPointerCapture) {
          target.setPointerCapture(e.pointerId);
        }
        if (s.isDragging) {
          this._disableControls();
        }
        return;
      }
      // If outlineEditor did not handle the event, fall through to furniture/spawn/floor.
    }

    if (this._tryStartSpawnDrag(e)) {
      const target = e.target as HTMLElement;
      if (target && target.setPointerCapture) {
        target.setPointerCapture(e.pointerId);
      }
      this._disableControls();
      return;
    }
    if (this._tryStartFurnitureDrag(e)) {
      const target = e.target as HTMLElement;
      if (target && target.setPointerCapture) {
        target.setPointerCapture(e.pointerId);
      }
      this._disableControls();
      return;
    }

    const pt = this._intersectFloor(e);
    if (pt) this._handleFloorClick(pt);
  }

  onPointerMove(e: PointerEvent): void {
    if (!this._state.isDragging) return;
    const pt = this._intersectFloor(e);
    if (!pt) return;

    const s = this._state as unknown as StateCompat;
    switch (s.dragTarget) {
      case 'edge':
      case 'vertex':
        this._outlineEditor.onPointerMove(pt);
        break;
      case 'player':
      case 'lulu':
        this._spawnManager.moveDrag(s.dragTarget, this._snap(pt.x), this._snap(pt.z));
        break;
      case 'furniture':
        this._moveDragFurniture(pt);
        break;
    }
    this._onDragMove(pt);
  }

  onPointerUp(e?: PointerEvent): void {
    const target = e?.target as HTMLElement | undefined;
    if (target && target.releasePointerCapture && e && e.pointerId !== undefined) {
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore releasePointerCapture failures during cleanup.
      }
    }
    const s = this._state as unknown as StateCompat;
    if (s.dragTarget === 'furniture' && s.dragStartPos && s.selectedId !== null) {
      this._furnitureManager.endMove(s.selectedId, s.dragStartPos);
    }
    if (s.dragTarget === 'edge' || s.dragTarget === 'vertex') {
      this._outlineEditor.onDragEnd();
    }
    s.isDragging = false;
    s.dragTarget = null;
    s.dragVertexIndex = null;
    s.dragEdgeIndex = null;
    s.dragEdgeVerts = null;
    s.dragStartPos = null;
    this._enableControls();
    this._onDragEnd();
  }

  onPointerCancel(e?: PointerEvent): void {
    const target = e?.target as HTMLElement | undefined;
    if (target && target.releasePointerCapture && e && e.pointerId !== undefined) {
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore releasePointerCapture failures during cleanup.
      }
    }
    const s = this._state as unknown as StateCompat;
    if (s.dragTarget === 'furniture' && s.dragStartPos && s.selectedId !== null) {
      this._furnitureManager.endMove(s.selectedId, s.dragStartPos);
    }
    if (s.dragTarget === 'edge' || s.dragTarget === 'vertex') {
      this._outlineEditor.onDragEnd();
    }
    s.isDragging = false;
    s.dragTarget = null;
    s.dragVertexIndex = null;
    s.dragEdgeIndex = null;
    s.dragEdgeVerts = null;
    s.dragStartPos = null;
    this._enableControls();
    this._onDragEnd();
  }

  onKeyDown(e: KeyboardEvent): void {
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
    if (e.code === 'Escape' || e.key === 'Escape') {
      closeLegend();
      return;
    }
    if (isTypingTarget(e)) return;
    if (isLegendBlocking(e)) return;
    if (e.code === 'KeyH' || e.code === 'Slash') {
      toggleLegend();
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

  private get _liveControls(): ControlsLike | null {
    return this._getControls ? this._getControls() : this._controls;
  }

  private _disableControls(): void {
    const controls = this._liveControls;
    if (controls) controls.enabled = false;
  }

  private _enableControls(): void {
    const controls = this._liveControls;
    if (controls) controls.enabled = true;
  }

  // ── Private raycasting ──────────────────────────────────────────

  private _intersectFloor(e: PointerEvent): THREE.Vector3 | null {
    const ndc = pointerNDC(e, this._renderer.domElement);
    this._state.raycaster.setFromCamera(ndc, this._getCamera());
    const hits = this._state.raycaster.intersectObject(this._floorPlane);
    return hits.length > 0 ? hits[0].point : null;
  }

  private _intersectSpawn(e: PointerEvent): string | null {
    const ndc = pointerNDC(e, this._renderer.domElement);
    this._state.raycaster.setFromCamera(ndc, this._getCamera());
    const spawnManager = this._spawnManager as unknown as { _group: THREE.Group };
    const group = spawnManager._group;
    const hits = this._state.raycaster.intersectObjects(group.children, true);
    if (hits.length === 0) return null;
    const data = hits[0].object.userData as { spawnType?: string };
    return data.spawnType ?? null;
  }

  // ── Private drag starters ───────────────────────────────────────

  private _tryStartSpawnDrag(e: PointerEvent): boolean {
    const spawnHit = this._intersectSpawn(e);
    if (!spawnHit) return false;
    const s = this._state as unknown as StateCompat;
    s.isDragging = true;
    s.dragTarget = spawnHit;
    return true;
  }

  private _tryStartFurnitureDrag(e: PointerEvent): boolean {
    const ndc = pointerNDC(e, this._renderer.domElement);
    this._state.raycaster.setFromCamera(ndc, this._getCamera());
    const placedHit = this._furnitureManager.hitTest(
      this._state.raycaster,
      Array.from(this._furnitureManager.meshMap.values())
    );
    if (!placedHit) return false;
    const data = placedHit.userData as FurnitureUserData;
    this._furnitureManager.select(data._editorId ?? 0);
    const s = this._state as unknown as StateCompat;
    s.isDragging = true;
    s.dragTarget = 'furniture';
    s.dragStartPos = placedHit.position.clone();
    const pt = this._intersectFloor(e);
    if (pt) {
      this._state.dragOffset.set(pt.x - placedHit.position.x, 0, pt.z - placedHit.position.z);
    }
    return true;
  }

  // ── Private click handler ───────────────────────────────────────

  private _handleFloorClick(pt: THREE.Vector3): void {
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

  private _moveDragFurniture(pt: THREE.Vector3): void {
    if (this._state.selectedId === null) return;
    const mesh = this._furnitureManager.meshMap.get(this._state.selectedId);
    if (!mesh) return;
    const x = this._snap(pt.x - this._state.dragOffset.x);
    const z = this._snap(pt.z - this._state.dragOffset.z);
    this._furnitureManager.updateMove(this._state.selectedId, x, z);
  }
}
