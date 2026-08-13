import * as THREE from 'three';

export type TextureDrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/** Deterministic LCG. Seeded so textures are pixel-identical across reloads. */
export function rng(seed = 12345): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export function makeTexture(
  w: number,
  h: number,
  drawFn: TextureDrawFn,
  name = 'texture'
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error(`Failed to get 2d context for ${name}`);
  drawFn(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.name = name;
  return tex;
}

// ── Deterministic pixel-art texture library ─────────────────────

export const texWall = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(12345);
  ctx.fillStyle = '#f4ebda';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 200; i++) {
    const v = (215 + rand() * 25) | 0;
    ctx.fillStyle = `rgba(${v},${v - 8},${v - 24},0.18)`;
    ctx.fillRect((rand() * w) | 0, (rand() * h) | 0, 2, 2);
  }
  ctx.strokeStyle = 'rgba(120,100,70,0.06)';
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (rand() * h) | 0);
    ctx.lineTo(w, (rand() * h) | 0);
    ctx.stroke();
  }
}, 'wall');

export const texFloor = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(98765);
  ctx.fillStyle = '#a87f52';
  ctx.fillRect(0, 0, w, h);
  const plankH = 8;
  for (let y = 0; y < h; y += plankH) {
    const r = (150 + rand() * 30) | 0;
    ctx.fillStyle = `rgba(${r},${(r * 0.72) | 0},${(r * 0.45) | 0},1)`;
    ctx.fillRect(0, y, w, plankH);
    ctx.strokeStyle = 'rgba(80,55,30,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = `rgba(120,85,50,${0.12 + rand() * 0.18})`;
      ctx.fillRect((rand() * w) | 0, y + ((rand() * plankH) | 0), 1 + ((rand() * 3) | 0), 1);
    }
  }
}, 'floor');

export const texCeiling = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(77777);
  ctx.fillStyle = '#faf4e8';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(210,195,170,${rand() * 0.18})`;
    ctx.fillRect((rand() * w) | 0, (rand() * h) | 0, 2, 2);
  }
}, 'ceiling');

export const texTerminal = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(13579);
  ctx.fillStyle = '#22302a';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#8fbf9f';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, w - 4, h - 4);
  ctx.strokeStyle = 'rgba(143,191,159,0.16)';
  ctx.lineWidth = 1;
  for (let i = 8; i < h; i += 8) {
    ctx.beginPath();
    ctx.moveTo(4, i);
    ctx.lineTo(w - 4, i);
    ctx.stroke();
  }
  ctx.fillStyle = '#a9d4b4';
  for (let i = 12; i < h - 10; i += 6) {
    ctx.fillRect(8, i, (10 + rand() * 30) | 0, 2);
  }
}, 'terminal');

export const texWood = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(44444);
  ctx.fillStyle = '#8a6844';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(60,40,22,0.35)';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (rand() * h) | 0);
    ctx.lineTo(w, (rand() * h) | 0);
    ctx.stroke();
  }
}, 'wood');

export const texFabric = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(24680);
  ctx.fillStyle = '#c9b294';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(120,95,65,0.22)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 4) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  for (let i = 0; i < 80; i++) {
    const v = (190 + rand() * 30) | 0;
    ctx.fillStyle = `rgba(${v},${v - 18},${v - 45},0.1)`;
    ctx.fillRect((rand() * w) | 0, (rand() * h) | 0, 2, 2);
  }
}, 'fabric');

export const texMetal = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(97531);
  // happy-dom canvas does not support createLinearGradient; emulate with bands.
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    const v = t < 0.5 ? THREE.MathUtils.lerp(90, 122, t * 2) : THREE.MathUtils.lerp(122, 74, (t - 0.5) * 2);
    ctx.fillStyle = `rgb(${v | 0},${(v - 4) | 0},${(v - 12) | 0})`;
    ctx.fillRect(0, y, w, 1);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const y = (rand() * h) | 0;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + (rand() - 0.5) * 2);
    ctx.stroke();
  }
}, 'metal');

export const texPlastic = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(11223);
  ctx.fillStyle = '#4a443c';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) {
    const v = (70 + rand() * 25) | 0;
    ctx.fillStyle = `rgba(${v},${v - 4},${v - 12},0.14)`;
    ctx.fillRect((rand() * w) | 0, (rand() * h) | 0, 2, 2);
  }
}, 'plastic');

export const texScreenGlow = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(55667);
  // happy-dom canvas does not support createRadialGradient; emulate with pixel radial fade.
  ctx.fillStyle = '#1c1a16';
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const alpha = 0.4 * Math.max(0, 1 - d / maxR);
      if (alpha > 0.01) {
        ctx.fillStyle = `rgba(255,196,120,${alpha})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(255,230,190,${0.05 + rand() * 0.1})`;
    ctx.fillRect((rand() * w) | 0, (rand() * h) | 0, 1, 1);
  }
}, 'screenGlow');

export const texConcrete = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(33445);
  ctx.fillStyle = '#9a917f';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) {
    const v = (140 + rand() * 40) | 0;
    ctx.fillStyle = `rgba(${v},${v - 6},${v - 18},0.16)`;
    ctx.fillRect((rand() * w) | 0, (rand() * h) | 0, 1 + ((rand() * 2) | 0), 1);
  }
}, 'concrete');


