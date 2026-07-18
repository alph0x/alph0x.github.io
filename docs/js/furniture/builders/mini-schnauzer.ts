import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd, texFabric } from '../../assets/index.js';
import { makeRoundedBox, makeCylinder, makeSphere, makeCone, makeBox } from '../../primitives.js';
import { loadGlb } from '../../assets/loader.js';
import type { FurnitureConfig } from '../../seed.js';

function buildMiniSchnauzer(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const [x, y, z] = cfg.position;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = cfg.rotation ?? 0;
  const s = 1.6;
  g.scale.set(s, s, s);

  const coatDark = makeStd({ map: texFabric, color: 0x6a6a75, roughness: 0.95 });
  const coatLight = makeStd({ map: texFabric, color: 0xcacad5, roughness: 0.95 });
  const white = makeStd({ map: texFabric, color: 0xe4e4e8, roughness: 0.95 });
  const noseMat = makeStd({ color: 0x1a1a1e, roughness: 0.4 });
  const eyeMat = makeStd({ color: 0x0a0a0e, roughness: 0.2 });
  const collarMat = makeStd({ color: 0xcc3333, roughness: 0.6 });

  // Body — elongated rounded torso
  const body = makeRoundedBox(coatDark, [0.42, 0.14, 0.22], [0, 0.07, 0], 0.06, 3);
  body.name = 'body';
  g.add(body);

  // White belly/chest patch
  const belly = makeRoundedBox(white, [0.28, 0.10, 0.18], [0.04, 0.05, 0], 0.04, 2);
  belly.name = 'belly';
  g.add(belly);

  // Collar
  g.add(makeCylinder(collarMat, [0.075, 0.075, 0.02], [0.17, 0.13, 0], 12));
  g.add(makeSphere(collarMat, [0.015], [0.18, 0.11, 0.03], 8)); // tag

  // Head group — cranium + facial features rotate together
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0.24, 0.15, 0);
  g.add(head);

  // Cranium — slightly wider at brows
  const cranium = makeRoundedBox(coatDark, [0.16, 0.16, 0.16], [0, 0, 0], 0.06, 3);
  cranium.name = 'cranium';
  head.add(cranium);

  // Muzzle — rectangular schnauzer snout
  const muzzle = makeRoundedBox(coatLight, [0.12, 0.08, 0.10], [0.09, -0.03, 0], 0.035, 2);
  muzzle.name = 'muzzle';
  head.add(muzzle);

  // Bushy beard / mustache
  const beard = makeRoundedBox(white, [0.10, 0.12, 0.11], [0.14, -0.06, 0], 0.04, 2);
  beard.name = 'beard';
  head.add(beard);

  // Nose
  const nose = makeSphere(noseMat, [0.024], [0.18, -0.01, 0], 10);
  nose.name = 'nose';
  head.add(nose);

  // Eyes
  const eyeL = makeSphere(eyeMat, [0.02], [0.06, 0.035, 0.05], 10);
  eyeL.name = 'eyeL';
  head.add(eyeL);

  const eyeR = makeSphere(eyeMat, [0.02], [0.06, 0.035, -0.05], 10);
  eyeR.name = 'eyeR';
  head.add(eyeR);

  // Eyebrow tufts
  const eyebrowL = makeRoundedBox(coatLight, [0.032, 0.02, 0.035], [0.03, 0.075, 0.045], 0.008, 2);
  eyebrowL.name = 'eyebrowL';
  head.add(eyebrowL);
  const eyebrowR = makeRoundedBox(coatLight, [0.032, 0.02, 0.035], [0.03, 0.075, -0.045], 0.008, 2);
  eyebrowR.name = 'eyebrowR';
  head.add(eyebrowR);

  // Ears — triangular folded schnauzer ears
  const earL = makeCone(coatDark, [0.05, 0.14], [-0.04, 0.15, 0.065], 8);
  earL.name = 'earL';
  earL.rotation.z = -0.25;
  earL.rotation.x = -0.15;
  earL.scale.z = 0.25;
  head.add(earL);

  const earR = makeCone(coatDark, [0.05, 0.14], [-0.04, 0.15, -0.065], 8);
  earR.name = 'earR';
  earR.rotation.z = -0.25;
  earR.rotation.x = 0.15;
  earR.scale.z = 0.25;
  head.add(earR);

  // Front legs — extended forward, tapered
  const legFL = makeCylinder(coatLight, [0.022, 0.016, 0.14], [0.30, 0.02, 0.07], 8);
  legFL.rotation.x = Math.PI / 2;
  g.add(legFL);

  const legFR = makeCylinder(coatLight, [0.022, 0.016, 0.14], [0.30, 0.02, -0.07], 8);
  legFR.rotation.x = Math.PI / 2;
  g.add(legFR);

  // Front paws
  g.add(makeRoundedBox(coatLight, [0.035, 0.02, 0.04], [0.37, 0.01, 0.07], 0.01, 2));
  g.add(makeRoundedBox(coatLight, [0.035, 0.02, 0.04], [0.37, 0.01, -0.07], 0.01, 2));

  // Back legs — tucked haunches
  const legBL = makeCylinder(coatLight, [0.028, 0.022, 0.09], [-0.22, 0.02, 0.09], 8);
  legBL.rotation.z = -0.35;
  g.add(legBL);

  const legBR = makeCylinder(coatLight, [0.028, 0.022, 0.09], [-0.22, 0.02, -0.09], 8);
  legBR.rotation.z = -0.35;
  g.add(legBR);

  // Back paws
  g.add(makeRoundedBox(coatLight, [0.04, 0.02, 0.045], [-0.25, 0.01, 0.09], 0.01, 2));
  g.add(makeRoundedBox(coatLight, [0.04, 0.02, 0.045], [-0.25, 0.01, -0.09], 0.01, 2));

  // Tail — short docked tuft
  const tail = makeCylinder(coatDark, [0.02, 0.012, 0.08], [-0.22, 0.09, 0], 6);
  tail.name = 'tail';
  tail.rotation.z = 0.2;
  g.add(tail);
  g.add(makeSphere(coatDark, [0.018], [-0.22, 0.13, 0], 6)); // tail tip

  return { mesh: g, label: 'Lulú' };
}

export async function loadMiniSchnauzer(cfg: FurnitureConfig): Promise<{ mesh: THREE.Group; label: string }> {
  const group = await loadGlb('/assets/models/lulu.glb');
  const [x, y, z] = cfg.position;
  group.position.set(x, y, z);
  group.rotation.y = cfg.rotation ?? 0;
  // Scale to match existing procedural Lulú (~0.25m shoulder, ~0.5m long).
  const s = 0.25;
  group.scale.set(s, s, s);

  // Map animation-critical names by searching the scene graph.
  group.name = 'lulu';
  group.traverse((child) => {
    const name = child.name.toLowerCase();
    if (name.includes('body') || name.includes('torso')) child.name = 'body';
    if (name.includes('head') || name.includes('cranium')) child.name = 'head';
    if (name.includes('tail')) child.name = 'tail';
    if (name.includes('ear') || name.includes('earl')) child.name = 'earL';
    if (name.includes('ear') || name.includes('earr')) child.name = 'earR';
  });

  return { mesh: group, label: 'Lulú' };
}

register('miniSchnauzer', buildMiniSchnauzer);
