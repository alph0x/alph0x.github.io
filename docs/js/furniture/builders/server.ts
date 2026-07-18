import * as THREE from 'three';
import { COLORS } from '../../core.js';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildServer(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const caseMat = makeStd({ color: 0x2a2a30 });
  g.add(makeBox(caseMat, [0.4, 0.8, 0.4], [0, 0.4, 0]));
  for (let i = 0; i < 6; i++) {
    const ledColor = Math.random() > 0.5 ? COLORS.green : COLORS.cyan;
    g.add(makeBox(new THREE.MeshBasicMaterial({ color: ledColor }), [0.3, 0.02, 0.01], [0, 0.15 + i * 0.12, 0.21]));
  }
  g.add(makeBox(makeStd({ color: 0x3a3a45 }), [0.42, 0.04, 0.42], [0, 0.84, 0]));
  return { mesh: g };
}
register('server', buildServer);
