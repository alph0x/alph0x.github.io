export function updateImplants(delta, time, state) {
  state.implants.forEach((imp) => {
    if (imp.isTV) { imp.mesh.material.opacity = 0.02 + Math.random() * 0.06; return; }
    if (imp.isCar) {
      imp.mesh.position.x += Math.sin(time * 0.001 * imp.speed + imp.phase) * 0.02;
      imp.mesh.position.z += Math.cos(time * 0.001 * imp.speed + imp.phase) * 0.01;
      return;
    }
    imp.mesh.position.y = imp.baseY + Math.sin(time * 0.002 * imp.speed + imp.phase) * 0.3;
    imp.mesh.rotation.y += delta * 0.5;
    imp.mesh.rotation.z += delta * 0.3;
  });
}
