import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeTexture, rng } from '../../assets/textures.js';
import { rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

// Cartoon-puppy hero rebuild: seated chibi schnauzer — oversized head, huge
// round eyes with drawn highlight dots, continuous jagged white furnishings
// (brows/cheeks/beard), folded ears with pink inner pockets, white bib +
// fluffy forelegs + toe-grooved paws, jagged tail curl. Toon-flat albedo;
// fur texture is GEOMETRY (merged spike tufts), never a map.
// Non-negotiable animation surface (pet-renderer.ts drives children by
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

const UP = new THREE.Vector3(0, 1, 0);

/** One fur tuft: flattened 4-sided cone. Deterministic, hand-placed fans. */
function spike(r: number, h: number): THREE.BufferGeometry {
  const g = new THREE.ConeGeometry(r, h, 4, 1);
  g.rotateY(Math.PI / 4);
  g.scale(1, 1, 0.55);
  return g;
}

/**
 * Fan of `n` tuft spikes around centre `c`. Base direction `dir` is swept
 * across `spread` radians about `axis`; each spike embeds `embed` into the
 * parent volume (no mid-air tufts).
 */
function fan(
  c: [number, number, number],
  dir: [number, number, number],
  axis: [number, number, number],
  n: number, spread: number, r: number, h: number, embed = 0.015,
): THREE.BufferGeometry[] {
  const d = new THREE.Vector3(...dir).normalize();
  const ax = new THREE.Vector3(...axis).normalize();
  const q = new THREE.Quaternion();
  const out: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const a = n === 1 ? 0 : -spread / 2 + (spread * i) / (n - 1);
    const di = d.clone().applyAxisAngle(ax, a);
    const g = spike(r, h);
    g.applyQuaternion(q.setFromUnitVectors(UP, di));
    const t = di.multiplyScalar(h / 2 - embed);
    g.translate(c[0] + t.x, c[1] + t.y, c[2] + t.z);
    out.push(g);
  }
  return out;
}

/** Folded ear in head-local space. `side` = +1 left (+z), -1 right.
 *  Stub rises from the skull; flap hinges about the X axis and hangs down
 *  the head SIDE (reference fold), pink pocket on the stub's front face.
 *  Pivot at skull attach; the fold is baked so pet owns rotation.z. */
function buildEarGeos(side: 1 | -1): { outer: THREE.BufferGeometry; inner: THREE.BufferGeometry } {
  const stub = place(new RoundedBoxGeometry(0.05, 0.06, 0.05, 2, 0.012), 0, 0.028, 0, 0, 0, -0.1);
  const flap = place(
    new RoundedBoxGeometry(0.045, 0.06, 0.04, 2, 0.01),
    0.004, 0.039, side * 0.023,
    side * 2.25,
  );
  const edge = fan(
    [0.004, 0.02, side * 0.045], [0, -0.6, side * 0.8], [1, 0, 0],
    2, 0.4, 0.008, 0.026, 0.008,
  );
  const outer = merge([stub, flap, ...edge]);
  // Pink inner pocket on the stub's front face (visible from the front).
  const inner = place(new RoundedBoxGeometry(0.005, 0.032, 0.03, 2, 0.0024), 0.026, 0.024, 0);
  return { outer, inner };
}

function buildMiniSchnauzer(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const g = rootGroup(cfg);
  const s = 1.6;
  g.scale.set(s, s, s);

  // Salt-and-pepper toon palette observed from the reference. Coat carries
  // procedural fur-stroke maps (reference paints directional strokes on both
  // the dark and white coat; flat toon alone read as shaved plastic). Local
  // to this builder — the shared texture library is frozen by design contract.
  const furMap = (base: string, dark: string, light: string, seed: number): THREE.CanvasTexture => {
    const rand = rng(seed);
    const tex = makeTexture(64, 64, (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = rand() > 0.45 ? dark : light;
        const x = rand() * w;
        const y = rand() * h;
        ctx.fillRect(x | 0, y | 0, 1 + ((rand() * 1.5) | 0), 3 + rand() * 5 + (rand() - 0.5) * 1.6);
      }
    }, 'fur');
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.5, 2.5);
    return tex;
  };
  const coatDark = makeStd({ map: furMap('#45454d', '#34343b', '#585862', 777) });
  const silver = makeStd({ color: 0xa9a9b4 });
  const white = makeStd({ map: furMap('#eceae2', '#d3cec2', '#faf8f2', 888) });
  const blackMat = makeStd({ color: 0x141418 });
  const pinkMat = makeStd({ color: 0xcf9a92 });
  const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // ── Body (anchor: breath scale) — seated torso + tucked haunches, merged.
  // Slim profile (v3): reference has a straight back and a waist, not a ball.
  const haunchL = new THREE.SphereGeometry(0.052, 16, 12);
  haunchL.scale(1.2, 0.95, 1.05);
  const haunchR = new THREE.SphereGeometry(0.052, 16, 12);
  haunchR.scale(1.2, 0.95, 1.05);
  const torso = new THREE.SphereGeometry(0.11, 20, 16);
  torso.scale(1.12, 0.92, 0.82);
  const bodyGeo = merge([
    place(torso, 0, 0.10, 0),
    place(haunchL, -0.055, 0.07, 0.056),
    place(haunchR, -0.055, 0.07, -0.056),
    ...fan([-0.11, 0.13, 0], [-0.7, 0.6, 0], [0, 0, 1], 3, 0.7, 0.009, 0.028, 0.012),
    ...fan([-0.09, 0.1, 0.075], [-0.6, 0.2, 0.75], [1, 0, 0], 2, 0.5, 0.008, 0.026, 0.012),
    ...fan([-0.09, 0.1, -0.075], [-0.6, 0.2, -0.75], [1, 0, 0], 2, 0.5, 0.008, 0.026, 0.012),
  ]);
  bodyGeo.translate(0, -0.10, 0);
  const body = new THREE.Mesh(bodyGeo, coatDark);
  body.name = 'body';
  body.position.set(0, 0.10, 0);
  g.add(body);

  // ── White suit (static): chest bib, straight fluffy forelegs, paws.
  // Bib spikes + leg cuff tufts merged in — jagged white edges are the read.
  const legL = new THREE.CapsuleGeometry(0.02, 0.085, 4, 12);
  const legR = new THREE.CapsuleGeometry(0.02, 0.085, 4, 12);
  const pawFL = new THREE.SphereGeometry(0.027, 12, 8);
  pawFL.scale(1.3, 0.55, 1.05);
  const pawFR = new THREE.SphereGeometry(0.027, 12, 8);
  pawFR.scale(1.3, 0.55, 1.05);
  const pawHL = new THREE.SphereGeometry(0.03, 12, 8);
  pawHL.scale(1.35, 0.5, 1.1);
  const pawHR = new THREE.SphereGeometry(0.03, 12, 8);
  pawHR.scale(1.35, 0.5, 1.1);
  const bib = new THREE.SphereGeometry(0.085, 16, 12);
  bib.scale(0.9, 1.05, 0.95);
  const suit = new THREE.Mesh(
    merge([
      place(bib, 0.075, 0.095, 0),
      ...fan([0.115, 0.045, 0], [0.3, -1, 0], [1, 0, 0], 4, 0.9, 0.011, 0.035),
      place(legL, 0.115, 0.052, 0.046),
      place(legR, 0.115, 0.052, -0.046),
      ...fan([0.105, 0.028, 0.046], [0.1, -1, 0.2], [1, 0, 0], 2, 0.5, 0.009, 0.025),
      ...fan([0.105, 0.028, -0.046], [0.1, -1, -0.2], [1, 0, 0], 2, 0.5, 0.009, 0.025),
      place(pawFL, 0.135, 0.014, 0.046),
      place(pawFR, 0.135, 0.014, -0.046),
      place(pawHL, 0.06, 0.015, 0.095),
      place(pawHR, 0.06, 0.015, -0.095),
    ]),
    white,
  );
  suit.name = 'suit';
  g.add(suit);

  // ── Toe grooves (static, dark): 3 per front paw, 2 per hind paw.
  const groove = (): THREE.BufferGeometry => new THREE.CapsuleGeometry(0.0028, 0.02, 3, 6);
  const grooves = new THREE.Mesh(
    merge([
      place(groove(), 0.148, 0.028, 0.058, 0.35, 0, -0.25),
      place(groove(), 0.152, 0.028, 0.046, 0.35, 0, 0),
      place(groove(), 0.148, 0.028, 0.034, 0.35, 0, 0.25),
      place(groove(), 0.148, 0.028, -0.058, 0.35, 0, -0.25),
      place(groove(), 0.152, 0.028, -0.046, 0.35, 0, 0),
      place(groove(), 0.148, 0.028, -0.034, 0.35, 0, 0.25),
      place(groove(), 0.072, 0.029, 0.103, 0.35, 0, -0.2),
      place(groove(), 0.072, 0.029, 0.087, 0.35, 0, 0.2),
      place(groove(), 0.072, 0.029, -0.103, 0.35, 0, -0.2),
      place(groove(), 0.072, 0.029, -0.087, 0.35, 0, 0.2),
    ]),
    blackMat,
  );
  grooves.name = 'grooves';
  g.add(grooves);

  // ── Tail (anchor: rotation.z/y from pet) — plumed curl, pivot at base.
  // Turnaround evidence: medium plume ~half torso length, held curled up,
  // NOT a docked nub (v1 read from a single occluded view).
  const tailGeo = merge([
    place(new THREE.CapsuleGeometry(0.014, 0.055, 4, 12), 0, 0.032, 0),
    place(new THREE.CapsuleGeometry(0.02, 0.05, 4, 12), -0.012, 0.088, 0, 0, 0, 0.5),
    place(new THREE.SphereGeometry(0.016, 12, 8), -0.032, 0.118, 0),
    ...fan([-0.038, 0.126, 0], [-0.4, 0.9, 0], [0, 0, 1], 3, 0.7, 0.01, 0.03, 0.01),
    ...fan([-0.02, 0.095, 0], [-0.5, 0.7, 0.3], [0, 0, 1], 2, 0.5, 0.009, 0.026, 0.01),
  ]);
  tailGeo.rotateZ(0.35); // baked backward curl (runtime pose owned by pet)
  const tail = new THREE.Mesh(tailGeo, coatDark);
  tail.name = 'tail';
  tail.position.set(-0.10, 0.075, 0);
  g.add(tail);

  // ── Head (anchor: group; pet owns rotation.x sleep / rotation.y look).
  // Oversized chibi cranium; group origin at the neck so look rotations
  // swing the whole face.
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0.085, 0.19, 0);
  g.add(head);

  // Cranium — rounded slate dome. The eye zone gets a flat FACEPLATE: the
  // reference draws eyes on a flat facial plane, and spheres mounted on the
  // dome's rounded corner wrapped/floated at oblique angles (v3 lesson).
  const cranium = new THREE.Mesh(
    merge([
      new RoundedBoxGeometry(0.19, 0.16, 0.185, 4, 0.055),
      place(new RoundedBoxGeometry(0.02, 0.12, 0.185, 2, 0.008), 0.088, 0, 0),
    ]),
    coatDark,
  );
  cranium.name = 'cranium';
  cranium.position.set(0, 0.05, 0);
  head.add(cranium);

  // Furnishings — the breed read, one continuous jagged white mask:
  // muzzle + hanging beard + mustache side fans + bushy brow tufts.
  const furnishings = new THREE.Mesh(
    merge([
      place(new RoundedBoxGeometry(0.085, 0.075, 0.11, 3, 0.028), 0.088, 0.012, 0),
      ...fan([0.115, -0.03, 0], [0.25, -1, 0], [1, 0, 0], 5, 1.0, 0.013, 0.05),
      ...fan([0.095, -0.01, 0.052], [0.15, -0.8, 0.55], [1, 0, 0], 3, 0.6, 0.01, 0.035),
      ...fan([0.095, -0.01, -0.052], [0.15, -0.8, -0.55], [1, 0, 0], 3, 0.6, 0.01, 0.035),
      ...fan([0.096, 0.078, 0.046], [0.55, 0.75, -0.15], [1, 0, 0], 3, 0.7, 0.012, 0.038, 0.01),
      ...fan([0.096, 0.078, -0.046], [0.55, 0.75, 0.15], [1, 0, 0], 3, 0.7, 0.012, 0.038, 0.01),
    ]),
    white,
  );
  furnishings.name = 'furnishings';
  head.add(furnishings);

  // Cheeks — silver jagged fans below the eyes + silver crown fringe.
  const cheeks = new THREE.Mesh(
    merge([
      ...fan([0.04, -0.005, 0.09], [-0.45, -0.25, 0.85], [0, 1, 0], 3, 0.7, 0.013, 0.032, 0.018),
      ...fan([0.04, -0.005, -0.09], [-0.45, -0.25, -0.85], [0, 1, 0], 3, 0.7, 0.013, 0.032, 0.018),
      ...fan([-0.005, 0.126, 0], [-0.15, 1, 0], [0, 0, 1], 4, 0.9, 0.011, 0.024, 0.012),
    ]),
    silver,
  );
  cheeks.name = 'cheeks';
  head.add(cheeks);

  // Eye backing discs — flat white discs on the faceplate (v5 lesson: nested
  // ring/eye SPHERES let the ring wrap the eye; a flat disc cannot wrap).
  const discGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.004, 20);
  const eyeRings = new THREE.Mesh(
    merge([
      place(discGeo, 0.097, 0.05, 0.038, 0, 0, Math.PI / 2),
      place(new THREE.CylinderGeometry(0.024, 0.024, 0.004, 20), 0.097, 0.05, -0.038, 0, 0, Math.PI / 2),
    ]),
    white,
  );
  eyeRings.name = 'eyeRings';
  head.add(eyeRings);

  // Eyes — oversized round pair, slightly oval, ~1 mm proud of the rim.
  const eyeGeo = new THREE.SphereGeometry(0.02, 16, 12);
  eyeGeo.scale(0.5, 1.08, 1);
  const eyes = new THREE.Mesh(
    merge([
      place(eyeGeo, 0.092, 0.05, 0.038),
      place(((): THREE.BufferGeometry => { const e = new THREE.SphereGeometry(0.02, 16, 12); e.scale(0.5, 1.08, 1); return e; })(), 0.092, 0.05, -0.038),
    ]),
    blackMat,
  );
  eyes.name = 'eyes';
  head.add(eyes);

  // Highlight dots — drawn, not shaded: big upper-inner + small lower-outer.
  const hlBig = new THREE.SphereGeometry(0.006, 10, 8);
  const hlSmall = new THREE.SphereGeometry(0.0032, 8, 6);
  const highlights = new THREE.Mesh(
    merge([
      place(hlBig, 0.1025, 0.058, 0.032),
      place(hlSmall, 0.1035, 0.043, 0.045),
      place(new THREE.SphereGeometry(0.006, 10, 8), 0.1025, 0.058, -0.032),
      place(new THREE.SphereGeometry(0.0032, 8, 6), 0.1035, 0.043, -0.045),
    ]),
    hlMat,
  );
  highlights.name = 'highlights';
  head.add(highlights);

  // Nose — squashed sphere proud of the muzzle tip.
  const noseGeo = new THREE.SphereGeometry(0.021, 16, 12);
  noseGeo.scale(0.9, 0.75, 0.85);
  const nose = new THREE.Mesh(noseGeo, blackMat);
  nose.name = 'nose';
  nose.position.set(0.13, 0.03, 0);
  head.add(nose);

  // Ears — folded V flaps with pink inner pockets (children ride rotation.z).
  // pet-renderer owns rotation.z absolutely; the splay in rotation.x survives.
  const earGeosL = buildEarGeos(1);
  const earL = new THREE.Mesh(earGeosL.outer, coatDark);
  earL.name = 'earL';
  earL.position.set(-0.005, 0.095, 0.088);
  earL.rotation.x = 0.28;
  const innerL = new THREE.Mesh(earGeosL.inner, pinkMat);
  innerL.name = 'earInnerL';
  earL.add(innerL);
  head.add(earL);

  const earGeosR = buildEarGeos(-1);
  const earR = new THREE.Mesh(earGeosR.outer, coatDark);
  earR.name = 'earR';
  earR.position.set(-0.005, 0.095, -0.088);
  earR.rotation.x = -0.28;
  const innerR = new THREE.Mesh(earGeosR.inner, pinkMat);
  innerR.name = 'earInnerR';
  earR.add(innerR);
  head.add(earR);

  return { mesh: g, label: 'Lulú' };
}

register('miniSchnauzer', buildMiniSchnauzer);
