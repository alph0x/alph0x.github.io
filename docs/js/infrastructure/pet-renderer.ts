/**
 * @fileoverview Pet renderer — syncs domain Pet state to Three.js meshes.
 *
 * SRP: Translates pure-domain numbers into Three.js object mutations.
 *      If Three.js changes its API, only this file changes.
 */

import * as THREE from 'three';
import type { Pet } from '../domain/pet.js';

export function syncPetToThreeJS(
  pet: Pet,
  threeGroup: THREE.Group,
  _playerPosition: THREE.Vector3
): void {
  const body = threeGroup.getObjectByName('body');
  if (body) body.scale.set(1, pet.breathScale, 1);

  const tail = threeGroup.getObjectByName('tail');
  if (tail) {
    tail.rotation.z = pet.tailRotationZ;
    tail.rotation.y = pet.tailRotationY;
  }

  const earL = threeGroup.getObjectByName('earL');
  const earR = threeGroup.getObjectByName('earR');
  if (earL) earL.rotation.z = pet.earLRotationZ;
  if (earR) earR.rotation.z = pet.earRRotationZ;

  const head = threeGroup.getObjectByName('head');
  if (head) head.rotation.y = pet.headRotation;
}
