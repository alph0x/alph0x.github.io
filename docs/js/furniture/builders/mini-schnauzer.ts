import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeRoundedBox, makeCylinder, makeSphere, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildMiniSchnauzer(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const [x, y, z] = cfg.position;
  const g = rootGroup(cfg);
  const s = 1.6;
  g.scale.set(s, s, s);

  // Salt-and-pepper: slate back, silver furnishings (muzzle, chest, legs).
  // No texture map — texFabric's dark warm base muddies the coat contrast.
  const coatDark = makeStd({ color: 0x484850, roughness: 0.95 });
  const silver = makeStd({ color: 0xb9b9c2, roughness: 0.95 });
  const white = makeStd({ color: 0xccccd4, roughness: 0.95 });
  const noseMat = makeStd({ color: 0x1a1a1e, roughness: 0.4 });
  const eyeMat = makeStd({ color: 0x0a0a0e, roughness: 0.2 });
  const collarMat = makeStd({ color: 0xcc3333, roughness: 0.6 });

  // Body — stocky rounded torso
  const body = makeRoundedBox(coatDark, [0.42, 0.16, 0.24], [0, 0.08, 0], 0.06, 3);
  body.name = 'body';
  g.add(body);

  // Silver chest/belly patch — kept clear of the beard mass
  const belly = makeRoundedBox(silver, [0.26, 0.10, 0.20], [0.0, 0.045, 0], 0.04, 2);
  belly.name = 'belly';
  g.add(belly);

  // Collar
  g.add(makeCylinder(collarMat, [0.075, 0.075, 0.02], [0.17, 0.14, 0], 12));
  g.add(makeSphere(collarMat, [0.015], [0.18, 0.12, 0.03], 8)); // tag

  // Head group — cranium + facial features rotate together
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0.24, 0.16, 0);
  g.add(head);

  // Cranium — rectangular schnauzer skull (longer than tall)
  const cranium = makeRoundedBox(coatDark, [0.17, 0.14, 0.14], [0, 0, 0], 0.05, 3);
  cranium.name = 'cranium';
  head.add(cranium);

  // Muzzle — rectangular silver snout, protrudes past the beard
  const muzzle = makeRoundedBox(silver, [0.14, 0.09, 0.10], [0.11, -0.02, 0], 0.03, 2);
  muzzle.name = 'muzzle';
  head.add(muzzle);

  // Beard — the breed marker: mustache tier + a block hanging below the jaw
  const mustache = makeRoundedBox(white, [0.09, 0.045, 0.08], [0.13, -0.06, 0], 0.02, 2);
  mustache.name = 'mustache';
  head.add(mustache);
  const beard = makeRoundedBox(white, [0.07, 0.085, 0.07], [0.15, -0.10, 0], 0.025, 2);
  beard.name = 'beard';
  head.add(beard);

  // Nose
  const nose = makeSphere(noseMat, [0.026], [0.19, -0.01, 0], 10);
  nose.name = 'nose';
  head.add(nose);

  // Eyes — deep-set under the brows
  const eyeL = makeSphere(eyeMat, [0.02], [0.065, 0.04, 0.052], 10);
  eyeL.name = 'eyeL';
  head.add(eyeL);

  const eyeR = makeSphere(eyeMat, [0.02], [0.065, 0.04, -0.052], 10);
  eyeR.name = 'eyeR';
  head.add(eyeR);

  // Bushy eyebrows — light, overhanging the eyes (not sitting on the skull top)
  const eyebrowL = makeRoundedBox(white, [0.05, 0.02, 0.04], [0.055, 0.058, 0.048], 0.008, 2);
  eyebrowL.name = 'eyebrowL';
  eyebrowL.rotation.x = -0.3;
  head.add(eyebrowL);
  const eyebrowR = makeRoundedBox(white, [0.05, 0.02, 0.04], [0.055, 0.058, -0.048], 0.008, 2);
  eyebrowR.name = 'eyebrowR';
  eyebrowR.rotation.x = 0.3;
  head.add(eyebrowR);

  // Ears — folded V flaps hanging against the head sides (NOT upright cones).
  // pet-renderer drives rotation.z absolutely ([-0.35, 0]); the fold is baked
  // into the geometry and the splay lives in rotation.x, which it preserves.
  const earL = makeRoundedBox(coatDark, [0.028, 0.08, 0.055], [-0.04, 0.01, 0.09], 0.012, 2);
  earL.name = 'earL';
  earL.geometry.rotateZ(-0.35); // forward fold
  earL.rotation.x = -0.18;
  head.add(earL);

  const earR = makeRoundedBox(coatDark, [0.028, 0.08, 0.055], [-0.04, 0.01, -0.09], 0.012, 2);
  earR.name = 'earR';
  earR.geometry.rotateZ(-0.35); // forward fold
  earR.rotation.x = 0.18;
  head.add(earR);

  // Front legs — extended forward (sphinx), silver furnishings
  const legFL = makeCylinder(silver, [0.026, 0.02, 0.15], [0.30, 0.02, 0.08], 8);
  legFL.rotation.x = Math.PI / 2;
  g.add(legFL);

  const legFR = makeCylinder(silver, [0.026, 0.02, 0.15], [0.30, 0.02, -0.08], 8);
  legFR.rotation.x = Math.PI / 2;
  g.add(legFR);

  // Front paws
  g.add(makeRoundedBox(silver, [0.04, 0.025, 0.045], [0.38, 0.012, 0.08], 0.01, 2));
  g.add(makeRoundedBox(silver, [0.04, 0.025, 0.045], [0.38, 0.012, -0.08], 0.01, 2));

  // Back legs — tucked haunches, stocky
  const legBL = makeCylinder(silver, [0.032, 0.026, 0.10], [-0.22, 0.02, 0.10], 8);
  legBL.rotation.z = -0.35;
  g.add(legBL);

  const legBR = makeCylinder(silver, [0.032, 0.026, 0.10], [-0.22, 0.02, -0.10], 8);
  legBR.rotation.z = -0.35;
  g.add(legBR);

  // Back paws
  g.add(makeRoundedBox(silver, [0.045, 0.025, 0.05], [-0.25, 0.012, 0.10], 0.01, 2));
  g.add(makeRoundedBox(silver, [0.045, 0.025, 0.05], [-0.25, 0.012, -0.10], 0.01, 2));

  // Tail — short docked nub
  const tail = makeCylinder(coatDark, [0.02, 0.014, 0.07], [-0.22, 0.10, 0], 6);
  tail.name = 'tail';
  tail.rotation.z = 0.2;
  g.add(tail);
  g.add(makeSphere(coatDark, [0.016], [-0.22, 0.135, 0], 6)); // tail tip

  return { mesh: g, label: 'Lulú' };
}

register('miniSchnauzer', buildMiniSchnauzer);
