import * as THREE from 'three';

export function buildPoster(cfg) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 90;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#111114'; ctx.fillRect(0, 0, 64, 90);
  ctx.strokeStyle = '#' + cfg.color.toString(16).padStart(6, '0'); ctx.lineWidth = 2; ctx.strokeRect(2, 2, 60, 86);
  ctx.fillStyle = '#' + cfg.color.toString(16).padStart(6, '0'); ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
  cfg.text.split('\n').forEach((line, i) => ctx.fillText(line, 32, 20 + i * 14));
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), mat);
}
