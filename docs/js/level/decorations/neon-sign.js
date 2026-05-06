import * as THREE from 'three';

export function buildNeonSign(cfg) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const ctx = c.getContext('2d'); ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 256, 64);
  ctx.font = 'bold 32px "Orbitron", monospace'; ctx.fillStyle = '#' + cfg.color.toString(16).padStart(6, '0');
  ctx.textAlign = 'center'; ctx.fillText(cfg.text, 128, 46);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, opacity: 0.9, side: THREE.DoubleSide,
    emissive: cfg.color, emissiveIntensity: 1.5, roughness: 0.4, metalness: 0.0
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.5), mat); mesh.position.set(...cfg.position);
  return mesh;
}
