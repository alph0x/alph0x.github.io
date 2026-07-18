import * as THREE from 'three';
import { COLORS } from '../../core.js';
import { register } from '../registry.js';
import { makeStd, texMetal, texPlastic, texScreenGlow } from '../../assets/index.js';
import { makeBox, makeCylinder, makeLight, makePlane, makeRoundedBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildTV(cfg: FurnitureConfig): { mesh: THREE.Group; type: string; panelId?: string; label: string; room: string } {
  const g = rootGroup(cfg);

  const frameMat = makeStd({ map: texPlastic, color: 0x111114, roughness: 0.6, metalness: 0.1 });
  const bezelMat = makeStd({ color: 0x0a0a0e, roughness: 0.7 });
  const standMat = makeStd({ map: texMetal, color: 0x1a1a1e, roughness: 0.4, metalness: 0.5 });

  // Wall-mounted TV (~48" flat panel)
  const w = 1.1, h = 0.62, d = 0.03;
  // main panel frame (rounded)
  g.add(makeRoundedBox(frameMat, [w, h, d], [0, 0, 0], 0.01, 2));
  // inner bezel
  g.add(makeBox(bezelMat, [w - 0.04, h - 0.04, 0.005], [0, 0, d / 2 + 0.003]));

  // Deterministic screen glow
  const screenMat = new THREE.MeshBasicMaterial({ map: texScreenGlow });
  g.add(makePlane(screenMat, [w - 0.05, h - 0.05], [0, 0, d / 2 + 0.006]));

  // Metal stand (also supports furniture placement)
  g.add(makeCylinder(standMat, [0.03, 0.025, 0.25], [0, -0.45, -0.05], 8));
  g.add(makeRoundedBox(standMat, [0.45, 0.02, 0.25], [0, -0.58, -0.05], 0.01, 2));

  // Subtle wall-wash glow behind the panel
  g.add(makeLight(COLORS.accent, 0.8, 4, [0, 0, 0.25]));

  return { mesh: g, type: 'terminal', panelId: cfg.panelId, label: 'TV', room: 'APT' };
}

register('tv', buildTV);
