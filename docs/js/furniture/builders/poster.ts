/**
 * @fileoverview Poster builder — registered as furniture for editor selectability.
 */

import * as THREE from 'three';
import { register } from '../registry.js';
import { COLORS } from '../../core.js';
import { makeStd, texWood } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildPoster(cfg: FurnitureConfig): { mesh: THREE.Mesh } {
  const color = cfg.color ?? COLORS.accent;
  const text = cfg.text || 'POSTER';

  // deterministic canvas texture — only rect fills and text, no gradients or arcs
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 90;
  const ctx = c.getContext('2d')!;
  const hex = '#' + color.toString(16).padStart(6, '0');
  ctx.fillStyle = '#111114';
  ctx.fillRect(0, 0, 64, 90);
  ctx.fillStyle = hex;
  ctx.fillRect(4, 4, 56, 10);
  ctx.fillRect(4, 76, 56, 10);
  ctx.strokeStyle = hex;
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 60, 86);
  ctx.fillStyle = hex;
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  text.split('\n').forEach((line, i) => ctx.fillText(line, 32, 28 + i * 14));

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const paperGeo = new THREE.PlaneGeometry(0.5, 0.7, 8, 8);
  const pos = paperGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    // slight outward curve along X
    pos.setZ(i, -0.04 * (x / 0.25) ** 2);
  }
  paperGeo.computeVertexNormals();

  const paperMat = makeStd({
    map: tex,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
    roughness: 0.8,
  });
  const paper = new THREE.Mesh(paperGeo, paperMat);

  // wooden frame border
  const frameMat = makeStd({ map: texWood, color: 0x3a2a20, roughness: 0.75 });
  const frameW = 0.02;
  const frameD = 0.02;
  paper.add(makeBox(frameMat, [0.54, frameW, frameD], [0, 0.36, -0.02]));
  paper.add(makeBox(frameMat, [0.54, frameW, frameD], [0, -0.36, -0.02]));
  paper.add(makeBox(frameMat, [frameW, 0.74, frameD], [-0.27, 0, -0.02]));
  paper.add(makeBox(frameMat, [frameW, 0.74, frameD], [0.27, 0, -0.02]));

  return { mesh: paper };
}

register('poster', buildPoster);
