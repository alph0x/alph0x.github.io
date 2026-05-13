import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

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

  // Body (laying)
  const body = makeBox(darkGray, [0.35, 0.12, 0.18], [0, 0.06, 0]);
  body.name = 'body';
  g.add(body);

  const belly = makeBox(lightGray, [0.2, 0.08, 0.14], [0.05, 0.04, 0]);
  belly.name = 'belly';
  g.add(belly);

  // Head group — cranium + all facial features so they rotate together
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0.22, 0.12, 0);
  g.add(head);

  // Cranium
  const cranium = makeBox(darkGray, [0.14, 0.14, 0.14], [0, 0, 0]);
  cranium.name = 'cranium';
  head.add(cranium);

  // Muzzle
  const muzzle = makeBox(lightGray, [0.08, 0.06, 0.08], [0.08, -0.03, 0]);
  muzzle.name = 'muzzle';
  head.add(muzzle);

  // Beard
  const beard = makeBox(white, [0.06, 0.09, 0.08], [0.11, -0.03, 0]);
  beard.name = 'beard';
  head.add(beard);

  // Nose
  const nose = makeBox(noseMat, [0.03, 0.025, 0.03], [0.15, -0.02, 0]);
  nose.name = 'nose';
  head.add(nose);

  // Eyes
  const eyeL = makeBox(eyeMat, [0.025, 0.025, 0.018], [0.06, 0.03, 0.045]);
  eyeL.name = 'eyeL';
  head.add(eyeL);

  const eyeR = makeBox(eyeMat, [0.025, 0.025, 0.018], [0.06, 0.03, -0.045]);
  eyeR.name = 'eyeR';
  head.add(eyeR);

  // Ears
  const earL = makeBox(darkGray, [0.03, 0.1, 0.04], [-0.04, 0.12, 0.06]);
  earL.name = 'earL';
  earL.rotation.z = -0.15;
  head.add(earL);

  const earR = makeBox(darkGray, [0.03, 0.1, 0.04], [-0.04, 0.12, -0.06]);
  earR.name = 'earR';
  earR.rotation.z = -0.15;
  head.add(earR);

  // Eyebrows
  const eyebrowL = makeBox(lightGray, [0.025, 0.015, 0.03], [0.03, 0.07, 0.04]);
  eyebrowL.name = 'eyebrowL';
  head.add(eyebrowL);

  const eyebrowR = makeBox(lightGray, [0.025, 0.015, 0.03], [0.03, 0.07, -0.04]);
  eyebrowR.name = 'eyebrowR';
  head.add(eyebrowR);

  // Front legs (extended)
  g.add(makeBox(lightGray, [0.12, 0.04, 0.035], [0.28, 0.02, 0.07]));
  g.add(makeBox(lightGray, [0.12, 0.04, 0.035], [0.28, 0.02, -0.07]));

  // Back legs (tucked)
  g.add(makeBox(lightGray, [0.06, 0.04, 0.05], [-0.2, 0.02, 0.08]));
  g.add(makeBox(lightGray, [0.06, 0.04, 0.05], [-0.2, 0.02, -0.08]));

  // Tail — docked / tuquito (mini schnauzer style)
  const tail = makeBox(darkGray, [0.035, 0.025, 0.035], [-0.2, 0.08, 0]);
  tail.name = 'tail';
  tail.rotation.z = 0.2;
  g.add(tail);

  return { mesh: g };
}

register('miniSchnauzer', buildMiniSchnauzer);
