import * as THREE from 'three';
import { COLORS } from '../../core.js';
import { register } from '../registry.js';
import { makeBox, makePlane, makeLight } from '../../primitives.js';

function buildTV(cfg) {
  const g = new THREE.Group();
  g.position.set(...cfg.position);
  g.rotation.y = cfg.rotation;

  const frameMat = new THREE.MeshBasicMaterial({ color: 0x111114 });

  // Screen with static noise texture
  const c = document.createElement('canvas'); c.width = 128; c.height = 72;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, 128, 72);
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#3a2a55' : '#1a0a2a';
    ctx.fillRect(Math.random() * 128, Math.random() * 72, 2, 2);
  }
  const screenTex = new THREE.CanvasTexture(c);
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });

  // Wall-mounted TV (~48" flat panel)
  const w = 1.1, h = 0.62, d = 0.03;
  g.add(makeBox(frameMat, [w, h, d], [0, 0, 0]));
  g.add(makePlane(screenMat, [w - 0.03, h - 0.03], [0, 0, d / 2 + 0.004]));

  // Subtle wall-wash glow behind the panel
  g.add(makeLight(COLORS.accent, 0.6, 4, [0, 0, 0.25]));

  return { mesh: g, type: 'terminal', panelId: cfg.panelId, label: 'TV', room: 'APT' };
}

register('tv', buildTV);
