import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeRoundedBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildShoes(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const shoeMat = makeStd({ color: 0x373a37, roughness: 0.9 });
  const soleMat = makeStd({ color: 0xd8d1bf, roughness: 1 });
  const liningMat = makeStd({ color: 0x191c1b, roughness: 1 });
  shoeMat.flatShading = soleMat.flatShading = false;
  // Closed elliptical rings give the toe and heel one continuous surface.
  function upper(): THREE.BufferGeometry {
    const stations = [[-0.16, 0.006, 0.024], [-0.145, 0.040, 0.035], [-0.105, 0.054, 0.044],
      [-0.04, 0.058, 0.055], [0.025, 0.052, 0.065], [0.085, 0.045, 0.062], [0.12, 0.032, 0.049], [0.125, 0.006, 0.025]];
    const vertices: number[] = [], indices: number[] = [];
    for (const [z, width, top] of stations) {
      for (let j = 0; j < 20; j++) {
        const a = j / 20 * Math.PI * 2;
        vertices.push(Math.sin(a) * width, 0.015 + (top - 0.015) * (Math.cos(a) + 1) / 2, z);
      }
    }
    for (let i = 0; i < stations.length - 1; i++) {
      for (let j = 0; j < 20; j++) {
        const a = i * 20 + j, b = i * 20 + (j + 1) % 20;
        indices.push(a, a + 20, b, b, a + 20, b + 20);
      }
    }
    for (const end of [0, stations.length - 1]) {
      const centre = vertices.length / 3;
      vertices.push(0, (0.015 + stations[end][2]) / 2, stations[end][0]);
      for (let j = 0; j < 20; j++) {
        const a = end * 20 + j, b = end * 20 + (j + 1) % 20;
        if (end === 0) indices.push(centre, a, b); else indices.push(centre, b, a);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }
  for (const [i, [sx, sz]] of [[-0.08, 0], [0.08, 0.05]].entries()) {
    const sole = makeRoundedBox(soleMat, [0.12, 0.015, 0.285], [sx, 0.0075, sz - 0.0175], 0.007, 3);
    sole.name = `shoe-sole-${i}`;
    g.add(sole);
    const body = new THREE.Mesh(upper(), shoeMat);
    body.name = `shoe-upper-${i}`;
    body.position.set(sx, 0, sz);
    body.castShadow = body.receiveShadow = true;
    g.add(body);
    g.add(makeRoundedBox(liningMat, [0.055, 0.005, 0.057], [sx, 0.058, sz + 0.063], 0.002, 2));
    g.add(makeRoundedBox(shoeMat, [0.045, 0.005, 0.065], [sx, 0.059, sz + 0.004], 0.002, 2));
    for (const z of [-0.016, 0, 0.016]) {
      const lace = makeRoundedBox(soleMat, [0.062, 0.003, 0.004], [sx, 0.0625, sz + z], 0.001, 1);
      lace.rotation.y = z < 0 ? 0.15 : -0.15;
      g.add(lace);
    }
  }
  return { mesh: g };
}
register('shoes', buildShoes);
