import * as THREE from 'three';
import { COLORS } from '../../core.js';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, makePlane, makeRoundedBox, makeLight } from '../../primitives.js';

function buildTV(cfg) {
  const g = new THREE.Group();
  g.position.set(...cfg.position);
  g.rotation.y = cfg.rotation;

  const frameMat = makeStd({ color: 0x111114, roughness: 0.6, metalness: 0.2 });
  const bezelMat = makeStd({ color: 0x0a0a0e, roughness: 0.7 });
  const standMat = makeStd({ color: 0x1a1a1e, roughness: 0.4, metalness: 0.5 });

  // Wall-mounted TV (~48" flat panel)
  const w = 1.1, h = 0.62, d = 0.03;
  // main panel frame (rounded)
  g.add(makeRoundedBox(frameMat, [w, h, d], [0, 0, 0], 0.01, 2));
  // inner bezel
  g.add(makeBox(bezelMat, [w - 0.04, h - 0.04, 0.005], [0, 0, d / 2 + 0.003]));

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
  g.add(makePlane(screenMat, [w - 0.05, h - 0.05], [0, 0, d / 2 + 0.006]));

  // Stand (since TV may also sit on furniture)
  g.add(makeBox(standMat, [0.08, 0.25, 0.08], [0, -0.45, -0.05]));
  g.add(makeBox(standMat, [0.45, 0.02, 0.25], [0, -0.58, -0.05]));

  // Subtle wall-wash glow behind the panel
  g.add(makeLight(COLORS.accent, 0.8, 4, [0, 0, 0.25]));

  return { mesh: g, type: 'terminal', panelId: cfg.panelId, label: 'TV', room: 'APT' };
}

register('tv', buildTV);
