import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { register } from '../registry.js';
import { makeStd, texMetal, texPlastic, texScreenGlow } from '../../assets/index.js';
import { rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

// P-15 hero rebuild (D-15): readable aluminum clamshell — hinge barrel, lid
// open at ~110°, bezel + flush emissive screen (the old build's glow plane
// stood perpendicular to the lid: "a screen on the desk"), key grid with
// spacebar, trackpad. Single procedural path — the GLB path is retired.

/** Bake rotate+translate into a geometry (for merged static parts). */
function place(
  geo: THREE.BufferGeometry,
  x: number, y: number, z: number,
  rx = 0, ry = 0, rz = 0,
): THREE.BufferGeometry {
  // RoundedBoxGeometry is non-indexed, cylinders are indexed — normalize.
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  if (rz) g.rotateZ(rz);
  g.translate(x, y, z);
  return g;
}

function buildMacBook(cfg: FurnitureConfig): { mesh: THREE.Group; type: string; panelId: string; label: string; room: string } {
  const g = rootGroup(cfg);

  const aluminum = makeStd({ map: texMetal, color: 0xc6cacf });
  const hingeMat = makeStd({ map: texMetal, color: 0x8a9296 });
  const dark = makeStd({ map: texPlastic, color: 0x1a1a1e });
  const keyMat = makeStd({ color: 0x141418 });
  const trackpadMat = makeStd({ map: texMetal, color: 0xd2d4da });
  const screenGlow = new THREE.MeshBasicMaterial({ map: texScreenGlow });
  screenGlow.color.multiplyScalar(4); // crosses the 0.85 bloom threshold

  const w = 0.36;
  const d = 0.25;
  const baseH = 0.014;
  const lidT = 0.008;

  // Base clamshell with hinge barrel (merged — one aluminum mass).
  const base = new THREE.Mesh(
    mergeGeometries([
      place(new RoundedBoxGeometry(w, baseH, d, 3, 0.005), 0, baseH / 2, 0),
      place(new THREE.CylinderGeometry(0.008, 0.008, w * 0.72, 16), 0, baseH, -d / 2 + 0.006, 0, 0, Math.PI / 2),
    ]),
    aluminum,
  );
  base.name = 'base';
  g.add(base);

  // Recessed keyboard well.
  const well = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.0016, 0.108), dark);
  well.name = 'keyboardWell';
  well.position.set(0, baseH + 0.0002, -0.056);
  g.add(well);

  // Key grid — 4 uniform rows + a bottom row with a real spacebar (merged).
  const keys: THREE.BufferGeometry[] = [];
  const keyY = baseH + 0.0021;
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 13; i++) {
      keys.push(place(new THREE.BoxGeometry(0.02, 0.0022, 0.016), (i - 6) * 0.0232, keyY, -0.096 + j * 0.0195));
    }
  }
  for (const i of [0, 1, 2, 3, 9, 10, 11, 12]) {
    keys.push(place(new THREE.BoxGeometry(0.02, 0.0022, 0.016), (i - 6) * 0.0232, keyY, -0.018));
  }
  keys.push(place(new THREE.BoxGeometry(0.1128, 0.0022, 0.016), 0, keyY, -0.018));
  const keyGrid = new THREE.Mesh(mergeGeometries(keys), keyMat);
  keyGrid.name = 'keys';
  g.add(keyGrid);

  // Trackpad.
  const trackpad = new THREE.Mesh(new RoundedBoxGeometry(0.108, 0.0018, 0.062, 2, 0.004), trackpadMat);
  trackpad.name = 'trackpad';
  trackpad.position.set(0, baseH + 0.0009, 0.062);
  g.add(trackpad);

  // Lid group at the hinge line, opened to ~110° (deck-to-screen angle).
  const lidGroup = new THREE.Group();
  lidGroup.name = 'lid';
  lidGroup.position.set(0, baseH, -d / 2 + 0.006);
  lidGroup.rotation.x = -THREE.MathUtils.degToRad(110);

  // Lid slab (built flat; the -Y face becomes the user-facing screen side).
  const lid = new THREE.Mesh(new RoundedBoxGeometry(w, lidT, d, 3, 0.004), aluminum);
  lid.name = 'lidSlab';
  lid.position.set(0, lidT / 2, d / 2);
  lidGroup.add(lid);

  // Bezel — dark frame flush under the slab.
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, 0.0012, d * 0.9), dark);
  bezel.name = 'bezel';
  bezel.position.set(0, -0.0006, d / 2);
  lidGroup.add(bezel);

  // Emissive screen — flush with the bezel, facing the user (16:10).
  const screenGeo = new THREE.PlaneGeometry(w * 0.875, d * 0.82);
  screenGeo.rotateX(Math.PI / 2); // normal -Y in lid space
  const screen = new THREE.Mesh(screenGeo, screenGlow);
  screen.name = 'screen';
  screen.position.set(0, -0.0014, d / 2);
  lidGroup.add(screen);

  g.add(lidGroup);

  return { mesh: g, type: 'terminal', panelId: 'panel-alphgpt', label: 'MACBOOK', room: 'APT' };
}

register('macBook', buildMacBook);
