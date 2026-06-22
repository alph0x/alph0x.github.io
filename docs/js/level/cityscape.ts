import * as THREE from 'three';
import { makeBox, makeLight } from '../primitives.js';

export function buildCityscape(cfg: { position: number[] }): THREE.Group {
  const [cx, , cz] = cfg.position as [number, number, number];
  const cityGroup = new THREE.Group();
  cityGroup.position.set(cx, 0, cz - 10);
  const bldgColors = [0x1a1a1e, 0x111114, 0x0d0d12, 0x151518, 0x1a1518];
  const winColors = [0xec4899, 0x06b6d4, 0xf59e0b, 0x7c3aed, 0x10b981, 0xffffff];
  for (let i = 0; i < 30; i++) {
    const bw = 1 + Math.random() * 3; const bh = 5 + Math.random() * 25; const bd = 1 + Math.random() * 3;
    const bx = (Math.random() - 0.5) * 50; const bz = -5 - Math.random() * 40;
    const bmesh = makeBox(new THREE.MeshBasicMaterial({ color: bldgColors[Math.floor(Math.random() * bldgColors.length)] }), [bw, bh, bd], [bx, bh / 2 - 2, bz]);
    cityGroup.add(bmesh);
    const floors = Math.floor(bh / 1.5); const winsPerFloor = Math.floor(bw / 0.8);
    for (let f = 0; f < floors; f++) for (let w = 0; w < winsPerFloor; w++) if (Math.random() > 0.6) {
      const wmesh = makeBox(new THREE.MeshBasicMaterial({ color: winColors[Math.floor(Math.random() * winColors.length)] }), [0.25, 0.35, 0.05], [bx - bw / 2 + 0.4 + w * 0.8, (f * 1.5) - 2 + 0.8, bz + bd / 2 + 0.03]);
      cityGroup.add(wmesh);
    }
  }
  for (let i = 0; i < 10; i++) {
    const sx = (Math.random() - 0.5) * 30; const sz = -8 - Math.random() * 30;
    cityGroup.add(makeBox(new THREE.MeshBasicMaterial({ color: 0x2a2a30 }), [0.08, 4, 0.08], [sx, 2, sz]));
    cityGroup.add(makeBox(new THREE.MeshBasicMaterial({ color: 0xffaa55 }), [0.3, 0.1, 0.15], [sx, 2, sz]));
  }
  for (let i = 0; i < 6; i++) {
    const car = makeBox(new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xec4899 : 0x06b6d4 }), [0.4, 0.1, 0.2], [(Math.random() - 0.5) * 40, 3 + Math.random() * 8, -10 - Math.random() * 30]);
    cityGroup.add(car);
  }
  return cityGroup;
}
