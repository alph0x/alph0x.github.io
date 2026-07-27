import * as THREE from 'three';

type TextureDrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

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

// ── Deterministic painterly texture library ─────────────────────

const P = {
  paperWhite: '#f4ecd8',
  plasterCream: '#e6dbc2',
  woodHoney: '#b98a52',
  metalSoft: '#98a2a6',
  shadowLavender: '#7c7fa0',
  sunlightWarm: '#ffd9a0',
  skyFillBlue: '#9fc8e0',
  nightIndigo: '#333f63',
  sheikahTeal: '#3ec8ae',
  void: '#0c0a09',
} as const;

const mix = (a: string, b: string, t: number): string =>
  new THREE.Color(a).lerp(new THREE.Color(b), t).getStyle();

export const texCeiling = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(77777);
  ctx.fillStyle = P.plasterCream;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = mix(P.plasterCream, rand() > 0.5 ? P.paperWhite : P.shadowLavender, 0.12 + rand() * 0.2);
    ctx.fillRect((rand() * w) | 0, (rand() * h) | 0, 8 + ((rand() * 18) | 0), 4 + ((rand() * 10) | 0));
  }
}, 'ceiling');

export const texTerminal = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(13579);
  const coolWhite = mix(P.paperWhite, P.skyFillBlue, 0.5);
  ctx.fillStyle = P.nightIndigo;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = mix(P.nightIndigo, P.void, 0.15 + rand() * 0.2);
    ctx.fillRect((rand() * w) | 0, (rand() * h) | 0, 10 + ((rand() * 20) | 0), 4 + ((rand() * 8) | 0));
  }
  ctx.strokeStyle = coolWhite;
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, w - 4, h - 4);
  for (let i = 12; i < h - 10; i += 6) {
    ctx.fillStyle = i % 18 === 0 ? P.sheikahTeal : coolWhite;
    ctx.fillRect(8, i, (10 + rand() * 30) | 0, 2);
  }
}, 'terminal');

export const texWood = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(44444);
  ctx.fillStyle = P.woodHoney;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = mix(P.woodHoney, rand() > 0.5 ? P.sunlightWarm : P.shadowLavender, 0.1 + rand() * 0.15);
    ctx.fillRect(0, (rand() * h) | 0, w, 4 + ((rand() * 8) | 0));
  }
  const grainDark = mix(P.woodHoney, P.void, 0.45);
  const grainLight = mix(P.woodHoney, P.sunlightWarm, 0.5);
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = rand() > 0.3 ? grainDark : grainLight;
    ctx.fillRect((rand() * w * 0.4) | 0, (rand() * h) | 0, (w * 0.5 + rand() * w * 0.5) | 0, 1 + ((rand() * 2) | 0));
  }
}, 'wood');

export const texMetal = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(97531);
  // ponytail: banded sheen — happy-dom canvas has no createLinearGradient
  for (let y = 0; y < h; y++) {
    const sheen = 1 - Math.abs(y / (h - 1) - 0.35) / 0.65;
    ctx.fillStyle = sheen > 0.55
      ? mix(P.metalSoft, P.paperWhite, (sheen - 0.55) * 0.9)
      : mix(P.metalSoft, P.shadowLavender, (0.55 - sheen) * 0.35);
    ctx.fillRect(0, y, w, 1);
  }
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = mix(P.metalSoft, rand() > 0.5 ? P.paperWhite : P.shadowLavender, 0.08 + rand() * 0.12);
    ctx.fillRect(0, (rand() * h) | 0, w, 1);
  }
}, 'metal');

export const texPlastic = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(11223);
  const base = mix(P.metalSoft, P.plasterCream, 0.35);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = mix(base, rand() > 0.5 ? P.paperWhite : P.shadowLavender, 0.08 + rand() * 0.12);
    ctx.fillRect((rand() * w) | 0, (rand() * h) | 0, 6 + ((rand() * 14) | 0), 3 + ((rand() * 7) | 0));
  }
}, 'plastic');

export const texScreenGlow = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(55667);
  const coolWhite = mix(P.paperWhite, P.skyFillBlue, 0.55);
  ctx.fillStyle = P.nightIndigo;
  ctx.fillRect(0, 0, w, h);
  // ponytail: stepped rings — happy-dom canvas has no createRadialGradient
  for (let inset = 0; inset < 28; inset += 4) {
    const t = inset / 28;
    ctx.fillStyle = mix(P.nightIndigo, coolWhite, t * t * 0.9 + 0.08 + (rand() - 0.5) * 0.05);
    ctx.fillRect(inset, inset, w - inset * 2, h - inset * 2);
  }
}, 'screenGlow');

export const texConcrete = makeTexture(64, 64, (ctx, w, h) => {
  const rand = rng(33445);
  ctx.fillStyle = P.metalSoft;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = mix(P.metalSoft, rand() > 0.45 ? P.shadowLavender : P.plasterCream, 0.1 + rand() * 0.18);
    ctx.fillRect((rand() * w) | 0, (rand() * h) | 0, 5 + ((rand() * 13) | 0), 3 + ((rand() * 8) | 0));
  }
}, 'concrete');


