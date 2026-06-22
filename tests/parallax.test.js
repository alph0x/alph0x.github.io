/**
 * @fileoverview Tests for window parallax effect.
 */


import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { FurnitureRegistry } from '../docs/js/furniture/index.js';

describe('window parallax', () => {
  const { builder } = FurnitureRegistry.get('window');

  it('cityscape children have _parallax userData', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const cityscape = result.mesh.children.find((c) => c.userData._parallax);
    expect(cityscape).toBeDefined();
    const layers = cityscape.children.filter((c) => c.userData._parallax);
    expect(layers.some((l) => l.userData._parallaxFactor > 0)).toBe(true);
  });

  it('has buildings inside cityscape group', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const cityscape = result.mesh.children.find((c) => c.userData._parallax);
    expect(cityscape.children.length).toBeGreaterThan(0);
  });

  it('has multiple parallax depth layers', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const cityscape = result.mesh.children.find((c) => c.userData._parallax);
    const layers = cityscape.children.filter((c) => c.userData._parallax);
    expect(layers.length).toBeGreaterThan(1);
    const factors = layers.map((l) => l.userData._parallaxFactor);
    expect(new Set(factors).size).toBeGreaterThan(1);
  });

  it('produces deterministic cityscapes for the same seed', () => {
    const resultA = builder({ position: [0, 0, 0], rotation: 0 });
    const resultB = builder({ position: [0, 0, 0], rotation: 0 });
    const cityscapeA = resultA.mesh.children.find((c) => c.userData._parallax);
    const cityscapeB = resultB.mesh.children.find((c) => c.userData._parallax);
    const layersA = cityscapeA.children.filter((c) => c.userData._parallax);
    const layersB = cityscapeB.children.filter((c) => c.userData._parallax);
    expect(layersA.length).toBe(layersB.length);
    for (let i = 0; i < layersA.length; i++) {
      expect(layersA[i].children.length).toBe(layersB[i].children.length);
      for (let j = 0; j < layersA[i].children.length; j++) {
        expect(layersA[i].children[j].position.x).toBeCloseTo(layersB[i].children[j].position.x, 6);
        expect(layersA[i].children[j].position.y).toBeCloseTo(layersB[i].children[j].position.y, 6);
        expect(layersA[i].children[j].position.z).toBeCloseTo(layersB[i].children[j].position.z, 6);
      }
    }
  });
});
