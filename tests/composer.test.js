/**
 * @fileoverview Tests for the render composer pipeline and game render dispatch.
 * Composer is driven with a mock WebGLRenderer (no GL needed at construction);
 * game render path is asserted via composer.render vs renderer.render counts.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { buildComposer } from '../docs/js/renderer/composer.js';
import { Game } from '../docs/js/game.js';
import { createWorldState } from '../docs/js/domain/world-state.js';

function mockRenderer() {
  return {
    render: vi.fn(),
    setSize: vi.fn(),
    setRenderTarget: vi.fn(),
    getPixelRatio: () => 1,
    getSize: (v) => v.set(800, 600),
  };
}

function makeGame() {
  const worldState = createWorldState({ playerSpawn: [0.5, 0.5], playerHeight: 1.7 });
  return new Game({
    renderer: mockRenderer(),
    scene: { traverse: vi.fn() },
    camera: new THREE.PerspectiveCamera(),
    controls: { isLocked: false, lock: vi.fn(), unlock: vi.fn(), addEventListener: vi.fn() },
    worldState,
    touchControls: null,
  });
}

describe('buildComposer', () => {
  it('chains render → bloom → SSAO → output → grade passes', () => {
    const composer = buildComposer(mockRenderer(), new THREE.Scene(), new THREE.PerspectiveCamera());
    expect(composer).toBeInstanceOf(EffectComposer);
    const kinds = composer.passes.map((p) => p.constructor);
    expect(kinds).toEqual([RenderPass, UnrealBloomPass, SSAOPass, OutputPass, ShaderPass]);
  });

  it('uses conservative threshold-driven bloom', () => {
    const composer = buildComposer(mockRenderer(), new THREE.Scene(), new THREE.PerspectiveCamera());
    const bloom = composer.passes.find((p) => p instanceof UnrealBloomPass);
    expect(bloom.threshold).toBeCloseTo(0.85);
    expect(bloom.strength).toBeCloseTo(0.4);
    expect(bloom.radius).toBeCloseTo(0.3);
  });
});

describe('Game render dispatch', () => {
  let savedMatchMedia;

  beforeEach(() => {
    savedMatchMedia = window.matchMedia;
  });
  afterEach(() => {
    window.matchMedia = savedMatchMedia;
  });

  it('builds a composer at default quality and renders through it', () => {
    const game = makeGame();
    expect(game.composer).not.toBeNull();
    game.composer.render = vi.fn();
    game.animate();
    expect(game.composer.render).toHaveBeenCalledTimes(1);
    expect(game.renderer.render).not.toHaveBeenCalled();
  });

  it('low-end devices bypass the composer with a plain render', () => {
    window.matchMedia = vi.fn(() => ({ matches: true, addEventListener: vi.fn() }));
    const game = makeGame();
    expect(game.composer).toBeNull();
    game.animate();
    expect(game.renderer.render).toHaveBeenCalledTimes(1);
  });

  it('resizes the composer with the window', () => {
    const game = makeGame();
    game.composer.setSize = vi.fn();
    game.onResize();
    expect(game.composer.setSize).toHaveBeenCalledWith(window.innerWidth, window.innerHeight);
  });
});
