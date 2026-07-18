/**
 * @fileoverview Tests for ScreenReflections — render-target passes for glossy screens.
 * Drives the system directly with a real scene + mock renderer, asserting
 * renderer.render call counts instead of private internals.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { ScreenReflections } from '../docs/js/systems/screen-reflections.js';

function createMockRenderer() {
  return {
    setRenderTarget: vi.fn(),
    getRenderTarget: vi.fn(() => null),
    render: vi.fn(),
  };
}

function createScreenScene() {
  const scene = new THREE.Scene();
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const tex = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex }));
  mesh.name = 'screen';
  scene.add(mesh);
  return { scene, mesh, tex };
}

describe('Screen reflections', () => {
  let renderer;
  let scene;
  let mesh;
  let tex;
  let reflections;

  beforeEach(() => {
    renderer = createMockRenderer();
    ({ scene, mesh, tex } = createScreenScene());
    reflections = new ScreenReflections(scene, renderer);
  });

  it('swaps canvas-textured screen materials to reflection targets on init', () => {
    reflections.init();
    expect(reflections.lowEnd).toBe(false);
    // Material now samples a render-target texture, not the original canvas
    expect(mesh.material.map).toBeInstanceOf(THREE.Texture);
    expect(mesh.material.map).not.toBe(tex);
  });

  it('renders one reflection pass per screen and restores the render target', () => {
    reflections.init();
    reflections.frameInterval = 1; // render on every update
    reflections.update();
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledWith(scene, expect.any(THREE.PerspectiveCamera));
    expect(renderer.setRenderTarget).toHaveBeenLastCalledWith(null);
  });

  it('skips frames between reflection passes', () => {
    reflections.init();
    reflections.frameInterval = 3;
    reflections.update();
    reflections.update();
    expect(renderer.render).not.toHaveBeenCalled();
    reflections.update();
    expect(renderer.render).toHaveBeenCalledTimes(1);
  });

  it('renders nothing on low-end devices', () => {
    reflections.init();
    reflections.lowEnd = true;
    reflections.frameInterval = 1;
    reflections.update();
    expect(renderer.render).not.toHaveBeenCalled();
    expect(renderer.setRenderTarget).not.toHaveBeenCalled();
  });
});
