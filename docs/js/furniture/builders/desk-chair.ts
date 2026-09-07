import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeCylinder, makeRoundedBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildDeskChair(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const frameMat = makeStd({ color: 0x6b5a48, roughness: 0.6 });
  const seatMat = makeStd({ color: 0x9a7256, roughness: 0.9 });
  frameMat.flatShading = seatMat.flatShading = false;
  const wheelMat = makeStd({ color: 0x403b35, roughness: 0.8 });
  wheelMat.flatShading = false;
  g.add(makeCylinder(frameMat, [0.03, 0.04, 0.48], [0, 0.28, 0], 16));
  g.add(makeCylinder(frameMat, [0.06, 0.065, 0.045], [0, 0.045, 0], 16));
  // Star base with wheels
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const wx = Math.cos(angle) * 0.18;
    const wz = Math.sin(angle) * 0.18;
    const spoke = makeRoundedBox(frameMat, [0.03, 0.03, 0.18], [wx / 2, 0.045, wz / 2], 0.009, 2);
    spoke.name = `chair-spoke-${i}`;
    spoke.rotation.y = Math.PI / 2 - angle;
    g.add(spoke);
    const wheel = makeCylinder(wheelMat, [0.02, 0.02, 0.03], [wx, 0.02, wz], 16);
    wheel.name = `chair-caster-${i}`;
    wheel.rotation.z = Math.PI / 2;
    wheel.rotation.y = -angle;
    g.add(wheel);
  }
  g.add(makeRoundedBox(seatMat, [0.42, 0.07, 0.4], [0, 0.55, 0], 0.03, 3));
  const back = makeRoundedBox(seatMat, [0.38, 0.38, 0.05], [0, 0.78, -0.18], 0.024, 3);
  back.rotation.x = -0.08;
  g.add(back);
  // Back support continues beneath the cushion instead of floating behind it.
  g.add(makeRoundedBox(frameMat, [0.07, 0.29, 0.025], [0, 0.655, -0.185], 0.01, 2));
  // Armrests
  for (const lx of [-0.24, 0.24]) {
    g.add(makeRoundedBox(frameMat, [0.03, 0.24, 0.03], [lx, 0.68, 0], 0.01, 2));
    g.add(makeRoundedBox(frameMat, [0.09, 0.03, 0.03], [Math.sign(lx) * 0.205, 0.565, 0], 0.009, 2));
    g.add(makeRoundedBox(seatMat, [0.04, 0.03, 0.2], [lx, 0.81, 0.05], 0.012, 2));
  }
  return { mesh: g };
}
register('deskChair', buildDeskChair);
