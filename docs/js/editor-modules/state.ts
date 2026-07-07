/**
 * @fileoverview EditorState — encapsulated mutable state for the Room Layout Editor.
 * Single source of truth for all editor data. UI and renderer layers depend on this,
 * but this class knows nothing about DOM or Three.js.
 */

import * as THREE from 'three';
import type { FurnitureConfig } from '../seed.js';

export interface PlacedItem {
  id: number;
  type: string;
  name: string;
  mesh: THREE.Object3D;
  config: FurnitureConfig & { _openingDims?: { width: number; height: number } };
}

export interface SpawnPoint {
  x: number;
  z: number;
}

export interface MatConfig {
  floor: string;
  wall: string;
  ceiling: string;
}

export interface SeedLayout {
  outline: number[][];
  placed: PlacedItem[];
  playerSpawn: number[];
  luluSpawn: number[];
  mat: MatConfig;
}

interface EditorStateData {
  outline: number[][];
  placed: PlacedItem[];
  selectedId: number | null;
  activeTool: string | null;
  viewMode: 'top' | '3d';
  playerSpawn: SpawnPoint;
  luluSpawn: SpawnPoint;
  isDragging: boolean;
  dragTarget: number | null;
  dragVertexIndex: number | null;
  dragEdgeIndex: number | null;
  dragEdgeVerts: [number, number] | null;
  dragOffset: THREE.Vector3;
  dragStartPos: THREE.Vector3 | null;
  raycaster: THREE.Raycaster;
  pointer: THREE.Vector2;
  mat: MatConfig;
  lastAction: string | null;
  snapEnabled: boolean;
  snapSize: number;
}

export class EditorState {
  private _data: EditorStateData;

  constructor() {
    this._data = {
      outline: [
        [-2.25, -1.75],
        [2.25, -1.75],
        [2.25, 1.75],
        [-2.25, 1.75],
      ],
      placed: [],
      selectedId: null,
      activeTool: null,
      viewMode: 'top',
      playerSpawn: { x: 0, z: 0 },
      luluSpawn: { x: 0.3, z: 0.7 },
      isDragging: false,
      dragTarget: null,
      dragVertexIndex: null,
      dragEdgeIndex: null,
      dragEdgeVerts: null,
      dragOffset: new THREE.Vector3(),
      dragStartPos: null,
      raycaster: new THREE.Raycaster(),
      pointer: new THREE.Vector2(),
      mat: { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' },
      lastAction: null,
      snapEnabled: true,
      snapSize: 0.05,
    };
  }

  // ── Raw accessors (for gradual migration) ───────────────────────

  get outline() { return this._data.outline; }
  set outline(v) { this._data.outline = v; }

  get placed() { return this._data.placed; }
  set placed(v) { this._data.placed = v; }

  get selectedId() { return this._data.selectedId; }
  set selectedId(v) { this._data.selectedId = v; }

  get activeTool() { return this._data.activeTool; }
  set activeTool(v) { this._data.activeTool = v; }

  get viewMode() { return this._data.viewMode; }
  set viewMode(v) { this._data.viewMode = v; }

  get playerSpawn() { return this._data.playerSpawn; }
  set playerSpawn(v) { this._data.playerSpawn = v; }

  get luluSpawn() { return this._data.luluSpawn; }
  set luluSpawn(v) { this._data.luluSpawn = v; }

  get isDragging() { return this._data.isDragging; }
  set isDragging(v) { this._data.isDragging = v; }

  get dragTarget() { return this._data.dragTarget; }
  set dragTarget(v) { this._data.dragTarget = v; }

  get dragVertexIndex() { return this._data.dragVertexIndex; }
  set dragVertexIndex(v) { this._data.dragVertexIndex = v; }

  get dragEdgeIndex() { return this._data.dragEdgeIndex; }
  set dragEdgeIndex(v) { this._data.dragEdgeIndex = v; }

  get dragEdgeVerts() { return this._data.dragEdgeVerts; }
  set dragEdgeVerts(v) { this._data.dragEdgeVerts = v; }

  get dragOffset() { return this._data.dragOffset; }
  set dragOffset(v) { this._data.dragOffset.copy(v); }

  get dragStartPos() { return this._data.dragStartPos; }
  set dragStartPos(v) { this._data.dragStartPos = v; }

  get raycaster() { return this._data.raycaster; }

  get pointer() { return this._data.pointer; }

  get mat() { return this._data.mat; }

  get snapEnabled() { return this._data.snapEnabled; }
  set snapEnabled(v) { this._data.snapEnabled = v; }

  get snapSize() { return this._data.snapSize; }
  set snapSize(v) { this._data.snapSize = v; }

  // ── Controlled mutations ────────────────────────────────────────

  setOutlineVertex(index: number, value: number[]) {
    this._data.outline[index] = value;
  }

  addPlaced(item: PlacedItem) {
    this._data.placed.push(item);
  }

  removePlaced(id: number) {
    this._data.placed = this._data.placed.filter((p) => p.id !== id);
  }

  findPlaced(id: number) {
    return this._data.placed.find((p) => p.id === id);
  }

  updatePlacedConfig(id: number, updater: (item: PlacedItem) => void) {
    const item = this.findPlaced(id);
    if (item) updater(item);
  }

  get placedCount() {
    return this._data.placed.length;
  }

  // ── Serialization helpers ───────────────────────────────────────

  toSeedPayload() {
    return {
      outline: this._data.outline,
      placed: this._data.placed,
      playerSpawn: this._data.playerSpawn,
      luluSpawn: this._data.luluSpawn,
      mat: this._data.mat,
    };
  }

  loadFromSeed(layout: SeedLayout) {
    this._data.outline = layout.outline.map((v) => [...v]);
    this._data.placed = [];
    this._data.selectedId = null;
    this._data.lastAction = null;
    this._data.playerSpawn = { x: layout.playerSpawn[0], z: layout.playerSpawn[1] };
    this._data.luluSpawn = { x: layout.luluSpawn[0], z: layout.luluSpawn[1] };
    this._data.mat = { ...layout.mat };
  }
}
