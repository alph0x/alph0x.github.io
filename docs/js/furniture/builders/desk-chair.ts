import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, makeRoundedBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildDeskChair(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const frameMat = makeStd({ color: 0x6b5a48, roughness: 0.6 });
  const seatMat = makeStd({ color: 0x9a7256, roughness: 0.9 });
  g.add(makeBox(frameMat, [0.06, 0.5, 0.06], [0, 0.25, 0]));
  // Star base with wheels
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const wx = Math.cos(angle) * 0.18;
    const wz = Math.sin(angle) * 0.18;
    const spoke = makeBox(frameMat, [0.03, 0.03, 0.18], [wx / 2, 0.02, wz / 2]);
    spoke.rotation.y = -angle;
    g.add(spoke);
    g.add(makeBox(frameMat, [0.04, 0.04, 0.04], [wx, 0.02, wz]));
  }
  g.add(makeRoundedBox(seatMat, [0.42, 0.07, 0.4], [0, 0.55, 0], 0.03, 2));
  const back = makeRoundedBox(seatMat, [0.38, 0.38, 0.05], [0, 0.78, -0.18], 0.03, 2);
  back.rotation.x = -0.08;
  g.add(back);
  // Armrests
  for (const lx of [-0.24, 0.24]) {
    g.add(makeBox(frameMat, [0.03, 0.2, 0.03], [lx, 0.7, 0]));
    g.add(makeRoundedBox(seatMat, [0.04, 0.03, 0.2], [lx, 0.81, 0.05], 0.012, 2));
  }
  return { mesh: g };
}
register('deskChair', buildDeskChair);
