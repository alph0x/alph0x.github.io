/**
 * @fileoverview SpawnManager — visual meshes and position updates for player / Lulu spawns.
 */

import * as THREE from 'three';

export class SpawnManager {
  /**
   * @param {THREE.Group} spawnGroup
   * @param {EditorState} state
   * @param {object} config — editor CONFIG (colors + geometry)
   */
  constructor(spawnGroup, state, config) {
    this._group = spawnGroup;
    this._state = state;
    this._config = config;
  }

  /** Rebuild both spawn meshes from current state. */
  rebuild() {
    this._group.clear();
    this._group.add(this._createPlayerMesh());
    this._group.add(this._createLuluMesh());
  }

  /** Set spawn position and rebuild visuals. */
  setSpawn(type, x, z) {
    if (type === 'player') {
      this._state.playerSpawn.x = x;
      this._state.playerSpawn.z = z;
    } else if (type === 'lulu') {
      this._state.luluSpawn.x = x;
      this._state.luluSpawn.z = z;
    }
    this.rebuild();
    this._state.activeTool = null;
  }

  /** Update spawn position during drag (no activeTool change). */
  moveDrag(type, x, z) {
    if (type === 'player') {
      this._state.playerSpawn.x = x;
      this._state.playerSpawn.z = z;
    } else if (type === 'lulu') {
      this._state.luluSpawn.x = x;
      this._state.luluSpawn.z = z;
    }
    this.rebuild();
  }

  // ── Private mesh builders ───────────────────────────────────────

  _createPlayerMesh() {
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

  _createLuluMesh() {
    const geo = new THREE.CapsuleGeometry(
      this._config.geometry.spawnLuluRadius,
      this._config.geometry.spawnLuluHeight,
      4,
      8
    );
    const mat = new THREE.MeshBasicMaterial({ color: this._config.colors.luluSpawn });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      this._state.luluSpawn.x,
      this._config.geometry.spawnLuluRadius,
      this._state.luluSpawn.z
    );
    mesh.userData = { spawnType: 'lulu' };
    return mesh;
  }
}
