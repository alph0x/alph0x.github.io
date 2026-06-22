/**
 * @fileoverview Poster builder — registered as furniture for editor selectability.
 */

import * as THREE from 'three';
import { register } from '../registry.js';
import { COLORS } from '../../core.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildPoster(cfg) {
  const color = cfg.color ?? COLORS.accent;
  const colorHex = '#' + color.toString(16).padStart(6, '0');

  // canvas paper texture
  const c = document.createElement('canvas'); c.width = 64; c.height = 90;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#111114'; ctx.fillRect(0, 0, 64, 90);
  ctx.strokeStyle = colorHex; ctx.lineWidth = 2; ctx.strokeRect(2, 2, 60, 86);
  ctx.fillStyle = colorHex; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
  (cfg.text || 'POSTER').split('\n').forEach((line, i) => ctx.fillText(line, 32, 20 + i * 14));
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

  const paperMat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0.9, side: THREE.DoubleSide, roughness: 0.8 });
  const paper = new THREE.Mesh(paperGeo, paperMat);

  // thin frame border
  const frameMat = makeStd({ color: 0x1a1a1e, roughness: 0.5, metalness: 0.1 });
  const frameW = 0.02, frameD = 0.02;
  const top = makeBox(frameMat, [0.54, frameW, frameD], [0, 0.36, -0.02]);
  const bottom = makeBox(frameMat, [0.54, frameW, frameD], [0, -0.36, -0.02]);
  const left = makeBox(frameMat, [frameW, 0.74, frameD], [-0.27, 0, -0.02]);
  const right = makeBox(frameMat, [frameW, 0.74, frameD], [0.27, 0, -0.02]);
  paper.add(top, bottom, left, right);

  return { mesh: paper };
}

register('poster', buildPoster);
