/**
 * @fileoverview Pet renderer — syncs domain Pet state to Three.js meshes.
 *
 * SRP: Translates pure-domain numbers into Three.js object mutations.
 *      If Three.js changes its API, only this file changes.
 */

import * as THREE from 'three';

/**
 * @param {Pet} pet
 * @param {THREE.Group} threeGroup — the mesh returned by the builder
 */
export function syncPetToThreeJS(pet, threeGroup, playerPosition) {
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

  updateDebugLine(pet, threeGroup, playerPosition);
}

/* ── Debug line: head → player (optional, no-op if pet missing methods) ── */

function updateDebugLine(pet, threeGroup, playerPosition) {
  if (typeof threeGroup.add !== 'function') return;

  let line = threeGroup.getObjectByName('__lulu_debug_line');
  if (!line) {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x00ffff, depthTest: false }));
    line.name = '__lulu_debug_line';
    threeGroup.add(line);
  }

  // Head world position (approximate using pet position + local offset scaled)
  const s = threeGroup.scale.x || 1;
  const headWorldX = pet.position.x + (0.22 * Math.cos(pet.bodyRotation)) * s;
  const headWorldZ = pet.position.z + (0.22 * Math.sin(pet.bodyRotation)) * s;
  const headWorldY = pet.position.y + 0.12 * s;

  const pos = line.geometry.attributes.position.array;
  pos[0] = headWorldX; pos[1] = headWorldY; pos[2] = headWorldZ;
  pos[3] = playerPosition?.x ?? pet.position.x; pos[4] = headWorldY; pos[5] = playerPosition?.z ?? pet.position.z;
  line.geometry.attributes.position.needsUpdate = true;
}
