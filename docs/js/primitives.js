/**
 * @fileoverview Geometry primitives — SRP: one reason to change: shape construction.
 *
 * Rationale (SOLID — SRP): Every helper builds exactly one primitive.
 * Rationale (Clean Code): Small, pure-ish functions under 5 lines.
 */

import * as THREE from 'three';

export function makeBox(material, size, pos) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...pos);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

export function makePlane(material, size, pos) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...size), material);
  mesh.position.set(...pos);
  mesh.receiveShadow = true;
  return mesh;
}

/** Low-poly cylinder (8 radial segments for PSX look). */
export function makeCylinder(material, params, pos) {
  // Force low segment count: [radiusTop, radiusBottom, height, 8]
  const lp = [params[0], params[1], params[2], 8];
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(...lp), material);
  mesh.position.set(...pos);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

/** Low-poly cone (8 radial segments for PSX look). */
export function makeCone(material, params, pos) {
  const lp = [params[0], params[1], 8];
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(...lp), material);
  mesh.position.set(...pos);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

/** Low-poly sphere (8x6 segments for PSX look). */
export function makeSphere(material, params, pos) {
  const lp = [params[0], 8, 6];
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(...lp), material);
  mesh.position.set(...pos);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

export function makeLight(color, intensity, distance, pos) {
  const light = new THREE.PointLight(color, intensity, distance, 1);
  light.position.set(...pos);
  light.castShadow = true;
  light.shadow.mapSize.width = 256;
  light.shadow.mapSize.height = 256;
  light.shadow.bias = -0.001;
  return light;
}
