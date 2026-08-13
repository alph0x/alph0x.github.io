/**
 * @fileoverview Slow cloud drift for the window landscape. Clouds register at
 * build time (furniture/builders/cityscape.ts) and glide along +x, wrapping
 * around once they leave the vista. Motion is ambient and continuous — no
 * scroll triggers, no bounce.
 */

import * as THREE from 'three';

const _clouds: THREE.Object3D[] = [];
const WRAP_X = 60;

/** Register a drifting cloud at build time (object must have userData._driftSpeed). */
export function registerCloud(obj: THREE.Object3D): void {
  _clouds.push(obj);
}

export function updateClouds(delta: number): void {
  for (const obj of _clouds) {
    const speed = (obj.userData._driftSpeed as number) || 0.1;
    obj.position.x += speed * delta;
    if (obj.position.x > WRAP_X) obj.position.x = -WRAP_X;
  }
}
