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
  configureShadow(light);
  return light;
}

export function configureShadow(light: THREE.PointLight | THREE.SpotLight | THREE.DirectionalLight, size = 256): void {
  light.castShadow = true;
  light.shadow.mapSize.width = size;
  light.shadow.mapSize.height = size;
  light.shadow.bias = -0.001;
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

export interface OpeningDims {
  width: number;
  height: number;
  bottomOffset: number;
}

export function extractMeshFromResult(
  result: THREE.Mesh | THREE.Group | [THREE.Mesh | THREE.Group, unknown] | { mesh?: THREE.Mesh | THREE.Group } | null | undefined
): THREE.Mesh | THREE.Group | null {
  if (result && typeof result === 'object' && 'mesh' in result && result.mesh) return result.mesh;
  if (Array.isArray(result) && result[0]) return result[0];
  if (result instanceof THREE.Mesh || result instanceof THREE.Group) return result;
  return null;
}

export function buildPolygonShape(outline: [number, number][]): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(outline[0][0], outline[0][1]);
  for (let i = 1; i < outline.length; i++) {
    shape.lineTo(outline[i][0], outline[i][1]);
  }
  shape.closePath();
  return shape;
}

export function getClosestEdgePoint(
  point: THREE.Vector3,
  outline: [number, number][]
): { index: number; point: [number, number] } | null {
  let best: { index: number; point: [number, number] } | null = null;
  let bestDist = Infinity;
  for (let i = 0; i < outline.length; i++) {
    const p1 = new THREE.Vector3(outline[i][0], 0, outline[i][1]);
    const p2 = new THREE.Vector3(outline[(i + 1) % outline.length][0], 0, outline[(i + 1) % outline.length][1]);
    const closest = new THREE.Vector3();
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    if (len < 0.001) continue;
    dir.normalize();
    const t = Math.max(0, Math.min(len, new THREE.Vector3().subVectors(point, p1).dot(dir)));
    closest.copy(p1).add(dir.clone().multiplyScalar(t));
    const d = point.distanceTo(closest);
    if (d < bestDist) {
      bestDist = d;
      best = { index: i, point: [closest.x, closest.z] };
    }
  }
  return best && bestDist < 0.5 ? best : null;
}

export function fitMeshToPreview(mesh: THREE.Mesh | THREE.Group, targetSize = 1.2): void {
  const box = new THREE.Box3().setFromObject(mesh);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? targetSize / maxDim : 1;
  mesh.scale.setScalar(scale);
  mesh.position.sub(center.clone().multiplyScalar(scale));
  mesh.position.y += (size.y * scale) / 2;
}

/**
 * Calculate the structural bounding box of a furniture mesh for wall-opening purposes.
 * Excludes decorative/parallax children (e.g. cityscape backdrops).
 * Operates on a zeroed clone so rotation/position of the wrapper don't distort sizes.
 */
export function calculateMeshOpeningDims(mesh: THREE.Mesh | THREE.Group): OpeningDims {
  const clone = mesh.clone();
  clone.position.set(0, 0, 0);
  clone.rotation.set(0, 0, 0);
  clone.scale.set(1, 1, 1);

  const box = new THREE.Box3();

  function visit(node: THREE.Object3D): void {
    if (node.userData?._parallax) return;
    if ((node as THREE.Mesh).isMesh && (node as THREE.Mesh).geometry) {
      box.expandByObject(node);
    }
    for (const child of node.children) {
      visit(child);
    }
  }

  visit(clone);

  const size = new THREE.Vector3();
  box.getSize(size);

  return {
    width: size.x,
    height: size.y,
    bottomOffset: box.min.y,
  };
}

import type { Opening } from './editor-utils.js';

export interface PlacedItem {
  type: string;
  mesh?: THREE.Mesh | THREE.Group;
  config: {
    position: [number, number, number];
    _openingDims?: OpeningDims;
  };
}



export function getCurrentOpenings(placed: PlacedItem[]): Opening[] {
  return placed
    .filter((p) => p.type === 'door' || p.type === 'window')
    .map((p) => {
      // Always recalculate from the live mesh so stale cached values (e.g. after
      // calculateMeshOpeningDims bug fixes) do not corrupt wall geometry.
      const dims: OpeningDims | null = p.mesh ? calculateMeshOpeningDims(p.mesh) : (p.config._openingDims ?? null);
      const width = dims?.width ?? (p.type === 'door' ? 1.6 : 2.0);
      const height = dims?.height ?? (p.type === 'door' ? 2.3 : 1.3);
      const bottomOffset = dims?.bottomOffset ?? 0;
      return {
        x: p.config.position[0],
        z: p.config.position[2],
        width,
        height,
        bottom: p.config.position[1] + bottomOffset,
      };
    });
}

export function tiledTexture(tex: THREE.Texture, rx: number, ry: number): THREE.Texture {
  const t = tex.clone();
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  return t;
}

/** Dispose every geometry/material in a mesh subtree (GPU-resource cleanup on remove). */
export function disposeMesh(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else if (mat) mat.dispose();
  });
}

export function rootGroup(cfg: { position: number[]; rotation?: number }): THREE.Group {
  const g = new THREE.Group();
  const [x, y, z] = cfg.position;
  g.position.set(x, y, z);
  g.rotation.y = cfg.rotation ?? 0;
  return g;
}
