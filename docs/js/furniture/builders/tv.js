import * as THREE from 'three';
import { COLORS } from '../../core.js';
import { register } from '../registry.js';
import { makeBox, makePlane, makeLight } from '../../primitives.js';

function buildTV(cfg) {
  const g = new THREE.Group();
  g.position.set(...cfg.position);
  g.rotation.y = cfg.rotation;

  const frameMat = new THREE.MeshBasicMaterial({ color: 0x111114 });
  const screenMat = new THREE.MeshBasicMaterial({ color: COLORS.accent });

  // Wall-mounted TV (~48" flat panel)
  const w = 1.1, h = 0.62, d = 0.03;
  g.add(makeBox(frameMat, [w, h, d], [0, 0, 0]));
  g.add(makePlane(screenMat, [w - 0.03, h - 0.03], [0, 0, d / 2 + 0.004]));

  const noiseMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, transparent: true, opacity: 0.05,
    emissive: COLORS.accent, emissiveIntensity: 0.5
  });
  const noise = makePlane(noiseMat, [w - 0.03, h - 0.03], [0, 0, d / 2 + 0.008]);
  g.add(noise);

  // Subtle wall-wash glow behind the panel
  g.add(makeLight(COLORS.accent, 0.6, 4, [0, 0, 0.25]));

  const result = { mesh: g, type: 'terminal', panelId: cfg.panelId, label: 'TV', room: 'APT' };
  return [g, result, noise];
}

register('tv', buildTV);
