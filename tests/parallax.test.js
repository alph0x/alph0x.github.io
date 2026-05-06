/**
 * @fileoverview Tests for window parallax effect.
 */

import './setup-canvas-mock.js';
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { FurnitureRegistry } from '../docs/js/furniture/index.js';

describe('window parallax', () => {
  const { builder } = FurnitureRegistry.get('window');

  it('cityscape children have _parallax userData', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const cityscape = result.children.find((c) => c.userData._parallax);
    expect(cityscape).toBeDefined();
    expect(cityscape.userData._parallaxFactor).toBeGreaterThan(0);
  });

  it('has buildings inside cityscape group', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const cityscape = result.children.find((c) => c.userData._parallax);
    expect(cityscape.children.length).toBeGreaterThan(0);
  });
});
