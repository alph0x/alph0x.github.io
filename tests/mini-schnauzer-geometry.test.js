import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { FurnitureRegistry } from '../docs/js/furniture/registry.js';
import '../docs/js/furniture/builders/mini-schnauzer.js';

const PIVOT_RESTS = {
  body: [0, 0, 0],
  head: [0, 0.19, 0.145],
  tail: [0, 0.12, -0.255],
  earL: [-0.061, 0.078, -0.006],
  earR: [0.061, 0.078, -0.006],
};
const REQUIRED_PIVOTS = Object.keys(PIVOT_RESTS);
const BREED_MARKERS = [
  'coatBase',
  'saddle',
  'chestFurnishing',
  'frontLegL',
  'frontLegR',
  'legFurnishingL',
  'legFurnishingR',
  'frontPawL',
  'frontPawR',
  'muzzle',
  'beard',
  'mustacheL',
  'mustacheR',
  'nose',
  'eyeL',
  'eyeR',
  'eyebrowL',
  'eyebrowR',
  'earFlapL',
  'earFlapR',
  'tailNub',
];

function buildLulu() {
  const { builder } = FurnitureRegistry.get('miniSchnauzer');
  return builder({ position: [0, 0, 0], rotation: 0 }).mesh;
}

function requireNamed(root, name) {
  const object = root.getObjectByName(name);
  expect(object, `missing ${name}`).toBeDefined();
  return object;
}

function worldPosition(root, name) {
  const position = new THREE.Vector3();
  requireNamed(root, name).getWorldPosition(position);
  return position;
}

function expectMirrored(root, leftName, rightName, tolerance = 0.001) {
  const left = worldPosition(root, leftName);
  const right = worldPosition(root, rightName);
  expect(Math.abs(left.x + right.x), `${leftName}/${rightName} x symmetry`).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(left.y - right.y), `${leftName}/${rightName} y symmetry`).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(left.z - right.z), `${leftName}/${rightName} z symmetry`).toBeLessThanOrEqual(tolerance);
}

function materialLuminance(root, name) {
  const mesh = requireNamed(root, name);
  expect(mesh).toBeInstanceOf(THREE.Mesh);
  expect(mesh.material).not.toBeInstanceOf(Array);
  expect(mesh.material.color).toBeInstanceOf(THREE.Color);
  return mesh.material.color.r * 0.2126 + mesh.material.color.g * 0.7152 + mesh.material.color.b * 0.0722;
}

function geometryCost(root) {
  let meshes = 0;
  let triangles = 0;
  const materials = new Set();

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    meshes += 1;
    const position = object.geometry.getAttribute('position');
    triangles += object.geometry.index ? object.geometry.index.count / 3 : position.count / 3;
    const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
    meshMaterials.forEach((material) => materials.add(material));
  });

  return { meshes, triangles, materials: materials.size };
}

function expectBudget(cost) {
  for (const value of Object.values(cost)) {
    expect(Number.isInteger(value) && value >= 0).toBe(true);
  }
  expect(cost.meshes).toBeLessThanOrEqual(48);
  expect(cost.triangles).toBeLessThanOrEqual(60000);
  expect(cost.materials).toBeLessThanOrEqual(10);
}

function expectRestPivots(root) {
  for (const [name, position] of Object.entries(PIVOT_RESTS)) {
    const pivot = requireNamed(root, name);
    expect(pivot.position.toArray(), `${name} rest position`).toEqual(position);
    expect([pivot.rotation.x, pivot.rotation.y, pivot.rotation.z], `${name} rest rotation`).toEqual([0, 0, 0]);
    expect(pivot.scale.toArray(), `${name} rest scale`).toEqual([1, 1, 1]);
  }
}

function expectFiniteGeometry(root) {
  root.updateMatrixWorld(true);
  root.traverse((object) => {
    expect(object.matrixWorld.elements.every(Number.isFinite), `${object.name} transform`).toBe(true);
    if (!(object instanceof THREE.Mesh)) return;
    for (const [name, attribute] of Object.entries(object.geometry.attributes)) {
      expect(Array.from(attribute.array).every(Number.isFinite), `${object.name} ${name}`).toBe(true);
    }
  });
}

describe('miniature Schnauzer geometry', () => {
  it('preserves one finite Group for every pet-renderer pivot', () => {
    const lulu = buildLulu();
    lulu.updateMatrixWorld(true);
    expectRestPivots(lulu);
    expectFiniteGeometry(lulu);

    for (const name of REQUIRED_PIVOTS) {
      const matches = [];
      lulu.traverse((object) => {
        if (object.name === name) matches.push(object);
      });
      expect(matches, `${name} pivot count`).toHaveLength(1);
      expect(matches[0]).toBeInstanceOf(THREE.Group);
      const transform = [
        ...matches[0].position.toArray(),
        matches[0].rotation.x,
        matches[0].rotation.y,
        matches[0].rotation.z,
        ...matches[0].scale.toArray(),
        ...matches[0].quaternion.toArray(),
        ...matches[0].matrixWorld.elements,
      ];
      expect(transform.every(Number.isFinite), `${name} finite transform`).toBe(true);
    }

    expect(requireNamed(lulu, 'body').parent).toBe(lulu);
    expect(requireNamed(lulu, 'head').parent).toBe(lulu);
    expect(requireNamed(lulu, 'tail').parent).toBe(lulu);
    expect(requireNamed(lulu, 'earL').parent).toBe(requireNamed(lulu, 'head'));
    expect(requireNamed(lulu, 'earR').parent).toBe(requireNamed(lulu, 'head'));
  });

  it('stays compact, floor-anchored, and unmistakably in a lying pose', () => {
    const lulu = buildLulu();
    lulu.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(lulu);
    const size = bounds.getSize(new THREE.Vector3());

    expect(size.x).toBeGreaterThan(0.2);
    expect(size.x).toBeLessThan(0.4);
    expect(size.y).toBeGreaterThan(0.18);
    expect(size.y).toBeLessThan(0.38);
    expect(size.z).toBeGreaterThan(0.45);
    expect(size.z).toBeLessThan(0.75);
    expect(size.z / size.y).toBeGreaterThan(1.45);
    expect(bounds.min.y).toBeGreaterThanOrEqual(-0.02);

    const head = worldPosition(lulu, 'head');
    const tail = worldPosition(lulu, 'tail');
    const pawL = worldPosition(lulu, 'frontPawL');
    const pawR = worldPosition(lulu, 'frontPawR');
    expect(pawL.z).toBeGreaterThan(head.z);
    expect(pawR.z).toBeGreaterThan(head.z);
    expect(tail.z).toBeLessThan(head.z);
    expect(Math.abs(pawL.y - pawR.y)).toBeLessThanOrEqual(0.001);
  });

  it('exposes the approved breed markers as stable procedural nodes', () => {
    const lulu = buildLulu();
    for (const name of BREED_MARKERS) requireNamed(lulu, name);

    const head = requireNamed(lulu, 'head');
    for (const name of ['muzzle', 'beard', 'mustacheL', 'mustacheR', 'nose', 'eyeL', 'eyeR', 'eyebrowL', 'eyebrowR']) {
      expect(requireNamed(lulu, name).parent, `${name} head ownership`).toBe(head);
    }
    expect(requireNamed(lulu, 'earFlapL').parent).toBe(requireNamed(lulu, 'earL'));
    expect(requireNamed(lulu, 'earFlapR').parent).toBe(requireNamed(lulu, 'earR'));
    expect(requireNamed(lulu, 'tailNub').parent).toBe(requireNamed(lulu, 'tail'));
  });

  it('keeps paired eyes, brows, ears, furnishings, paws, and mustache balanced', () => {
    const lulu = buildLulu();
    lulu.updateMatrixWorld(true);

    for (const pair of [
      ['eyeL', 'eyeR'],
      ['eyebrowL', 'eyebrowR'],
      ['earL', 'earR'],
      ['earFlapL', 'earFlapR'],
      ['frontLegL', 'frontLegR'],
      ['legFurnishingL', 'legFurnishingR'],
      ['frontPawL', 'frontPawR'],
      ['mustacheL', 'mustacheR'],
    ]) {
      expectMirrored(lulu, pair[0], pair[1]);
    }
  });

  it('uses readable salt-and-pepper zoning without reference-only accessories', () => {
    const lulu = buildLulu();
    const coat = materialLuminance(lulu, 'coatBase');
    const saddle = materialLuminance(lulu, 'saddle');
    const beard = materialLuminance(lulu, 'beard');
    const chest = materialLuminance(lulu, 'chestFurnishing');
    const paw = materialLuminance(lulu, 'frontPawL');

    expect(saddle).toBeLessThan(coat);
    expect(coat).toBeLessThan(beard);
    expect(chest).toBeGreaterThan(coat);
    expect(paw).toBeGreaterThan(coat);

    const torusMeshes = [];
    lulu.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry instanceof THREE.TorusGeometry) torusMeshes.push(object);
    });
    expect(torusMeshes, 'collar/tag geometry is outside the approved room scope').toHaveLength(0);
  });

  it('keeps the procedural art pass inside the detailed character budget', () => {
    expectBudget(geometryCost(buildLulu()));
  });
  it('uses smooth finite normals and complete color attributes on shared fur materials', () => {
    const lulu = buildLulu();
    lulu.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      expect(object.material.flatShading, object.name).toBe(false);
      const normals = object.geometry.getAttribute('normal');
      expect(normals.count).toBe(object.geometry.getAttribute('position').count);
      for (let i = 0; i < normals.count; i++) {
        const length = Math.hypot(normals.getX(i), normals.getY(i), normals.getZ(i));
        // Unused vertices in partial loft rings may have zero normals.
        expect(length === 0 || Math.abs(length - 1) < 0.00001).toBe(true);
      }
      if (object.material.vertexColors) {
        expect(object.geometry.getAttribute('color').count).toBe(normals.count);
      }
    });
  });

  it('joins the front leg and furnishing with matching positions and shading', () => {
    const lulu = buildLulu();
    const vertices = (name) => {
      const mesh = requireNamed(lulu, name); mesh.updateMatrix();
      const positions = mesh.geometry.getAttribute('position');
      const normals = mesh.geometry.getAttribute('normal');
      const result = new Map();
      for (let i = 0; i < positions.count; i++) {
        const p = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(mesh.matrix);
        result.set(p.toArray().map(value => Math.round(value * 1e6)).join(','),
          new THREE.Vector3().fromBufferAttribute(normals, i));
      }
      return result;
    };
    const leg = vertices('frontLegL'), furnishing = vertices('legFurnishingL');
    let shared = 0;
    for (const [key, normal] of leg) {
      if (!furnishing.has(key)) continue;
      shared++;
      expect(normal.distanceTo(furnishing.get(key))).toBeLessThan(0.00001);
    }
    expect(shared).toBeGreaterThanOrEqual(36);
  });

  it('counts hidden shared geometry per instance and every material-array entry', () => {
    const root = new THREE.Group();
    const geometry = new THREE.BoxGeometry();
    const materials = [new THREE.MeshBasicMaterial(), new THREE.MeshBasicMaterial()];
    const first = new THREE.Mesh(geometry, materials);
    const hidden = new THREE.Mesh(geometry, materials[0]);
    hidden.visible = false;
    geometry.setDrawRange(0, 3);
    root.add(first, hidden, new THREE.Mesh(new THREE.BufferGeometry().setAttribute(
      'position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3),
    ), materials[1]));
    expect(geometryCost(root)).toEqual({ meshes: 3, triangles: 25, materials: 2 });
  });

  it('rejects costs above the triangle ceiling and invalid totals', () => {
    for (const triangles of [60001, Infinity, NaN, 1.5]) {
      expect(() => expectBudget({ meshes: 44, materials: 7, triangles })).toThrow();
    }
  });

  it('rejects isolated pivot drift and nonfinite vertices', () => {
    const lulu = buildLulu();
    lulu.getObjectByName('head').position.y += 0.001;
    expect(() => expectRestPivots(lulu)).toThrow();
    const invalid = buildLulu();
    invalid.getObjectByName('nose').geometry.getAttribute('position').setX(0, NaN);
    expect(() => expectFiniteGeometry(invalid)).toThrow();
  });
});
