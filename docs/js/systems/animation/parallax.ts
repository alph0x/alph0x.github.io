/**
 * @fileoverview Parallax effect for window cityscapes.
 * Cityscapes move slightly opposite to camera movement to create depth.
 * Supports nested parallax groups so each depth layer can have its own speed.
 */

import * as THREE from 'three';

interface ParallaxBase {
  x: number;
  z: number;
}

export function updateParallax(scene: THREE.Scene, camera: THREE.Camera): void {
  if (!camera) return;
  const cx = camera.position.x;
  const cz = camera.position.z;

  scene.traverse((obj: THREE.Object3D) => {
    if (!obj.userData._parallax) return;
    const factor = obj.userData._parallaxFactor || 0.03;
    // Find the reference window group by walking up past nested parallax groups.
    let windowGroup: THREE.Object3D | null = obj.parent;
    while (windowGroup && windowGroup.userData && windowGroup.userData._parallax) {
      windowGroup = windowGroup.parent;
    }
    if (windowGroup) {
      // Capture the static base position on first sight so nested layers keep their offsets.
      if (!obj.userData._parallaxBase) {
        obj.userData._parallaxBase = { x: obj.position.x, z: obj.position.z } as ParallaxBase;
      }
      const base = obj.userData._parallaxBase as ParallaxBase;
      const wx = windowGroup.position.x;
      const wz = windowGroup.position.z;
      // Parallax offset: cityscape moves opposite to camera relative to window
      obj.position.x = base.x + (cx - wx) * -factor;
      obj.position.z = base.z + (cz - wz) * -factor;
    }
  });
}
