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
  ctx.fillStyle = '#2a2a2e';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 200; i++) {
    const v = (35 + rand() * 20) | 0;
    ctx.fillStyle = `rgba(${v},${v},${v + 4},0.15)`;
    ctx.fillRect((rand() * w) | 0, (rand() * h) | 0, 2, 2);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (rand() * h) | 0);
    ctx.lineTo(w, (rand() * h) | 0);
    ctx.stroke();
  }
}, 'wall');

export const texFloor = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(98765);
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(0, 0, w, h);
  const plankH = 8;
  for (let y = 0; y < h; y += plankH) {
    const shade = (28 + rand() * 12) | 0;
    ctx.fillStyle = `rgba(${shade + 5},${shade},${shade - 2},1)`;
    ctx.fillRect(0, y, w, plankH);
    ctx.strokeStyle = 'rgba(10,8,6,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = `rgba(40,36,32,${0.1 + rand() * 0.15})`;
      ctx.fillRect((rand() * w) | 0, y + ((rand() * plankH) | 0), 1 + ((rand() * 3) | 0), 1);
    }
  }
}, 'floor');

export const texCeiling = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(77777);
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(40,38,36,${rand() * 0.15})`;
    ctx.fillRect((rand() * w) | 0, (rand() * h) | 0, 2, 2);
  }
}, 'ceiling');

export const texTerminal = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(13579);
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, w - 4, h - 4);
  ctx.strokeStyle = 'rgba(124,58,237,0.15)';
  ctx.lineWidth = 1;
  for (let i = 8; i < h; i += 8) {
    ctx.beginPath();
    ctx.moveTo(4, i);
    ctx.lineTo(w - 4, i);
    ctx.stroke();
  }
  ctx.fillStyle = '#7c3aed';
  for (let i = 12; i < h - 10; i += 6) {
    ctx.fillRect(8, i, (10 + rand() * 30) | 0, 2);
  }
}, 'terminal');

export const texWood = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(44444);
  ctx.fillStyle = '#3d2b2b';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (rand() * h) | 0);
    ctx.lineTo(w, (rand() * h) | 0);
    ctx.stroke();
  }
}, 'wood');

export const texFabric = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(24680);
  ctx.fillStyle = '#3a2a2a';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
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
    const v = (50 + rand() * 30) | 0;
    ctx.fillStyle = `rgba(${v},${v - 10},${v - 10},0.08)`;
    ctx.fillRect((rand() * w) | 0, (rand() * h) | 0, 2, 2);
  }
}, 'fabric');

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export const texMetal = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(97531);
  // happy-dom canvas does not support createLinearGradient; emulate with bands.
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    const v = t < 0.5 ? lerp(90, 122, t * 2) : lerp(122, 74, (t - 0.5) * 2);
    ctx.fillStyle = `rgb(${v | 0},${v | 0},${(v + 4) | 0})`;
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
  ctx.fillStyle = '#2a2a30';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) {
    const v = (35 + rand() * 20) | 0;
    ctx.fillStyle = `rgba(${v},${v},${v + 4},0.12)`;
    ctx.fillRect((rand() * w) | 0, (rand() * h) | 0, 2, 2);
  }
}, 'plastic');

export const texScreenGlow = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(55667);
  // happy-dom canvas does not support createRadialGradient; emulate with pixel radial fade.
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const alpha = 0.35 * Math.max(0, 1 - d / maxR);
      if (alpha > 0.01) {
        ctx.fillStyle = `rgba(124,58,237,${alpha})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(200,180,255,${0.05 + rand() * 0.1})`;
    ctx.fillRect((rand() * w) | 0, (rand() * h) | 0, 1, 1);
  }
}, 'screenGlow');

export const texConcrete = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(33445);
  ctx.fillStyle = '#3a3a3e';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) {
    const v = (50 + rand() * 40) | 0;
    ctx.fillStyle = `rgba(${v},${v},${v + 2},0.15)`;
    ctx.fillRect((rand() * w) | 0, (rand() * h) | 0, 1 + ((rand() * 2) | 0), 1);
  }
}, 'concrete');

/** Convenience map for builder consumers. */
export const TEXTURES: Record<string, THREE.CanvasTexture> = {
  wall: texWall,
  floor: texFloor,
  ceiling: texCeiling,
  terminal: texTerminal,
  wood: texWood,
  fabric: texFabric,
  metal: texMetal,
  plastic: texPlastic,
  screenGlow: texScreenGlow,
  concrete: texConcrete,
};
