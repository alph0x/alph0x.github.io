import * as THREE from 'three';
import { makePlane, rootGroup } from '../../primitives.js';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import type { FurnitureConfig } from '../../seed.js';

function buildRug(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const rugMat = makeStd({ color: 0xb98d63, roughness: 0.95 });
  const borderMat = makeStd({ color: 0x9a6f4a, roughness: 0.95 });
  const patternMat = makeStd({ color: 0xd9b98a, roughness: 0.95 });
  g.add(makePlane(rugMat, [2.5, 1.8], [0, 0, 0]));
  // woven nested-border pattern — layer along local Z (becomes world Y after
  // the -90° X rotation; Y offsets here would just z-fight at zero)
  const border = makePlane(borderMat, [2.3, 1.6], [0, 0, 0]);
  border.position.set(0, 0, 0.001);
  g.add(border);
  const inner = makePlane(rugMat, [2.05, 1.35], [0, 0, 0]);
  inner.position.set(0, 0, 0.002);
  g.add(inner);
  const pattern = makePlane(patternMat, [1.2, 0.6], [0, 0, 0]);
  pattern.position.set(0, 0, 0.003);
  g.add(pattern);
  g.rotation.x = -Math.PI / 2;
  return { mesh: g };
}
register('rug', buildRug);
