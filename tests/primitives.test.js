/**
 * @fileoverview Tests for geometry primitive helpers.
 *
 * Decision: Verify each primitive creates the correct Three.js object type,
 * applies position, and sets shadow properties.
 * Rationale (SRP): Each helper builds exactly one primitive — tests guard
 * against accidental drift in geometry type or shadow flags.
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeBox, makePlane, makeCylinder, makeCone, makeSphere, makeLight } from '../docs/js/primitives.js';

describe('makeBox', () => {
  const mat = new THREE.MeshBasicMaterial();

  it('returns a Mesh with BoxGeometry', () => {
    const mesh = makeBox(mat, [2, 3, 4], [1, 2, 3]);
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
  });

  it('sets position from pos array', () => {
    const mesh = makeBox(mat, [1, 1, 1], [5, 6, 7]);
    expect(mesh.position.x).toBe(5);
    expect(mesh.position.y).toBe(6);
    expect(mesh.position.z).toBe(7);
  });

  it('casts and receives shadows', () => {
    const mesh = makeBox(mat, [1, 1, 1], [0, 0, 0]);
    expect(mesh.castShadow).toBe(true);
    expect(mesh.receiveShadow).toBe(true);
  });
});

describe('makePlane', () => {
  const mat = new THREE.MeshBasicMaterial();

  it('returns a Mesh with PlaneGeometry', () => {
    const mesh = makePlane(mat, [4, 5], [0, 0, 0]);
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.geometry).toBeInstanceOf(THREE.PlaneGeometry);
  });

  it('receives shadow but does not cast', () => {
    const mesh = makePlane(mat, [1, 1], [0, 0, 0]);
    expect(mesh.receiveShadow).toBe(true);
    expect(mesh.castShadow).toBe(false);
  });

  it('sets position correctly', () => {
    const mesh = makePlane(mat, [2, 2], [1, 0, 3]);
    expect(mesh.position.x).toBe(1);
    expect(mesh.position.z).toBe(3);
  });
});

describe('makeCylinder', () => {
  const mat = new THREE.MeshBasicMaterial();

  it('returns a Mesh with CylinderGeometry', () => {
    const mesh = makeCylinder(mat, [1, 1, 2, 8], [0, 0, 0]);
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.geometry).toBeInstanceOf(THREE.CylinderGeometry);
  });

  it('sets position and shadows', () => {
    const mesh = makeCylinder(mat, [0.5, 0.5, 1, 6], [2, 3, 4]);
    expect(mesh.position.x).toBe(2);
    expect(mesh.castShadow).toBe(true);
    expect(mesh.receiveShadow).toBe(true);
  });
});

describe('makeCone', () => {
  const mat = new THREE.MeshBasicMaterial();

  it('returns a Mesh with ConeGeometry', () => {
    const mesh = makeCone(mat, [1, 2, 8], [0, 0, 0]);
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.geometry).toBeInstanceOf(THREE.ConeGeometry);
  });

  it('sets position and shadows', () => {
    const mesh = makeCone(mat, [0.5, 1, 6], [1, 2, 3]);
    expect(mesh.position.y).toBe(2);
    expect(mesh.castShadow).toBe(true);
  });
});

describe('makeSphere', () => {
  const mat = new THREE.MeshBasicMaterial();

  it('returns a Mesh with SphereGeometry', () => {
    const mesh = makeSphere(mat, [1, 8, 8], [0, 0, 0]);
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.geometry).toBeInstanceOf(THREE.SphereGeometry);
  });

  it('sets position and shadows', () => {
    const mesh = makeSphere(mat, [0.5, 6, 6], [3, 4, 5]);
    expect(mesh.position.z).toBe(5);
    expect(mesh.receiveShadow).toBe(true);
  });
});

describe('makeLight', () => {
  it('returns a PointLight with correct parameters', () => {
    const light = makeLight(0xffffff, 2, 10, [1, 2, 3]);
    expect(light).toBeInstanceOf(THREE.PointLight);
    expect(light.color.getHex()).toBe(0xffffff);
    expect(light.intensity).toBe(2);
    expect(light.distance).toBe(10);
    expect(light.position.x).toBe(1);
    expect(light.position.y).toBe(2);
    expect(light.position.z).toBe(3);
  });

  it('casts shadow with 256px map size', () => {
    const light = makeLight(0xff0000, 1, 5, [0, 0, 0]);
    expect(light.castShadow).toBe(true);
    expect(light.shadow.mapSize.width).toBe(256);
    expect(light.shadow.mapSize.height).toBe(256);
  });

  it('has negative shadow bias', () => {
    const light = makeLight(0xffffff, 1, 1, [0, 0, 0]);
    expect(light.shadow.bias).toBe(-0.001);
  });
});
