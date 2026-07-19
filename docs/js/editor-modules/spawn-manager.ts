/**
 * @fileoverview SpawnManager — visual meshes and position updates for player / Lulu spawns.
 */

import * as THREE from 'three';
import type { EditorState } from './state.js';

type SpawnType = 'player' | 'lulu';

interface SpawnManagerConfig {
  colors: {
    playerSpawn: number;
    luluSpawn: number;
  };
  geometry: {
    spawnPlayerRadius: number;
    spawnPlayerHeight: number;
    spawnLuluRadius: number;
    spawnLuluHeight: number;
  };
}

export class SpawnManager {
  private readonly _group: THREE.Group;
  private readonly _state: EditorState;
  private readonly _config: SpawnManagerConfig;

  constructor(spawnGroup: THREE.Group, state: EditorState, config: SpawnManagerConfig) {
    this._group = spawnGroup;
    this._state = state;
    this._config = config;
  }

  /** Rebuild both spawn meshes from current state. */
  rebuild(): void {
    this._group.clear();
    this._group.add(this._createPlayerMesh());
    this._group.add(this._createLuluMesh());
  }

  /** Set spawn position and rebuild visuals. Pass isDrag for drag moves (keeps activeTool). */
  setSpawn(type: SpawnType, x: number, z: number, isDrag = false): void {
    const spawn = type === 'player' ? this._state.playerSpawn : this._state.luluSpawn;
    spawn.x = x;
    spawn.z = z;
    this.rebuild();
    if (!isDrag) this._state.activeTool = null;
  }

  /** Update spawn position during drag (no activeTool change). */
  moveDrag(type: SpawnType, x: number, z: number): void {
    this.setSpawn(type, x, z, true);
  }

  // ── Private mesh builders ───────────────────────────────────────

  private _createPlayerMesh(): THREE.Mesh {
    const geo = new THREE.ConeGeometry(
      this._config.geometry.spawnPlayerRadius,
      this._config.geometry.spawnPlayerHeight,
      8
    );
    const mat = new THREE.MeshBasicMaterial({ color: this._config.colors.playerSpawn });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      this._state.playerSpawn.x,
      this._config.geometry.spawnPlayerHeight / 2,
      this._state.playerSpawn.z
    );
    mesh.rotation.x = Math.PI;
    mesh.userData = { spawnType: 'player' };
    return mesh;
  }

  private _createLuluMesh(): THREE.Mesh {
    const geo = new THREE.CapsuleGeometry(
      this._config.geometry.spawnLuluRadius,
      this._config.geometry.spawnLuluHeight,
      4,
      8
    );
    const mat = new THREE.MeshBasicMaterial({ color: this._config.colors.luluSpawn });
    const mesh = new THREE.Mesh(geo, mat);
    // Capsule center sits radius + half the mid-length above its bottom cap;
    // using only the radius sank the marker ~6 cm through the floor plane.
    mesh.position.set(
      this._state.luluSpawn.x,
      this._config.geometry.spawnLuluHeight / 2 + this._config.geometry.spawnLuluRadius,
      this._state.luluSpawn.z
    );
    mesh.userData = { spawnType: 'lulu' };
    return mesh;
  }
}
