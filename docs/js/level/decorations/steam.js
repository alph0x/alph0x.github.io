import * as THREE from 'three';

export function buildSteam(cfg) {
  const geo = new THREE.PlaneGeometry(0.4, 0.4);
  const mat = new THREE.MeshBasicMaterial({ color: 0x8899aa, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...cfg.position);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}
