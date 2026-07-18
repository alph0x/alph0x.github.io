/**
 * @fileoverview Dust-mote drift for the window shaft (built in level/atmosphere.ts).
 * Same module-registry pattern as flicker.ts — no per-frame scene walk.
 */

import * as THREE from 'three';

const _clouds: THREE.Points[] = [];

/** Register a dust cloud at build time. */
export function registerDust(cloud: THREE.Points): void {
  _clouds.push(cloud);
}

const isTestEnv = typeof window !== 'undefined' && (window as unknown as { __snapshotMode?: boolean }).__snapshotMode === true;

export function updateDust(time: number): void {
  if (isTestEnv) return;
  const t = time * 0.001;
  for (const cloud of _clouds) {
    const base = cloud.userData._base as Float32Array;
    const phase = cloud.userData._phase as Float32Array;
    const attr = cloud.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < phase.length; i++) {
      attr.setX(i, base[i * 3] + Math.cos(t * 0.22 + phase[i] * 1.7) * 0.05);
      attr.setY(i, base[i * 3 + 1] + Math.sin(t * 0.3 + phase[i]) * 0.06);
    }
    attr.needsUpdate = true;
  }
}
