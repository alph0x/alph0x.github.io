/**
 * @fileoverview Player renderer — syncs domain Player state to Three.js camera.
 *
 * SRP: Translates pure-domain position into Three.js camera mutations.
 *      If Three.js changes its API, only this file changes.
 */

import * as THREE from 'three';

/**
 * Extract the camera's forward direction, flattened to the XZ plane.
 *
 * @param {THREE.Camera} camera
 * @returns {{x:number,z:number}} normalized forward vector
 */
export function extractCameraForwardXZ(camera) {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  return { x: forward.x, z: forward.z };
}

/**
 * Copy the player's position into the camera.
 *
 * @param {Player} player
 * @param {THREE.Camera} camera
 */
export function syncPlayerToCamera(player, camera) {
  camera.position.set(player.position.x, player.position.y, player.position.z);
}
