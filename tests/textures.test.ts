/**
 * @fileoverview Texture determinism + frozen export contract.
 * Fallback form (P-05 briefing / plan.md §7): happy-dom has no real canvas 2D
 * (tests/setup-canvas-mock.js stubs no-ops), so pixel-output comparison is
 * impossible. Ships rng-sequence determinism + export shape instead.
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import * as textures from '../docs/js/assets/textures.js';
import { rng } from '../docs/js/assets/textures.js';

describe('rng determinism', () => {
  it('same seed produces an identical sequence (N=1000)', () => {
    const a = rng(12345);
    const b = rng(12345);
    for (let i = 0; i < 1000; i++) expect(a()).toBe(b());
  });

  it('default seed is deterministic across runs', () => {
    const a = rng();
    const b = rng();
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it('different seeds diverge', () => {
    const a = rng(1);
    const b = rng(2);
    const seqA = Array.from({ length: 100 }, () => a());
    const seqB = Array.from({ length: 100 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });
});

describe('texture exports', () => {
  const expected = [
    'texCeiling',
    'texTerminal',
    'texWood',
    'texMetal',
    'texPlastic',
    'texScreenGlow',
    'texConcrete',
  ];

  it('exports exactly the 7 frozen tex* textures', () => {
    const texExports = Object.keys(textures).filter((k) => k.startsWith('tex'));
    expect(texExports.sort()).toEqual([...expected].sort());
  });

  it.each(expected)('%s is a 64x64 SRGB NearestFilter CanvasTexture', (name) => {
    const tex = (textures as Record<string, unknown>)[name] as THREE.CanvasTexture;
    expect(tex).toBeInstanceOf(THREE.CanvasTexture);
    expect(tex.image.width).toBe(64);
    expect(tex.image.height).toBe(64);
    expect(tex.magFilter).toBe(THREE.NearestFilter);
    expect(tex.minFilter).toBe(THREE.NearestFilter);
    expect(tex.colorSpace).toBe(THREE.SRGBColorSpace);
  });
});
