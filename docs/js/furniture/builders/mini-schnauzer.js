import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeRoundedBox, makeCylinder, makeSphere, makeCone } from '../../primitives.js';

export function buildMiniSchnauzer(cfg) {
  const g = new THREE.Group();
  g.position.set(...cfg.position);
  g.rotation.y = cfg.rotation || 0;
  const s = 1.6;
  g.scale.set(s, s, s);

  const darkGray = makeStd({ color: 0x6a6a75 });
  const lightGray = makeStd({ color: 0xcacad5 });
  const white = makeStd({ color: 0xe4e4e8 });
  const noseMat = makeStd({ color: 0x1a1a1e });
  const eyeMat = makeStd({ color: 0x0a0a0e });

  // Body (laying) — rounded torso
  const body = makeRoundedBox(darkGray, [0.38, 0.13, 0.20], [0, 0.065, 0], 0.05, 2);
  body.name = 'body';
  g.add(body);

  const belly = makeRoundedBox(white, [0.24, 0.09, 0.16], [0.05, 0.045, 0], 0.04, 2);
  belly.name = 'belly';
  g.add(belly);

  // Head group — cranium + all facial features so they rotate together
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0.22, 0.12, 0);
  g.add(head);

  // Cranium
  const cranium = makeRoundedBox(darkGray, [0.15, 0.15, 0.15], [0, 0, 0], 0.06, 2);
  cranium.name = 'cranium';
  head.add(cranium);

  // Muzzle
  const muzzle = makeRoundedBox(lightGray, [0.10, 0.07, 0.09], [0.08, -0.03, 0], 0.03, 2);
  muzzle.name = 'muzzle';
  head.add(muzzle);

  // Beard
  const beard = makeRoundedBox(white, [0.08, 0.10, 0.09], [0.12, -0.04, 0], 0.03, 2);
  beard.name = 'beard';
  head.add(beard);

  // Nose
  const nose = makeSphere(noseMat, [0.022], [0.16, -0.02, 0], 8);
  nose.name = 'nose';
  head.add(nose);

  // Eyes
  const eyeL = makeSphere(eyeMat, [0.018], [0.06, 0.03, 0.045], 8);
  eyeL.name = 'eyeL';
  head.add(eyeL);

  const eyeR = makeSphere(eyeMat, [0.018], [0.06, 0.03, -0.045], 8);
  eyeR.name = 'eyeR';
  head.add(eyeR);

  // Ears — flattened cones
  const earL = makeCone(darkGray, [0.05, 0.12], [-0.04, 0.14, 0.06], 6);
  earL.name = 'earL';
  earL.rotation.z = -0.15;
  earL.scale.z = 0.35;
  head.add(earL);

  const earR = makeCone(darkGray, [0.05, 0.12], [-0.04, 0.14, -0.06], 6);
  earR.name = 'earR';
  earR.rotation.z = -0.15;
  earR.scale.z = 0.35;
  head.add(earR);

  // Eyebrows
  const eyebrowL = makeRoundedBox(lightGray, [0.028, 0.018, 0.032], [0.03, 0.07, 0.04], 0.01, 1);
  eyebrowL.name = 'eyebrowL';
  head.add(eyebrowL);

  const eyebrowR = makeRoundedBox(lightGray, [0.028, 0.018, 0.032], [0.03, 0.07, -0.04], 0.01, 1);
  eyebrowR.name = 'eyebrowR';
  head.add(eyebrowR);

  // Front legs (extended)
  const legFL = makeCylinder(lightGray, [0.020, 0.016, 0.13], [0.28, 0.02, 0.07], 8);
  legFL.rotation.x = Math.PI / 2;
  g.add(legFL);

  const legFR = makeCylinder(lightGray, [0.020, 0.016, 0.13], [0.28, 0.02, -0.07], 8);
  legFR.rotation.x = Math.PI / 2;
  g.add(legFR);

  // Back legs (tucked)
  const legBL = makeCylinder(lightGray, [0.026, 0.020, 0.07], [-0.2, 0.02, 0.08], 8);
  legBL.rotation.z = -0.3;
  g.add(legBL);

  const legBR = makeCylinder(lightGray, [0.026, 0.020, 0.07], [-0.2, 0.02, -0.08], 8);
  legBR.rotation.z = -0.3;
  g.add(legBR);

  // Tail — docked / tuquito (mini schnauzer style)
  const tail = makeCylinder(darkGray, [0.018, 0.012, 0.07], [-0.2, 0.08, 0], 6);
  tail.name = 'tail';
  tail.rotation.z = 0.2;
  g.add(tail);

  return { mesh: g };
}

register('miniSchnauzer', buildMiniSchnauzer);
