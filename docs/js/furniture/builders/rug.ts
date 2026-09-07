import * as THREE from 'three';
import { rootGroup } from '../../primitives.js';
import { register } from '../registry.js';
import { makeStd, texFabric } from '../../assets/index.js';
import type { FurnitureConfig } from '../../seed.js';

function buildRug(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const material = makeStd({ color: 0xffffff, map: texFabric, roughness: 1 });
  material.vertexColors = true;
  material.flatShading = false;
  const geometry = new THREE.PlaneGeometry(2.5, 1.8, 80, 56);
  const positions = geometry.getAttribute('position');
  const colors: number[] = [];
  const field = new THREE.Color(0xb98d63), border = new THREE.Color(0x9a6f4a), thread = new THREE.Color(0xd9b98a);
  for (let i = 0; i < positions.count; i++) {
    const x = Math.abs(positions.getX(i)), y = Math.abs(positions.getY(i));
    const edge = Math.min(1.25 - x, 0.9 - y);
    const band = edge > 0.08 && edge < 0.2;
    const diamond = x / 0.65 + y / 0.35;
    const color = (band ? border : diamond < 1 ? thread : field).clone();
    color.multiplyScalar(0.975 + 0.025 * Math.cos(positions.getX(i) * 180));
    colors.push(color.r, color.g, color.b);
    // Bound edge rolls down into the floor; every colored region shares this sheet.
    positions.setZ(i, 0.003 * Math.min(1, Math.max(0, edge) / 0.025));
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const rug = new THREE.Mesh(geometry, material);
  rug.receiveShadow = true;
  g.add(rug);
  g.rotation.x = -Math.PI / 2;
  return { mesh: g };
}
register('rug', buildRug);
