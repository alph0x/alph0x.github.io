import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

// Warm, deterministic stack — sizes fixed so it doesn't reshuffle per load.
const STACK: [number, number, number, number, number][] = [
  // w, h, l, color, yaw
  [0.2, 0.035, 0.26, 0xa85238, 0.06],
  [0.18, 0.03, 0.24, 0x6a994e, -0.05],
  [0.19, 0.028, 0.25, 0xe9c46a, 0.03],
  [0.17, 0.032, 0.23, 0x264653, -0.04],
  [0.18, 0.026, 0.24, 0xc97e63, 0.08],
];

function buildBookStack(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const n = Math.min(cfg.count || 3, STACK.length);
  const pages = makeStd({ color: 0xe5dbc5, roughness: 1 });
  let y = 0;
  for (let i = 0; i < n; i++) {
    const [bw, bh, bl, color, yaw] = STACK[i];
    const book = new THREE.Group();
    book.position.y = y + bh / 2;
    const pieces = [
      new THREE.BoxGeometry(bw, 0.003, bl).translate(0, (bh - 0.003) / 2, 0),
      new THREE.BoxGeometry(bw, 0.003, bl).translate(0, -(bh - 0.003) / 2, 0),
      new THREE.BoxGeometry(0.006, bh, bl).translate(-(bw - 0.006) / 2, 0, 0),
    ];
    const binding = new THREE.Mesh(mergeGeometries(pieces), makeStd({ color, roughness: 0.85 }));
    pieces.forEach(piece => piece.dispose());
    binding.castShadow = binding.receiveShadow = true;
    book.add(binding, makeBox(pages, [bw - 0.012, bh - 0.006, bl - 0.008], [0.001, 0, 0]));
    book.rotation.y = yaw;
    g.add(book);
    y += bh;
  }
  return { mesh: g };
}
register('bookStack', buildBookStack);
