import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeRoundedBox, makeCylinder, makeSphere, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildMiniSchnauzer(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const g = rootGroup(cfg);

  const coat = makeStd({ color: 0x74716b, roughness: 0.96 });
  const coatLight = makeStd({ color: 0xa6a095, roughness: 0.96 });
  const coatDark = makeStd({ color: 0x565652, roughness: 0.97 });
  const cream = makeStd({ color: 0xd8d0bc, roughness: 0.96 });
  const noseMat = makeStd({ color: 0x1d1a17, roughness: 0.35 });
  const eyeMat = makeStd({ color: 0x14110f, roughness: 0.12 });
  const glintMat = makeStd({ color: 0xfffaf0, roughness: 0.1 });

  // Keep the shared room material factory unchanged; this character has soft shading.
  for (const material of [coat, coatLight, coatDark, cream, noseMat, eyeMat, glintMat]) {
    material.flatShading = false;
  }

  const named = <T extends THREE.Object3D>(object: T, name: string): T => {
    object.name = name;
    return object;
  };

  const ball = (
    mat: THREE.Material,
    r: number,
    scale: [number, number, number],
    pos: [number, number, number],
    segments = 24
  ): THREE.Mesh => {
    const m = makeSphere(mat, [r], pos, segments);
    m.scale.set(...scale);
    return m;
  };

  type LoftStation = [z: number, centerY: number, halfWidth: number, halfHeight: number];

  const loft = (
    mat: THREE.Material,
    stations: LoftStation[],
    segmentIndices: number[] | ((station: number) => number[]) = Array.from({ length: 12 }, (_, index) => index),
    capStart = true,
    capEnd = true,
  ): THREE.Mesh => {
    // Refine the same authored silhouette, preserving all shared station boundaries.
    const radialSteps = 36;
    const subdivisions = 4;
    const refined: LoftStation[] = [];
    for (let i = 0; i < stations.length - 1; i++) {
      for (let step = 0; step < subdivisions; step++) {
        const t = step / subdivisions;
        const row = stations[i].map((value, axis) => {
          const next = stations[i + 1][axis];
          if (axis === 0) return THREE.MathUtils.lerp(value, next, t);
          const before = stations[Math.max(0, i - 1)][axis];
          const after = stations[Math.min(stations.length - 1, i + 2)][axis];
          const tangentA = (next - before) / 2;
          const tangentB = (after - value) / 2;
          const curve = (2*t*t*t-3*t*t+1)*value + (t*t*t-2*t*t+t)*tangentA
            + (-2*t*t*t+3*t*t)*next + (t*t*t-t*t)*tangentB;
          return THREE.MathUtils.clamp(curve, Math.min(value, next), Math.max(value, next));
        }) as LoftStation;
        refined.push(row);
      }
    }
    refined.push(stations[stations.length - 1]);
    const positions: number[] = [];
    const indices: number[] = [];
    const segmentsAt = (station: number): number[] => {
      const authored = typeof segmentIndices === 'function' ? segmentIndices(station) : segmentIndices;
      return authored.flatMap((index) => [index * 3, index * 3 + 1, index * 3 + 2]);
    };
    for (const [z, centerY, halfWidth, halfHeight] of refined) {
      for (let j = 0; j < radialSteps; j++) {
        const angle = 2 * Math.PI * j / radialSteps;
        // Shallow longitudinal fur channels remain part of the underlying surface.
        const along = (z - refined[0][0]) / (refined[refined.length - 1][0] - refined[0][0]);
        const relief = mat === cream ? 1 + 0.025 * Math.sin(angle * 9) * Math.sin(Math.PI * along) : 1;
        positions.push(halfWidth * Math.sin(angle) * relief,
          centerY + halfHeight * Math.cos(angle) * relief, z);
      }
    }
    const addCap = (ring: number, start: boolean): void => {
      const center = positions.length / 3;
      positions.push(0, refined[ring][1], refined[ring][0]);
      for (const j of segmentsAt(start ? 0 : stations.length - 2)) {
        const a = ring * radialSteps + j;
        const b = ring * radialSteps + (j + 1) % radialSteps;
        indices.push(center, start ? a : b, start ? b : a);
      }
    };
    if (capStart) addCap(0, true);
    for (let ring = 0; ring < refined.length - 1; ring++) {
      for (const j of segmentsAt(Math.floor(ring / subdivisions))) {
        const next = (j + 1) % radialSteps;
        const a = ring * radialSteps, b = a + radialSteps;
        indices.push(a+j, b+j, b+next, a+j, b+next, a+next);
      }
    }
    if (capEnd) addCap(refined.length - 1, false);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    // Analytic normals prevent a visible split where two material patches share a ring.
    const normals = geometry.getAttribute('normal');
    for (let ring = 0; ring < refined.length; ring++) {
      const row = refined[ring];
      const previous = refined[Math.max(0, ring - 1)];
      const next = refined[Math.min(refined.length - 1, ring + 1)];
      const dz = next[0] - previous[0];
      for (let j = 0; j < radialSteps; j++) {
        const angle = 2 * Math.PI * j / radialSteps;
        const x = Math.sin(angle), y = Math.cos(angle);
        const longitudinal = (x*x*(next[2]-previous[2])/row[2]
          + y*(next[1]-previous[1])/row[3] + y*y*(next[3]-previous[3])/row[3]) / dz;
        const normal = new THREE.Vector3(x / row[2], y / row[3], -longitudinal).normalize();
        normals.setXYZ(ring * radialSteps + j, normal.x, normal.y, normal.z);
      }
    }
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const paintFur = (
    mesh: THREE.Mesh,
    colorAt: (x: number, y: number, z: number) => THREE.Color,
  ): THREE.Mesh => {
    const geometry = mesh.geometry.toNonIndexed();
    mesh.geometry.dispose();
    const positions = geometry.getAttribute('position');
    const material = mesh.material as THREE.MeshStandardMaterial;
    const colors: number[] = [];
    for (let vertex = 0; vertex < positions.count; vertex++) {
      const color = colorAt(positions.getX(vertex), positions.getY(vertex), positions.getZ(vertex));
      colors.push(color.r / material.color.r, color.g / material.color.g, color.b / material.color.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    mesh.geometry = geometry;
    material.vertexColors = true;
    return mesh;
  };

  const bodyColor = (x: number, y: number, z: number): THREE.Color => {
    const flank = THREE.MathUtils.clamp((0.175 - y) / 0.105, 0, 1);
    const underside = THREE.MathUtils.clamp((0.070 - y) / 0.060, 0, 1) * 0.35;
    const color = coatDark.color.clone().lerp(coat.color, flank).lerp(cream.color, underside);
    const mottling = Math.sin(z * 157 + Math.abs(x) * 83) * Math.sin(y * 191 - z * 73);
    return color.multiplyScalar(1 + mottling * 0.085);
  };

  const localStations = (stations: LoftStation[]): LoftStation[] => {
    const originZ = stations[0][0];
    return stations.map(([z, centerY, halfWidth, halfHeight]) => [z - originZ, centerY, halfWidth, halfHeight]);
  };

  const makeEarFlap = (side: number, mat: THREE.Material): THREE.Mesh => {
    // Broad buried root, raised fold, then a blunt V tip down the cheek.
    const front = [
      [-0.027, -0.032, -0.027],
      [0.009, -0.031, -0.023],
      [0.027, -0.042, 0.004],
      [0.019, -0.078, 0.030],
      [0.005, -0.080, 0.031],
      [-0.015, -0.048, 0.012],
      [-0.001, -0.034, 0.026],
    ].map(([x, y, z]) => [side * (x - 0.004), y - 0.003, z - 0.003]);
    const vertices = [...front, ...front.map(([x, y, z]) => [x, y, z - 0.010])];
    const positions = vertices.flat();
    const indices: number[] = [];
    for (let edge = 0; edge < 6; edge++) {
      const next = (edge + 1) % 6;
      indices.push(edge, 6, next, edge + 7, next + 7, 13);
      indices.push(edge, next, next + 7, edge, next + 7, edge + 7);
    }
    if (side < 0) for (let i = 0; i < indices.length; i += 3) {
      [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // ── Body (breathing group, origin at floor) ──────────────────────
  const body = new THREE.Group();
  body.name = 'body';
  g.add(body);

  const torsoStations: LoftStation[] = [
    [-0.270, 0.103, 0.023, 0.034],
    [-0.244, 0.095, 0.070, 0.057],
    [-0.205, 0.091, 0.108, 0.074],
    [-0.155, 0.090, 0.115, 0.076],
    [-0.090, 0.092, 0.100, 0.072],
    [-0.025, 0.099, 0.099, 0.080],
    [0.028, 0.102, 0.112, 0.091],
    [0.055, 0.099, 0.103, 0.092],
  ];
  body.add(named(paintFur(loft(coat, torsoStations, [3, 4, 5, 6, 7, 8], true, false), bodyColor), 'coatBase'));
  body.add(named(paintFur(loft(coatDark, torsoStations, [9, 10, 11, 0, 1, 2], true, false), bodyColor), 'saddle'));
  // The bib continues the same final ring, avoiding an overlapping shoulder cap.
  const chest = loft(cream, [
    torsoStations[torsoStations.length - 1],
    [0.088, 0.100, 0.089, 0.086],
    [0.120, 0.086, 0.060, 0.073],
    [0.152, 0.060, 0.037, 0.043],
    [0.166, 0.054, 0.008, 0.014],
  ], undefined, false, true);
  paintFur(chest, (x, y, z) => bodyColor(x, y, z).lerp(
    cream.color, THREE.MathUtils.smoothstep(z, 0.055, 0.135),
  ));
  body.add(named(chest, 'chestFurnishing'));

  // ── Front legs stretched forward ─────────────────────────────────
  const frontSegments = Array.from({ length: 12 }, (_, index) => index);
  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'L' : 'R';
    const frontLeg = loft(cream, localStations([
      [0.015, 0.070, 0.020, 0.022],
      [0.060, 0.055, 0.035, 0.044],
      [0.115, 0.041, 0.040, 0.039],
      [0.168, 0.038, 0.041, 0.034],
    ]), frontSegments, true, false);
    frontLeg.position.set(side * 0.060, 0, 0.015);
    paintFur(frontLeg, (x, y, z) => coat.color.clone().lerp(
      cream.color, THREE.MathUtils.smoothstep(z + 0.015, 0.035, 0.140),
    ));
    g.add(named(frontLeg, `frontLeg${suffix}`));

    const furnishing = loft(cream, localStations([
      [0.168, 0.038, 0.041, 0.034],
      [0.197, 0.029, 0.037, 0.027],
      [0.224, 0.026, 0.038, 0.024],
    ]), frontSegments, false, false);
    furnishing.position.set(side * 0.060, 0, 0.168);
    g.add(named(furnishing, `legFurnishing${suffix}`));

    const paw = loft(cream, localStations([
      [0.224, 0.026, 0.038, 0.024],
      [0.245, 0.024, 0.034, 0.022],
      [0.259, 0.022, 0.018, 0.016],
      [0.265, 0.021, 0.004, 0.005],
    ]), frontSegments, false, true);
    paw.position.set(side * 0.060, 0, 0.224);
    g.add(named(paw, `frontPaw${suffix}`));
  }

  // ── Hind legs folded against the haunches ─────────────────────────
  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'L' : 'R';
    const rearLeg = loft(cream, localStations([
      [-0.178, 0.052, 0.026, 0.031],
      [-0.130, 0.044, 0.037, 0.041],
      [-0.092, 0.028, 0.037, 0.026],
    ]), frontSegments, true, false);
    rearLeg.position.set(side * 0.096, 0, -0.178);
    paintFur(rearLeg, (x, y, z) => coat.color.clone().lerp(
      cream.color, THREE.MathUtils.smoothstep(z - 0.178, -0.180, -0.092),
    ));
    g.add(named(rearLeg, `rearLeg${suffix}`));

    const rearPaw = loft(cream, localStations([
      [-0.092, 0.028, 0.037, 0.026],
      [-0.071, 0.025, 0.029, 0.023],
      [-0.055, 0.021, 0.010, 0.011],
    ]), frontSegments, false, true);
    rearPaw.position.set(side * 0.096, 0, -0.092);
    g.add(named(rearPaw, `rearPaw${suffix}`));
  }

  // ── Head (pivot at the neck; muzzle points +Z) ───────────────────
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 0.19, 0.145);
  g.add(head);

  head.add(named(loft(coat, [
    [-0.066, 0.004, 0.026, 0.030],
    [-0.045, 0.002, 0.057, 0.053],
    [-0.014, 0.002, 0.074, 0.063],
    [0.023, 0.003, 0.071, 0.058],
    [0.056, 0.008, 0.060, 0.048],
    [0.083, -0.003, 0.044, 0.039],
  ]), 'headCoat'));

  head.add(named(makeRoundedBox(coatLight, [0.074, 0.037, 0.068], [0, -0.001, 0.086], 0.013, 4), 'muzzle'));
  const beardStations: LoftStation[] = [
    [-0.006, 0.082, 0.042, 0.020],
    [0.016, 0.094, 0.060, 0.027],
    [0.043, 0.086, 0.063, 0.033],
    [0.066, 0.078, 0.051, 0.027],
    [0.083, 0.071, 0.026, 0.013],
    [0.088, 0.069, 0.006, 0.004],
  ];
  const beard = loft(cream, beardStations, (station) => station < 2
    ? [2, 3, 4, 5, 6, 7, 8, 9] : frontSegments);
  beard.geometry.rotateX(Math.PI / 2);
  head.add(named(beard, 'beard'));
  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'L' : 'R';
    const stache = loft(cream, beardStations, (station) => station < 2 ? (side < 0 ? [10, 11] : [0, 1]) : [], true, false);
    stache.geometry.rotateX(Math.PI / 2);
    head.add(named(stache, `mustache${suffix}`));
  }

  const nose = named(ball(noseMat, 0.0135, [1.18, 0.8, 0.78], [0, 0.004, 0.122], 24), 'nose');
  head.add(nose);
  head.add(named(makeRoundedBox(noseMat, [0.035, 0.005, 0.006], [0, -0.028, 0.114], 0.002, 1), 'mouth'));

  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'L' : 'R';
    const eye = named(makeSphere(eyeMat, [0.011], [side * 0.032, 0.031, 0.069], 24), `eye${suffix}`);
    head.add(eye);
    head.add(named(
      ball(glintMat, 0.0032, [1, 1, 0.7], [side * 0.0285, 0.035, 0.078], 16),
      `eyeGlint${suffix}`
    ));
    const brow = named(
      ball(cream, 0.026, [1.16, 0.36, 0.68], [side * 0.032, 0.050, 0.070], 24),
      `eyebrow${suffix}`
    );
    brow.rotation.x = -0.16;
    brow.rotation.z = side * -0.2;
    head.add(brow);
  }

  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'L' : 'R';
    const ear = new THREE.Group();
    ear.name = `ear${suffix}`;
    ear.position.set(side * 0.061, 0.078, -0.006);
    ear.add(named(makeEarFlap(side, coatDark), `earFlap${suffix}`));
    head.add(ear);
  }

  // ── Tail: docked nub, pivot at the rump ──────────────────────────
  const tail = new THREE.Group();
  tail.name = 'tail';
  tail.position.set(0, 0.12, -0.255);
  const nub = named(makeCylinder(coatDark, [0.012, 0.016, 0.052], [0, 0.022, -0.008], 7), 'tailNub');
  nub.rotation.x = -0.45;
  tail.add(nub);
  tail.add(named(ball(coatLight, 0.014, [1, 1, 1], [0, 0.047, -0.02], 8), 'tailTip'));
  g.add(tail);

  // Every consumer of a vertex-colored material needs a color attribute.
  g.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshStandardMaterial) || !object.material.vertexColors) return;
    if (!object.geometry.hasAttribute('color')) {
      const colors = new Float32Array(object.geometry.getAttribute('position').count * 3).fill(1);
      object.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }
  });

  // Join shading across separate semantic meshes without changing their animation owners.
  const seams = [
    ['coatBase', 'saddle', 'chestFurnishing'],
    ['beard', 'mustacheL', 'mustacheR'],
    ...['L', 'R'].flatMap((side) => [
      [`frontLeg${side}`, `legFurnishing${side}`, `frontPaw${side}`],
      [`rearLeg${side}`, `rearPaw${side}`],
    ]),
  ];
  for (const names of seams) {
    const shared = new Map<string, { mesh: THREE.Mesh; index: number; normal: THREE.Vector3 }[]>();
    for (const name of names) {
      const mesh = g.getObjectByName(name) as THREE.Mesh;
      mesh.updateMatrix();
      const positions = mesh.geometry.getAttribute('position');
      const normals = mesh.geometry.getAttribute('normal');
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrix);
      for (let i = 0; i < positions.count; i++) {
        const point = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(mesh.matrix);
        const key = point.toArray().map((value) => Math.round(value * 1e6)).join(',');
        const entries = shared.get(key) ?? [];
        entries.push({ mesh, index: i, normal: new THREE.Vector3().fromBufferAttribute(normals, i).applyNormalMatrix(normalMatrix) });
        shared.set(key, entries);
      }
    }
    for (const entries of shared.values()) {
      if (new Set(entries.map((entry) => entry.mesh)).size < 2) continue;
      const average = entries.reduce((sum, entry) => sum.add(entry.normal), new THREE.Vector3()).normalize();
      for (const { mesh, index } of entries) {
        const inverse = new THREE.Matrix3().getNormalMatrix(mesh.matrix).invert();
        const normal = average.clone().applyNormalMatrix(inverse);
        mesh.geometry.getAttribute('normal').setXYZ(index, normal.x, normal.y, normal.z);
      }
    }
  }

  return { mesh: g, label: 'Lulú' };
}

register('miniSchnauzer', buildMiniSchnauzer);
