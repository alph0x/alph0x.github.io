import * as THREE from 'three';

function makeTexture(
  w: number,
  h: number,
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  drawFn(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

export const texWall = makeTexture(64, 64, (ctx, w, h) => {
  ctx.fillStyle = '#2a2a2e'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 200; i++) {
    const v = 35 + (Math.random() * 20) | 0;
    ctx.fillStyle = `rgba(${v},${v},${v + 4},0.15)`;
    ctx.fillRect((Math.random() * w) | 0, (Math.random() * h) | 0, 2, 2);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(0, (Math.random() * h) | 0); ctx.lineTo(w, (Math.random() * h) | 0); ctx.stroke(); }
});

export const texFloor = makeTexture(64, 64, (ctx, w, h) => {
  ctx.fillStyle = '#1c1917'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) {
    const v = (35 + Math.random() * 15) | 0;
    ctx.fillStyle = `rgba(${v + 5},${v},${v - 2},0.2)`;
    ctx.fillRect((Math.random() * w) | 0, (Math.random() * h) | 0, 1 + (Math.random() * 3) | 0, 1 + (Math.random() * 3) | 0);
  }
  ctx.strokeStyle = 'rgba(20,18,16,0.3)'; ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(0, (Math.random() * h) | 0); ctx.lineTo(w, (Math.random() * h) | 0); ctx.stroke();
  }
});

export const texCeiling = makeTexture(64, 64, (ctx, w, h) => {
  ctx.fillStyle = '#1c1917'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(40,38,36,${Math.random() * 0.15})`; ctx.fillRect((Math.random() * w) | 0, (Math.random() * h) | 0, 2, 2); }
});

export const texTerminal = makeTexture(64, 64, (ctx, w, h) => {
  ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2; ctx.strokeRect(2, 2, w - 4, h - 4);
  ctx.strokeStyle = 'rgba(124,58,237,0.15)'; ctx.lineWidth = 1;
  for (let i = 8; i < h; i += 8) { ctx.beginPath(); ctx.moveTo(4, i); ctx.lineTo(w - 4, i); ctx.stroke(); }
  ctx.fillStyle = '#7c3aed';
  for (let i = 12; i < h - 10; i += 6) ctx.fillRect(8, i, (10 + Math.random() * 30) | 0, 2);
});

export const texWood = makeTexture(64, 64, (ctx, w, h) => {
  ctx.fillStyle = '#3d2b2b'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(0, (Math.random() * h) | 0); ctx.lineTo(w, (Math.random() * h) | 0); ctx.stroke(); }
});
