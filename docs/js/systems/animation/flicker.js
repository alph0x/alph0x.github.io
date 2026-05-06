export function updateFlickerLights(scene, time) {
  scene.traverse((obj) => {
    if (obj.isPointLight && obj.userData.flicker) {
      obj.intensity = obj.userData.baseIntensity + Math.sin(time * obj.userData.flickerSpeed + obj.userData.flickerPhase) * 0.3;
    }
  });
}
