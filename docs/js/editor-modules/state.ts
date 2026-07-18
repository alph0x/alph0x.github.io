/**
 * @fileoverview EditorState — mutable state for the Room Layout Editor.
 * Single source of truth for all editor data. UI and renderer layers depend on this,
 * but this class knows nothing about the DOM.
 */

import { DEFAULT_MAT } from '../core.js';
import { DEFAULT_LULU_SPAWN } from '../seed.js';

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

export class EditorState {
  outline: number[][] = [
    [-2.25, -1.75],
    [2.25, -1.75],
    [2.25, 1.75],
    [-2.25, 1.75],
  ];
  placed: PlacedItem[] = [];
  selectedId: number | null = null;
  activeTool: string | null = null;
  viewMode: 'top' | '3d' = 'top';
  playerSpawn: SpawnPoint = { x: 0, z: 0 };
  luluSpawn: SpawnPoint = { x: DEFAULT_LULU_SPAWN[0], z: DEFAULT_LULU_SPAWN[1] };
  isDragging = false;
  dragTarget: number | null = null;
  dragVertexIndex: number | null = null;
  dragEdgeIndex: number | null = null;
  dragEdgeVerts: [number, number] | null = null;
  dragOffset = new THREE.Vector3();
  dragStartPos: THREE.Vector3 | null = null;
  readonly raycaster = new THREE.Raycaster();
  mat: MatConfig = { ...DEFAULT_MAT };
  snapEnabled = true;
  snapSize = 0.05;

  // ── Controlled mutations ────────────────────────────────────────

  setOutlineVertex(index: number, value: number[]) {
    this.outline[index] = value;
  }

  addPlaced(item: PlacedItem) {
    this.placed.push(item);
  }

  removePlaced(id: number) {
    this.placed = this.placed.filter((p) => p.id !== id);
  }

  findPlaced(id: number) {
    return this.placed.find((p) => p.id === id);
  }

  updatePlacedConfig(id: number, updater: (item: PlacedItem) => void) {
    const item = this.findPlaced(id);
    if (item) updater(item);
  }

  get placedCount() {
    return this.placed.length;
  }

  // ── Serialization helpers ───────────────────────────────────────

  toSeedPayload() {
    return {
      outline: this.outline,
      placed: this.placed,
      playerSpawn: this.playerSpawn,
      luluSpawn: this.luluSpawn,
      mat: this.mat,
    };
  }

  loadFromSeed(layout: SeedLayout) {
    this.outline = layout.outline.map((v) => [...v]);
    this.placed = [];
    this.selectedId = null;
    this.playerSpawn = { x: layout.playerSpawn[0], z: layout.playerSpawn[1] };
    this.luluSpawn = { x: layout.luluSpawn[0], z: layout.luluSpawn[1] };
    this.mat = { ...layout.mat };
  }
}
