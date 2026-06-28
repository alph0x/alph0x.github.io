import * as THREE from 'three';

export function updateFlickerLights(scene: THREE.Scene, time: number): void {
  scene.traverse((obj) => {
    const light = obj as THREE.PointLight;
    if (light.isPointLight && light.userData.flicker) {
      light.intensity = light.userData.baseIntensity + Math.sin(time * light.userData.flickerSpeed + light.userData.flickerPhase) * 0.3;
    }
  });
}
