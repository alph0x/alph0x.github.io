/**
 * @fileoverview Player renderer — syncs domain Player state to Three.js camera.
 *
 * SRP: Translates pure-domain position into Three.js camera mutations.
 *      If Three.js changes its API, only this file changes.
 */

import * as THREE from 'three';
import type { Player } from '../domain/player.js';

/**
 * Extract the camera's forward direction, flattened to the XZ plane.
 */
const _forward = new THREE.Vector3(); // scratch — avoids a per-frame allocation

export function extractCameraForwardXZ(camera: THREE.Camera): { x: number; z: number } {
  camera.getWorldDirection(_forward);
  _forward.y = 0;
  _forward.normalize();
  return { x: _forward.x, z: _forward.z };
}

/**
 * Copy the player's position into the camera.
 */
export function syncPlayerToCamera(player: Player, camera: THREE.Camera): void {
  camera.position.set(player.position.x, player.position.y, player.position.z);
}
