export function updatePet(time, state) {
  if (!state.pet) return;

  const pet = state.pet;
  const t = time * 0.001;

  // Breathing: gentle scale on body
  const body = pet.getObjectByName('body');
  if (body) {
    const breath = 1 + Math.sin(t * 2) * 0.015;
    body.scale.set(1, breath, 1);
  }

  // Tail wag: docked tuquito — short, fast little wiggle
  const tail = pet.getObjectByName('tail');
  if (tail) {
    tail.rotation.z = 0.2 + Math.sin(t * 7) * 0.08;
    tail.rotation.y = Math.sin(t * 5.5) * 0.06;
  }

  // Ear twitch: occasional small rotation
  const earL = pet.getObjectByName('earL');
  const earR = pet.getObjectByName('earR');
  if (earL && earR) {
    const twitch = Math.sin(t * 1.3) * 0.05;
    earL.rotation.z = -0.2 + twitch;
    earR.rotation.z = -0.2 - twitch;
  }

  // Head look: subtle turn toward player if close
  // TODO(PENDING): user reports head still looks sideways despite Math.atan2(dz,dx) fix.
  // Possible causes: (1) model forward axis is not +X, (2) need visual debug arrow,
  // (3) interpolation too slow/subtle to notice, (4) browser cache serving old code.
  const head = pet.getObjectByName('head');
  if (head && state.camera) {
    const dx = state.camera.position.x - pet.position.x;
    const dz = state.camera.position.z - pet.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 2.5) {
      const targetY = Math.atan2(dz, dx) - pet.rotation.y;
      // Smoothly interpolate head rotation
      head.rotation.y += (targetY * 0.3 - head.rotation.y) * 0.05;
    } else {
      head.rotation.y += (0 - head.rotation.y) * 0.02;
    }
  }
}
