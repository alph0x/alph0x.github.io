import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeRoundedBox, makeCylinder, makeSphere, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

/**
 * Lulú — salt-and-pepper miniature schnauzer lying on the bed, facing +Z.
 *
 * Breed markers (what makes a schnauzer read as a schnauzer, not a generic
 * dog): big folded V ears, a wide rectangular silver muzzle wrapped in a
 * full cream beard with flared mustache, heavy bushy eyebrows shading the
 * eyes, a lighter topknot between the ears, fluffy pale leg furnishings,
 * and a docked tail nub. Contrast does the rest: charcoal saddle over a
 * warm grey body against off-white furnishings.
 *
 * Orientation contract with pet-renderer:
 * - 'head' faces +Z, so the sleep pose (rotation.x = -0.45) lowers the
 *   muzzle onto the front paws instead of rolling the head sideways.
 * - 'body' is a floor-anchored group; breathing scales y about the ground.
 * - 'earL'/'earR' pivots sit at the ear base; the renderer drives
 *   rotation.z absolutely, so the fold/splay is baked into child offsets.
 * - 'tail' pivot at the rump; the renderer wags rotation.z / rotation.y.
 */
function buildMiniSchnauzer(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const g = rootGroup(cfg);

  const coat = makeStd({ color: 0x5b554e, roughness: 0.95 }); // warm pepper grey
  const coatLight = makeStd({ color: 0x857d72, roughness: 0.95 }); // topknot
  const coatDark = makeStd({ color: 0x3c3733, roughness: 0.95 }); // charcoal saddle + ears
  const silver = makeStd({ color: 0xcfc7b6, roughness: 0.95 }); // leg furnishings + muzzle
  const cream = makeStd({ color: 0xf0e9d8, roughness: 0.95 }); // beard + brows
  const noseMat = makeStd({ color: 0x1d1a17, roughness: 0.35 });
  const eyeMat = makeStd({ color: 0x14110f, roughness: 0.12 });
  const glintMat = makeStd({ color: 0xfffaf0, roughness: 0.1 });
  const collarMat = makeStd({ color: 0xc0553a, roughness: 0.55 });
  const tagMat = makeStd({ color: 0xe9c46a, roughness: 0.35, metalness: 0.5 });

  const ball = (mat: THREE.Material, r: number, scale: [number, number, number], pos: [number, number, number]): THREE.Mesh => {
    const m = makeSphere(mat, [r], pos, 14);
    m.scale.set(...scale);
    return m;
  };

  // ── Body (breathing group, origin at floor) ──────────────────────
  const body = new THREE.Group();
  body.name = 'body';
  g.add(body);

  // torso + charcoal saddle over the back (salt-and-pepper two-tone)
  body.add(ball(coat, 0.1, [1.05, 0.85, 1.6], [0, 0.085, -0.04]));
  body.add(ball(coatDark, 0.1, [0.88, 0.6, 1.3], [0, 0.128, -0.06]));
  // haunches + silver chest
  body.add(ball(coat, 0.1, [1.12, 0.8, 1.05], [0, 0.078, -0.185]));
  body.add(ball(silver, 0.1, [0.92, 0.78, 0.9], [0, 0.08, 0.095]));
  // pale belly peeking underneath
  body.add(ball(silver, 0.1, [0.78, 0.5, 1.05], [0, 0.042, -0.03]));

  // ── Front legs stretched forward: slim leg, fluffy furnishing, paw ──
  for (const side of [-1, 1]) {
    const leg = makeCylinder(silver, [0.018, 0.021, 0.13], [side * 0.054, 0.024, 0.175], 10);
    leg.rotation.x = Math.PI / 2;
    g.add(leg);
    // longer pale leg hair (furnishings) + rounded paw at the end
    g.add(ball(silver, 0.037, [1, 0.85, 1.35], [side * 0.054, 0.033, 0.198]));
    g.add(ball(cream, 0.03, [1.15, 0.62, 1.3], [side * 0.054, 0.02, 0.258]));
  }

  // ── Hind legs folded against the haunches, fluffy rear furnishings ──
  for (const side of [-1, 1]) {
    g.add(makeRoundedBox(silver, [0.048, 0.05, 0.13], [side * 0.095, 0.028, -0.155], 0.018, 2));
    g.add(ball(silver, 0.037, [1, 0.78, 1.3], [side * 0.095, 0.028, -0.11]));
    g.add(ball(cream, 0.028, [1, 0.6, 1.25], [side * 0.095, 0.016, -0.052]));
  }

  // ── Small cream bib blending the head into the chest ─────────────
  g.add(ball(cream, 0.05, [0.95, 0.7, 0.85], [0, 0.115, 0.115]));

  // ── Slim collar with a flat tag, tucked into the chest fur ───────
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.007, 8, 20), collarMat);
  collar.position.set(0, 0.142, 0.126);
  collar.rotation.x = Math.PI / 2 - 0.25;
  collar.castShadow = true;
  g.add(collar);
  const tag = makeCylinder(tagMat, [0.009, 0.009, 0.004], [0, 0.108, 0.155], 10);
  tag.rotation.x = Math.PI / 2 - 0.25;
  g.add(tag);

  // ── Head (pivot at the neck; muzzle points +Z) ───────────────────
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 0.185, 0.15);
  g.add(head);

  head.add(ball(coat, 0.068, [0.95, 0.92, 1.0], [0, 0.015, 0.006]));
  // muted topknot between the ears — classic schnauzer crown
  head.add(ball(coatLight, 0.045, [0.75, 0.45, 0.9], [0, 0.056, 0.005]));

  // compact rectangular silver muzzle — longer than tall
  const muzzle = makeRoundedBox(silver, [0.066, 0.046, 0.08], [0, -0.008, 0.074], 0.014, 2);
  muzzle.name = 'muzzle';
  head.add(muzzle);

  // full cream beard: a block hanging below the jaw with flared
  // mustache tufts at the sides — the "old man" face of the breed
  const beard = makeRoundedBox(cream, [0.08, 0.058, 0.064], [0, -0.058, 0.066], 0.016, 2);
  beard.name = 'beard';
  head.add(beard);
  for (const side of [-1, 1]) {
    const stache = ball(cream, 0.02, [1.4, 0.7, 1.15], [side * 0.042, -0.024, 0.08]);
    stache.rotation.z = side * 0.35; // flare outward
    head.add(stache);
  }

  const nose = ball(noseMat, 0.012, [1, 0.8, 0.7], [0, 0.0, 0.114]);
  nose.name = 'nose';
  head.add(nose);

  // deep-set eyes under heavy bushy brows pushed forward over them
  for (const side of [-1, 1]) {
    const eye = makeSphere(eyeMat, [0.0115], [side * 0.03, 0.028, 0.058], 10);
    eye.name = side < 0 ? 'eyeL' : 'eyeR';
    head.add(eye);
    head.add(ball(glintMat, 0.0035, [1, 1, 1], [side * 0.0265, 0.032, 0.066]));
    const brow = makeRoundedBox(cream, [0.052, 0.02, 0.05], [side * 0.03, 0.05, 0.068], 0.007, 2);
    brow.name = side < 0 ? 'eyebrowL' : 'eyebrowR';
    brow.rotation.x = -0.35;
    brow.rotation.z = side * -0.18;
    head.add(brow);
  }

  // folded V ears: the set sits at the skull's top corners and the flap
  // (4-sided cone, wide base up, apex down) hangs alongside the cheek
  // with a gentle outward splay — never poking above the head outline
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    ear.name = side < 0 ? 'earL' : 'earR';
    ear.position.set(side * 0.055, 0.07, -0.002);
    const flap = makeCylinder(coatDark, [0.034, 0.003, 0.09], [side * 0.008, -0.05, 0.008], 4);
    flap.scale.z = 0.4;
    flap.rotation.z = side * 0.32; // gentle splay
    flap.rotation.x = 0.1; // tip folds slightly forward
    ear.add(flap);
    const inner = makeCylinder(silver, [0.018, 0.002, 0.055], [side * 0.006, -0.033, 0.02], 4);
    inner.scale.z = 0.3;
    inner.rotation.z = side * 0.32;
    inner.rotation.x = 0.1;
    ear.add(inner);
    head.add(ear);
  }

  // ── Tail: docked nub, pivot at the rump ──────────────────────────
  const tail = new THREE.Group();
  tail.name = 'tail';
  tail.position.set(0, 0.125, -0.27);
  const nub = makeCylinder(coat, [0.01, 0.014, 0.05], [0, 0.022, -0.008], 8);
  nub.rotation.x = -0.4;
  tail.add(nub);
  tail.add(ball(coat, 0.013, [1, 1, 1], [0, 0.048, -0.018]));
  g.add(tail);

  return { mesh: g, label: 'Lulú' };
}

register('miniSchnauzer', buildMiniSchnauzer);
