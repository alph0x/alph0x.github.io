import * as THREE from 'three';
import { COLORS } from '../../core.js';
import { register } from '../registry.js';
import { M, makeStd, texMetal, texPlastic, texScreenGlow } from '../../assets/index.js';
import { makeBox, makeCylinder, makeLight, makePlane, makeRoundedBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildGamingPC(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);

  const caseMat = makeStd({ map: texPlastic, color: 0x1c1c1f, roughness: 0.4, metalness: 0.3 });
  const metalMat = makeStd({ map: texMetal, color: 0x2a2a30, roughness: 0.4, metalness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x111114, transparent: true, opacity: 0.35, flatShading: true, roughness: 0.2, metalness: 0.1 });
  const ventMat = makeStd({ map: texPlastic, color: 0x0a0a0c, roughness: 0.9 });

  // rounded tower case
  g.add(makeRoundedBox(caseMat, [0.55, 1.1, 0.5], [0, 0.55, 0], 0.03, 2));
  // tempered glass side panel suggestion
  g.add(makePlane(glassMat, [0.4, 0.95], [0.276, 0.55, 0]));
  // metal frame around glass
  g.add(makeBox(metalMat, [0.02, 0.98, 0.02], [0.276, 0.55, -0.21]));
  g.add(makeBox(metalMat, [0.02, 0.98, 0.02], [0.276, 0.55, 0.21]));
  g.add(makeBox(metalMat, [0.02, 0.02, 0.44], [0.276, 1.06, 0]));
  g.add(makeBox(metalMat, [0.02, 0.02, 0.44], [0.276, 0.04, 0]));

  // vertical RGB strip behind glass
  for (let i = 0; i < 5; i++) {
    const ledColor = i % 2 === 0 ? COLORS.accent : COLORS.cyan;
    const ledMesh = makeBox(new THREE.MeshBasicMaterial({ color: ledColor }), [0.01, 0.12, 0.35], [0.3, 0.2 + i * 0.18, 0]);
    ledMesh.userData._pcLed = true;
    g.add(ledMesh);
  }

  // top and bottom RGB accents
  const topAccent = makeBox(M.glowPurple.clone(), [0.52, 0.02, 0.01], [0, 0.15, 0.26]);
  topAccent.userData._pcLed = true;
  g.add(topAccent);
  const bottomAccent = makeBox(M.glowCyan.clone(), [0.52, 0.02, 0.01], [0, 0.95, 0.26]);
  bottomAccent.userData._pcLed = true;
  g.add(bottomAccent);

  // front vents
  for (let i = 0; i < 4; i++) {
    g.add(makeBox(ventMat, [0.35, 0.03, 0.01], [0, 0.25 + i * 0.2, 0.255]));
  }
  // side vents
  for (let i = 0; i < 4; i++) {
    g.add(makeBox(ventMat, [0.01, 0.03, 0.35], [-0.28, 0.25 + i * 0.2, 0]));
  }

  // GPU / motherboard cards visible through glass
  g.add(makeBox(metalMat, [0.35, 0.02, 0.08], [0, 0.5, 0.1]));
  g.add(makeBox(makeStd({ map: texScreenGlow, color: COLORS.accent, emissive: COLORS.accent, emissiveIntensity: 0.8 }), [0.25, 0.06, 0.02], [0, 0.55, 0.12]));

  // feet
  for (const lx of [-0.2, 0.2]) {
    for (const lz of [-0.2, 0.2]) {
      g.add(makeCylinder(caseMat, [0.02, 0.015, 0.04], [lx, 0.02, lz], 8));
    }
  }

  // internal glow light
  const pcLight = makeLight(COLORS.accent, 0.8, 4, [0.3, 0.5, 0]);
  pcLight.userData._pcLight = true;
  pcLight.userData.baseIntensity = 0.8;
  g.add(pcLight);
  return { mesh: g };
}
register('gamingPC', buildGamingPC);
