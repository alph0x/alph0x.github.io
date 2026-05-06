/**
 * @fileoverview Tests for PreviewManager isolated preview viewport.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import '../docs/js/furniture/index.js';
import { PreviewManager } from '../docs/js/editor-modules/preview-manager.js';

describe('PreviewManager', () => {
  let manager;
  const config = {
    size: 160,
    targetMeshSize: 1.2,
    rotationSpeed: 0.015,
    cameraPos: new THREE.Vector3(1.5, 1.2, 1.5),
    lookAt: new THREE.Vector3(0, 0.3, 0),
  };

  beforeEach(() => {
    const container = document.createElement('div');
    container.innerHTML = '<div class="preview-label"></div>';
    const mockRenderer = {
      render: () => {},
      setSize: () => {},
      setPixelRatio: () => {},
      domElement: document.createElement('canvas'),
    };
    manager = new PreviewManager(config, container, mockRenderer);
  });

  it('initializes scene, camera, and renderer', () => {
    manager.init();
    expect(manager._scene).toBeInstanceOf(THREE.Scene);
    expect(manager._camera).toBeInstanceOf(THREE.PerspectiveCamera);
    expect(manager._renderer).toBeDefined();
    expect(manager._group).toBeInstanceOf(THREE.Group);
  });

  it('shows a preview mesh for known furniture type', () => {
    manager.init();
    manager.show('bed');
    expect(manager._mesh).toBeDefined();
    expect(manager._group.children.length).toBeGreaterThan(0);
  });

  it('returns null mesh for unknown type', () => {
    manager.init();
    manager.show('nonexistent');
    expect(manager._mesh).toBeNull();
  });

  it('clears previous mesh on show', () => {
    manager.init();
    manager.show('bed');
    const firstMesh = manager._mesh;
    manager.show('desk');
    expect(manager._mesh).not.toBe(firstMesh);
  });

  it('clear removes mesh and hides container', () => {
    manager.init();
    manager.show('bed');
    manager.clear();
    expect(manager._mesh).toBeNull();
    expect(manager._group.children.length).toBe(0);
  });

  it('tick rotates mesh', () => {
    manager.init();
    manager.show('bed');
    const before = manager._mesh.rotation.y;
    manager.tick();
    expect(manager._mesh.rotation.y).toBeGreaterThan(before);
  });

  it('updates label text on show', () => {
    manager.init();
    manager.show('tv');
    expect(manager._labelEl.textContent).toBe('tv');
  });
});
