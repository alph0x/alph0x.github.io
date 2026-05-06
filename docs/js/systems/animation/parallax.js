/**
 * @fileoverview Parallax effect for window cityscapes.
 * Cityscapes move slightly opposite to camera movement to create depth.
 */

export function updateParallax(scene, camera) {
  if (!camera) return;
  const cx = camera.position.x;
  const cz = camera.position.z;

  scene.traverse((obj) => {
    if (obj.userData._parallax) {
      const factor = obj.userData._parallaxFactor || 0.03;
      // Get the parent window group position (world)
      const windowGroup = obj.parent;
      if (windowGroup) {
        const wx = windowGroup.position.x;
        const wz = windowGroup.position.z;
        // Parallax offset: cityscape moves opposite to camera relative to window
        obj.position.x = (cx - wx) * -factor;
        obj.position.z = -8 + (cz - wz) * -factor;
      }
    }
  });
}
