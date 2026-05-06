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

export function makeCylinder(material, params, pos) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(...params), material);
  mesh.position.set(...pos);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

export function makeCone(material, params, pos) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(...params), material);
  mesh.position.set(...pos);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

export function makeSphere(material, params, pos) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(...params), material);
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
