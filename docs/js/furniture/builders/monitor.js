import * as THREE from 'three';
import { COLORS } from '../../core.js';
import { register } from '../registry.js';
import { M } from '../../assets/index.js';
import { makeBox, makeLight } from '../../primitives.js';

function buildMonitor(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1f, flatShading: true, roughness: 1, metalness: 0 });

  // Screen with code-like texture
  const c = document.createElement('canvas'); c.width = 128; c.height = 80;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, 128, 80);
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 8px monospace';
  for (let i = 0; i < 8; i++) {
    ctx.fillText('>' + '01'.repeat(Math.floor(Math.random() * 8) + 2), 4, 10 + i * 10);
  }
  const screenTex = new THREE.CanvasTexture(c);
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });

  g.add(makeBox(frameMat, [1.2, 0.7, 0.04], [0, 0, 0]));
  g.add(makeBox(screenMat, [1.1, 0.6, 0.02], [0, 0, 0.03]));
  g.add(makeBox(frameMat, [0.08, 0.3, 0.08], [0, -0.5, -0.05]));
  g.add(makeBox(frameMat, [0.4, 0.02, 0.25], [0, -0.65, -0.05]));
  g.add(makeBox(M.glowPurple, [1.15, 0.02, 0.02], [0, 0.35, -0.03]));
  g.add(makeBox(M.glowPurple, [1.15, 0.02, 0.02], [0, -0.35, -0.03]));
  g.add(makeBox(M.glowPurple, [0.02, 0.65, 0.02], [0.57, 0, -0.03]));
  g.add(makeBox(M.glowPurple, [0.02, 0.65, 0.02], [-0.57, 0, -0.03]));
  g.add(makeLight(COLORS.accent, 1.2, 6, [0, 0, 0.3]));
  return { mesh: g };
}
register('monitor', buildMonitor);
