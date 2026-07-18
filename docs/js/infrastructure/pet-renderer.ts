/**
 * @fileoverview Pet renderer — syncs domain Pet state to Three.js meshes.
 *
 * SRP: Translates pure-domain numbers into Three.js object mutations.
 *      If Three.js changes its API, only this file changes.
 */

import * as THREE from 'three';
import type { Pet } from '../domain/pet.js';

interface PetRefs {
  body: THREE.Object3D | null;
  tail: THREE.Object3D | null;
  earL: THREE.Object3D | null;
  earR: THREE.Object3D | null;
  head: THREE.Object3D | null;
}

// ponytail: named children never change for a built pet group, so resolve them
// once per group instead of walking the subtree every frame.
const _refsCache = new WeakMap<THREE.Object3D, PetRefs>();

function findByName(root: THREE.Object3D, name: string): THREE.Object3D | null {
  const children = root.children;
  if (!children) return null;
  for (const child of children) {
    if (child.name === name) return child;
    const hit = findByName(child, name);
    if (hit) return hit;
  }
  return null;
}

function refsFor(group: THREE.Object3D): PetRefs {
  let refs = _refsCache.get(group);
  if (!refs) {
    refs = {
      body: findByName(group, 'body'),
      tail: findByName(group, 'tail'),
      earL: findByName(group, 'earL'),
      earR: findByName(group, 'earR'),
      head: findByName(group, 'head'),
    };
    _refsCache.set(group, refs);
  }
  return refs;
}

export function syncPetToThreeJS(
  pet: Pet,
  threeGroup: THREE.Group,
  _playerPosition: THREE.Vector3
): void {
  const refs = refsFor(threeGroup);

  if (refs.body) refs.body.scale.set(1, pet.breathScale, 1);

  if (refs.tail) {
    refs.tail.rotation.z = pet.tailRotationZ;
    refs.tail.rotation.y = pet.tailRotationY;
  }

  if (refs.earL) refs.earL.rotation.z = pet.earLRotationZ;
  if (refs.earR) refs.earR.rotation.z = pet.earRRotationZ;

  if (refs.head) {
    if (pet.isSleeping) {
      refs.head.rotation.x = -0.45;
      refs.head.rotation.y = 0;
    } else {
      refs.head.rotation.x = 0;
      refs.head.rotation.y = pet.headRotation;
    }
  }
}
