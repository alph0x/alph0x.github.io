export function updateParticles(delta, state) {
  state.particles.forEach((p) => {
    p.mesh.position.x += p.vx;
    p.mesh.position.y += p.vy;
    p.mesh.position.z += p.vz;
    if (p.isSteam) {
      p.life -= delta * 0.3;
      p.mesh.scale.setScalar(1 + (1 - p.life) * 2);
      p.mesh.material.opacity = p.life * 0.12;
      if (p.life <= 0 || p.mesh.position.y > 3.5) {
        p.mesh.position.set(
          (Math.random() - 0.5) * 10 + (Math.abs(p.mesh.position.x) > 5 ? Math.sign(p.mesh.position.x) * 20 : 0),
          0.2,
          (Math.random() - 0.5) * 7 + (Math.abs(p.mesh.position.z) > 3.5 ? Math.sign(p.mesh.position.z) * 20 : 0)
        );
        p.life = 1;
        p.mesh.scale.setScalar(1);
      }
    } else {
      p.life -= delta * 0.1;
      p.mesh.material.opacity = p.life * 0.6;
      if (p.life <= 0 || p.mesh.position.y > 4 || p.mesh.position.y < 0) {
        p.mesh.position.set((Math.random() - 0.5) * 60, Math.random() * 4, (Math.random() - 0.5) * 60);
        p.life = 1;
      }
    }
  });
}
