/**
 * @fileoverview P-13: the glow.ts helpers preserve the exact contracts
 * level/lighting.ts applyTimeOfDay consumes — boosted screen glow, hex-number
 * _emissiveBase, HDR Color _pcLed (never hex-clamped).
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeScreenGlow, tagEmissiveBase, makePcLedGlow } from '../docs/js/furniture/glow.js';
import { texScreenGlow } from '../docs/js/assets/index.js';

describe('furniture glow helpers', () => {
  it('makeScreenGlow returns a basic material boosted past bloom threshold', () => {
    const mat = makeScreenGlow();
    expect(mat).toBeInstanceOf(THREE.MeshBasicMaterial);
    expect(mat.map).toBe(texScreenGlow);
    expect(mat.color.r).toBeCloseTo(4); // white × 4, crosses the 0.85 bloom threshold
  });

  it('tagEmissiveBase writes the material color as a hex number', () => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xfef3c7 }),
    );
    tagEmissiveBase(mesh);
    expect(mesh.userData._emissiveBase).toBe(0xfef3c7);
    expect(typeof mesh.userData._emissiveBase).toBe('number'); // lighting.ts setHex contract
  });

  it('makePcLedGlow clones and HDR-boosts without hex clamping', () => {
    const base = new THREE.MeshBasicMaterial({ color: 0xf0f0f0 });
    const led = makePcLedGlow(base);
    expect(led).not.toBe(base); // clone — registry material untouched
    expect(led.color.r).toBeCloseTo(base.color.r * 2.5);
    expect(led.color.r).toBeGreaterThan(1); // HDR survives (lighting.ts:125)
  });
});
