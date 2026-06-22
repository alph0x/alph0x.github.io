/**
 * @fileoverview Geometry primitives — SRP: one reason to change: shape construction.
 *
 * Rationale (SOLID — SRP): Every helper builds exactly one primitive.
 * Rationale (Clean Code): Small, pure-ish functions under 5 lines.
 */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function makeBox(
  material: THREE.Material,
  size: [number, number, number],
  pos: [number, number, number]
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...pos);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

export function makePlane(
  material: THREE.Material,
  size: [number, number],
  pos: [number, number, number]
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...size), material);
  mesh.position.set(...pos);
  mesh.receiveShadow = true;
  return mesh;
}

/** Cylinder with configurable segments (default 16, PSX fallback 8). */
export function makeCylinder(
  material: THREE.Material,
  params: [number, number, number],
  pos: [number, number, number],
  segments = 16
): THREE.Mesh {
  const lp = [params[0], params[1], params[2], segments] as const;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(...lp), material);
  mesh.position.set(...pos);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

/** Cone with configurable segments (default 16, PSX fallback 8). */
export function makeCone(
  material: THREE.Material,
  params: [number, number],
  pos: [number, number, number],
  segments = 16
): THREE.Mesh {
  const lp = [params[0], params[1], segments] as const;
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(...lp), material);
  mesh.position.set(...pos);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

/** Sphere with configurable segments (default 16x12, PSX fallback 8x6). */
export function makeSphere(
  material: THREE.Material,
  params: [number],
  pos: [number, number, number],
  segments = 16
): THREE.Mesh {
  const lp = [params[0], segments, Math.max(4, Math.floor(segments * 0.75))] as const;
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(...lp), material);
  mesh.position.set(...pos);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

export function makeLight(
  color: THREE.ColorRepresentation,
  intensity: number,
  distance: number,
  pos: [number, number, number]
): THREE.PointLight {
  const light = new THREE.PointLight(color, intensity, distance, 1);
  light.position.set(...pos);
  light.castShadow = true;
  light.shadow.mapSize.width = 256;
  light.shadow.mapSize.height = 256;
  light.shadow.bias = -0.001;
  return light;
}

export function makeRoundedBox(
  material: THREE.Material,
  size: [number, number, number],
  pos: [number, number, number],
  radius = 0.05,
  segments = 2
): THREE.Mesh {
  const geo = new RoundedBoxGeometry(size[0], size[1], size[2], segments, radius);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(...pos);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
