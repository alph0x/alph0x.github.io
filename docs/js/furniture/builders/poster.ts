/**
 * @fileoverview Poster builder — registered as furniture for editor selectability.
 */

import * as THREE from 'three';
import { register } from '../registry.js';
import { COLORS } from '../../core.js';
import { makeStd, texWood } from '../../assets/index.js';
import { makeRoundedBox } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildPoster(cfg: FurnitureConfig): { mesh: THREE.Mesh } {
  const color = cfg.color ?? COLORS.accent;
  const text = cfg.text || 'POSTER';

  // deterministic canvas texture — only rect fills and text, no gradients or arcs
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 720;
  const ctx = c.getContext('2d')!;
  const hex = '#' + color.toString(16).padStart(6, '0');
  // warm paper print, not a neon club flyer
  ctx.fillStyle = '#f5f0e1';
  ctx.fillRect(0, 0, 512, 720);
  ctx.fillStyle = hex;
  ctx.fillRect(48, 48, 416, 64);
  ctx.fillRect(48, 608, 416, 64);
  ctx.strokeStyle = hex;
  ctx.lineWidth = 12;
  ctx.strokeRect(24, 24, 464, 672);
  ctx.fillStyle = '#264653';
  ctx.font = 'bold 88px Georgia, serif';
  ctx.textAlign = 'center';
  text.split('\n').forEach((line, i) => ctx.fillText(line, 256, 240 + i * 120, 416));

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const paperGeo = new THREE.PlaneGeometry(0.52, 0.72, 8, 8);
  const pos = paperGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    // slight outward curve along X
    pos.setZ(i, 0.072 - 0.002 * (x / 0.26) ** 2);
  }
  paperGeo.computeVertexNormals();

  const paperMat = makeStd({
    map: tex,
    transparent: false,
    side: THREE.DoubleSide,
    roughness: 0.8,
  });
  paperMat.flatShading = false;
  const paper = new THREE.Mesh(paperGeo, paperMat);

  // wooden frame border
  const frameMat = makeStd({ map: texWood, color: 0x3a2a20, roughness: 0.75 });
  frameMat.flatShading = false;
  const frameW = 0.02;
  const frameD = 0.02;
  paper.add(makeRoundedBox(frameMat, [0.54, frameW, frameD], [0, 0.36, 0.07], 0.004, 2));
  paper.add(makeRoundedBox(frameMat, [0.54, frameW, frameD], [0, -0.36, 0.07], 0.004, 2));
  paper.add(makeRoundedBox(frameMat, [frameW, 0.74, frameD], [-0.27, 0, 0.07], 0.004, 2));
  paper.add(makeRoundedBox(frameMat, [frameW, 0.74, frameD], [0.27, 0, 0.07], 0.004, 2));

  return { mesh: paper };
}

register('poster', buildPoster);
