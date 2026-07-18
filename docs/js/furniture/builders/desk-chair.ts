import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildDeskChair(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const frameMat = makeStd({ color: 0x3a3a45 });
  const seatMat = makeStd({ color: 0x4a3a3a });
  g.add(makeBox(frameMat, [0.06, 0.5, 0.06], [0, 0.25, 0]));
  // Star base with wheels
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const wx = Math.cos(angle) * 0.18;
    const wz = Math.sin(angle) * 0.18;
    g.add(makeBox(frameMat, [0.03, 0.03, 0.18], [wx / 2, 0.02, wz / 2]));
    g.add(makeBox(frameMat, [0.04, 0.04, 0.04], [wx, 0.02, wz]));
  }
  g.add(makeBox(seatMat, [0.42, 0.06, 0.4], [0, 0.55, 0]));
  g.add(makeBox(seatMat, [0.38, 0.35, 0.04], [0, 0.75, -0.18]));
  // Armrests
  for (const lx of [-0.24, 0.24]) {
    g.add(makeBox(frameMat, [0.03, 0.2, 0.03], [lx, 0.7, 0]));
    g.add(makeBox(seatMat, [0.03, 0.02, 0.2], [lx, 0.8, 0.05]));
  }
  return { mesh: g };
}
register('deskChair', buildDeskChair);
