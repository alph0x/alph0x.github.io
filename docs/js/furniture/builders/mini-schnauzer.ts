import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

// P-15 hero rebuild (D-15 + character-appeal): silhouette first — rectangular
// beard, bushy eyebrows, folded ears, stocky two-tone body readable at 1 m.
// Non-negotiable animation surface (pet-renderer.ts:38-42 drives children by
// name): body (breath scale.y around torso centre), head (group, look/sleep
// rotations), tail (rotation.z/y, base pivot), earL/earR (rotation.z absolute
// from pet, fold baked into geometry, splay preserved in rotation.x).

/** Bake rotate+translate into a geometry (for merged static parts). */
function place(
  geo: THREE.BufferGeometry,
  x: number, y: number, z: number,
  rx = 0, ry = 0, rz = 0,
): THREE.BufferGeometry {
  if (rx) geo.rotateX(rx);
  if (ry) geo.rotateY(ry);
  if (rz) geo.rotateZ(rz);
  geo.translate(x, y, z);
  return geo;
}

/** Normalize indexing (RoundedBoxGeometry is non-indexed), merge, re-index. */
function merge(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(geos.map((p) => (p.index ? p.toNonIndexed() : p)));
  return mergeVertices(merged);
}

function buildMiniSchnauzer(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const g = rootGroup(cfg);
  const s = 1.6;
  g.scale.set(s, s, s);

  // Salt-and-pepper: slate back, silver/white furnishings. No texture map —
  // flat toon color keeps the two-tone coat contrast readable.
  const coatDark = makeStd({ color: 0x484850 });
  const silver = makeStd({ color: 0xb9b9c2 });
  const white = makeStd({ color: 0xccccd4 });
  const noseMat = makeStd({ color: 0x1a1a1e });
  const eyeMat = makeStd({ color: 0x0a0a0e });
  const collarMat = makeStd({ color: 0xcc3333 });

  // ── Body (anchor: breath scale) — torso + chest + tucked haunches, merged.
  // Origin at torso centre so pet.breathScale expands the whole mass evenly.
  const haunchL = new THREE.SphereGeometry(0.08, 16, 12);
  haunchL.scale(1.15, 0.85, 1);
  const haunchR = new THREE.SphereGeometry(0.08, 16, 12);
  haunchR.scale(1.15, 0.85, 1);
  const bodyGeo = merge([
    place(new RoundedBoxGeometry(0.40, 0.17, 0.23, 4, 0.07), 0, 0.085, 0),
    place(new THREE.SphereGeometry(0.082, 16, 12), 0.15, 0.07, 0),
    place(haunchL, -0.14, 0.06, 0.095),
    place(haunchR, -0.14, 0.06, -0.095),
  ]);
  bodyGeo.translate(0, -0.08, 0);
  const body = new THREE.Mesh(bodyGeo, coatDark);
  body.name = 'body';
  body.position.set(0, 0.08, 0);
  g.add(body);

  // ── Silver furnishings (static): belly, chest bib, sphinx front legs, paws.
  // Merged to one mesh; slight paw asymmetry keeps the mass from feeling dead.
  const legL = new THREE.CapsuleGeometry(0.023, 0.11, 4, 12);
  legL.rotateZ(Math.PI / 2 - 0.06);
  legL.rotateY(-0.06);
  const legR = new THREE.CapsuleGeometry(0.023, 0.11, 4, 12);
  legR.rotateZ(Math.PI / 2 - 0.06);
  legR.rotateY(0.06);
  const pawFL = new THREE.SphereGeometry(0.027, 12, 8);
  pawFL.scale(1.3, 0.62, 1.05);
  const pawFR = new THREE.SphereGeometry(0.027, 12, 8);
  pawFR.scale(1.3, 0.62, 1.05);
  const pawBL = new THREE.SphereGeometry(0.028, 12, 8);
  pawBL.scale(1.25, 0.6, 1.1);
  const pawBR = new THREE.SphereGeometry(0.028, 12, 8);
  pawBR.scale(1.25, 0.6, 1.1);
  const silverSuit = new THREE.Mesh(
    merge([
      place(new RoundedBoxGeometry(0.24, 0.09, 0.19, 3, 0.035), 0.03, 0.05, 0),
      place(new RoundedBoxGeometry(0.09, 0.10, 0.12, 3, 0.04), 0.16, 0.07, 0),
      place(legL, 0.27, 0.028, 0.072),
      place(legR, 0.27, 0.028, -0.072),
      place(pawFL, 0.36, 0.017, 0.074),
      place(pawFR, 0.35, 0.017, -0.074),
      place(pawBL, -0.225, 0.018, 0.10),
      place(pawBR, -0.225, 0.018, -0.10),
    ]),
    silver,
  );
  silverSuit.name = 'silverSuit';
  g.add(silverSuit);

  // ── Collar + tag (merged).
  const collar = new THREE.Mesh(
    merge([
      place(new THREE.TorusGeometry(0.072, 0.011, 8, 20), 0.155, 0.125, 0, 0, Math.PI / 2),
      place(new THREE.SphereGeometry(0.014, 12, 8), 0.205, 0.06, 0.02),
    ]),
    collarMat,
  );
  collar.name = 'collar';
  g.add(collar);

  // ── Head (anchor: group; pet owns rotation.x sleep / rotation.y look).
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0.24, 0.155, 0);
  g.add(head);

  // Cranium — rectangular schnauzer skull (longer than tall), smooth corners.
  const cranium = new THREE.Mesh(new RoundedBoxGeometry(0.175, 0.145, 0.145, 4, 0.055), coatDark);
  cranium.name = 'cranium';
  cranium.position.set(0, 0.005, 0);
  head.add(cranium);

  // Furnishings — the breed read: muzzle + mustache + beard + bushy brows,
  // sized against the cranium so the skull stays visible (not a white helmet).
  const furnishings = new THREE.Mesh(
    merge([
      place(new RoundedBoxGeometry(0.11, 0.075, 0.09, 3, 0.03), 0.105, -0.025, 0),
      place(new RoundedBoxGeometry(0.09, 0.04, 0.08, 3, 0.018), 0.115, -0.06, 0),
      place(new RoundedBoxGeometry(0.075, 0.085, 0.065, 3, 0.028), 0.13, -0.10, 0),
      place(new RoundedBoxGeometry(0.055, 0.02, 0.04, 2, 0.009), 0.055, 0.062, 0.046, -0.3),
      place(new RoundedBoxGeometry(0.05, 0.02, 0.04, 2, 0.009), 0.055, 0.062, -0.046, 0.3),
    ]),
    white,
  );
  furnishings.name = 'furnishings';
  head.add(furnishings);

  // Nose — squashed sphere proud of the muzzle tip.
  const noseGeo = new THREE.SphereGeometry(0.024, 16, 12);
  noseGeo.scale(1, 0.85, 0.9);
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.name = 'nose';
  nose.position.set(0.168, -0.022, 0);
  head.add(nose);

  // Eyes — deep-set pair, proud of the cranium face under the brow overhang.
  const eyes = new THREE.Mesh(
    merge([
      place(new THREE.SphereGeometry(0.018, 12, 8), 0.078, 0.032, 0.05),
      place(new THREE.SphereGeometry(0.018, 12, 8), 0.078, 0.032, -0.05),
    ]),
    eyeMat,
  );
  eyes.name = 'eyes';
  head.add(eyes);

  // Ears — two-part folded V flaps (stub + folded tip baked into geometry).
  // pet-renderer owns rotation.z absolutely; the splay in rotation.x survives.
  const earFlapL = merge([
    place(new RoundedBoxGeometry(0.03, 0.06, 0.055, 2, 0.012), 0, 0.01, 0, 0, 0, -0.15),
    place(new RoundedBoxGeometry(0.026, 0.06, 0.048, 2, 0.011), 0.024, -0.035, 0, 0, 0, -0.55),
  ]);
  earFlapL.rotateZ(-0.15); // overall forward fold
  const earL = new THREE.Mesh(earFlapL, coatDark);
  earL.name = 'earL';
  earL.position.set(-0.04, 0.045, 0.092);
  earL.rotation.x = -0.18;
  head.add(earL);

  const earFlapR = merge([
    place(new RoundedBoxGeometry(0.03, 0.06, 0.055, 2, 0.012), 0, 0.01, 0, 0, 0, -0.15),
    place(new RoundedBoxGeometry(0.026, 0.06, 0.048, 2, 0.011), 0.024, -0.035, 0, 0, 0, -0.55),
  ]);
  earFlapR.rotateZ(-0.15);
  const earR = new THREE.Mesh(earFlapR, coatDark);
  earR.name = 'earR';
  earR.position.set(-0.04, 0.045, -0.092);
  earR.rotation.x = 0.18;
  head.add(earR);

  // ── Tail (anchor: rotation.z/y from pet) — docked nub, pivot at its base.
  const tailGeo = merge([
    place(new THREE.CapsuleGeometry(0.015, 0.045, 4, 12), 0, 0.0325, 0),
    place(new THREE.SphereGeometry(0.019, 12, 8), 0, 0.062, 0),
  ]);
  tailGeo.rotateZ(0.25); // baked jaunty tilt (runtime pose owned by pet)
  const tail = new THREE.Mesh(tailGeo, coatDark);
  tail.name = 'tail';
  tail.position.set(-0.215, 0.095, 0);
  g.add(tail);

  return { mesh: g, label: 'Lulú' };
}

register('miniSchnauzer', buildMiniSchnauzer);
