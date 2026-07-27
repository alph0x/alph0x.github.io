import * as THREE from 'three';
import { texScreenGlow } from '../assets/index.js';

// Shared glow/emissive idioms for furniture builders (P-13, D-11).
// Tag semantics are consumed by level/lighting.ts applyTimeOfDay — preserved, not redefined.

/** Screen glow: unlit textured material boosted past the bloom threshold. */
export function makeScreenGlow(): THREE.MeshBasicMaterial {
  const mat = new THREE.MeshBasicMaterial({ map: texScreenGlow });
  mat.color.multiplyScalar(4); // crosses the 1.45 bloom threshold
  return mat;
}

/** Tag a mesh with its LDR emissive base as a hex number (lighting.ts setHex contract). */
export function tagEmissiveBase(mesh: THREE.Mesh): void {
  mesh.userData._emissiveBase = (mesh.material as THREE.MeshBasicMaterial).color.getHex();
}

/**
 * Clone a base glow material and HDR-boost it for a PC LED.
 * ponytail: never snapshot to hex here — lighting.ts caches the boosted Color; hex clamps HDR.
 */
export function makePcLedGlow(base: THREE.MeshBasicMaterial): THREE.MeshBasicMaterial {
  const mat = base.clone();
  mat.color.multiplyScalar(2.5);
  return mat;
}
