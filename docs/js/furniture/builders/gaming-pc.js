import * as THREE from 'three';
import { COLORS } from '../../core.js';
import { register } from '../registry.js';
import { M, makeStd } from '../../assets/index.js';
import { makeBox, makeCylinder, makeLight, makeRoundedBox } from '../../primitives.js';

function buildGamingPC(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation || 0;

  const caseMat = makeStd({ color: 0x1c1c1f, roughness: 0.4, metalness: 0.3 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x111114, transparent: true, opacity: 0.35, flatShading: true, roughness: 0.2, metalness: 0.1 });
  const ventMat = makeStd({ color: 0x0a0a0c, roughness: 0.9 });

  // rounded tower case
  g.add(makeRoundedBox(caseMat, [0.55, 1.1, 0.5], [0, 0.55, 0], 0.03, 2));
  // tempered glass side panel suggestion
  g.add(makeBox(glassMat, [0.02, 0.95, 0.4], [0.28, 0.55, 0]));

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

  // feet
  for (const lx of [-0.2, 0.2]) for (const lz of [-0.2, 0.2]) g.add(makeBox(caseMat, [0.04, 0.04, 0.04], [lx, 0.02, lz]));

  // internal glow light
  const pcLight = makeLight(COLORS.accent, 0.8, 4, [0.3, 0.5, 0]);
  pcLight.userData._pcLight = true;
  pcLight.userData.baseIntensity = 0.8;
  g.add(pcLight);
  return { mesh: g };
}
register('gamingPC', buildGamingPC);
