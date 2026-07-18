import * as THREE from 'three';

// ponytail: module registry filled at level build; avoids a full scene walk per frame.
// Stale entries from a rebuilt level would be harmless no-ops (level is built once).
const _flickerLights: THREE.PointLight[] = [];

/** Register a flickering light at build time (see level/lighting.ts). */
export function registerFlickerLight(light: THREE.PointLight): void {
  _flickerLights.push(light);
}

export function updateFlickerLights(time: number): void {
  for (const light of _flickerLights) {
    light.intensity = light.userData.baseIntensity + Math.sin(time * light.userData.flickerSpeed + light.userData.flickerPhase) * 0.3;
  }
}
