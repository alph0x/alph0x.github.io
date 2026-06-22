/**
 * @fileoverview Parallax effect for window cityscapes.
 * Cityscapes move slightly opposite to camera movement to create depth.
 * Supports nested parallax groups so each depth layer can have its own speed.
 */

export function updateParallax(scene, camera) {
  if (!camera) return;
  const cx = camera.position.x;
  const cz = camera.position.z;

  scene.traverse((obj) => {
    if (obj.userData._parallax) {
      const factor = obj.userData._parallaxFactor || 0.03;
      // Find the reference window group by walking up past nested parallax groups.
      let windowGroup = obj.parent;
      while (windowGroup && windowGroup.userData && windowGroup.userData._parallax) {
        windowGroup = windowGroup.parent;
      }
      if (windowGroup) {
        // Capture the static base position on first sight so nested layers keep their offsets.
        if (!obj.userData._parallaxBase) {
          obj.userData._parallaxBase = { x: obj.position.x, z: obj.position.z };
        }
        const base = obj.userData._parallaxBase;
        const wx = windowGroup.position.x;
        const wz = windowGroup.position.z;
        // Parallax offset: cityscape moves opposite to camera relative to window
        obj.position.x = base.x + (cx - wx) * -factor;
        obj.position.z = base.z + (cz - wz) * -factor;
      }
    }
  });
}
