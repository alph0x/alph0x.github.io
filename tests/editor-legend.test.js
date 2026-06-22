/**
 * @fileoverview Tests for editor keyboard legend toggle.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { InteractionManager } from '../docs/js/editor-modules/interaction-manager.js';
import { EditorState } from '../docs/js/editor-modules/state.js';

function keyEvent(code, key, target = document.body) {
  const ev = new KeyboardEvent('keydown', { code, key, bubbles: true });
  Object.defineProperty(ev, 'target', { value: target, enumerable: true });
  return ev;
}

describe('Editor legend overlay', () => {
  let im;

  beforeEach(() => {
    document.body.innerHTML = '<div id="legend" class="legend-overlay"></div>';
    const state = new EditorState();
    const renderer = { domElement: document.createElement('canvas') };
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    const floorPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshBasicMaterial()
    );
    im = new InteractionManager({
      renderer,
      camera,
      state,
      floorPlane,
      furnitureManager: { rotateSelected() {}, deleteSelected() {}, undo() {}, redo() {} },
      outlineEditor: { onDeleteKey() {} },
      spawnManager: { _group: new THREE.Group() },
      roomBuilder: {},
      config: { wallH: 2.8 },
      snap: (v) => Math.round(v / 0.05) * 0.05,
    });
  });

  it('toggles the legend on H', () => {
    const legend = document.getElementById('legend');
    expect(legend.classList.contains('active')).toBe(false);

    im.onKeyDown(keyEvent('KeyH', 'h'));
    expect(legend.classList.contains('active')).toBe(true);

    im.onKeyDown(keyEvent('KeyH', 'h'));
    expect(legend.classList.contains('active')).toBe(false);
  });

  it('toggles the legend on Slash (?)', () => {
    const legend = document.getElementById('legend');
    im.onKeyDown(keyEvent('Slash', '/'));
    expect(legend.classList.contains('active')).toBe(true);
  });

  it('closes the legend with Escape', () => {
    const legend = document.getElementById('legend');
    im.onKeyDown(keyEvent('KeyH', 'h'));
    expect(legend.classList.contains('active')).toBe(true);

    im.onKeyDown(keyEvent('Escape', 'Escape'));
    expect(legend.classList.contains('active')).toBe(false);
  });

  it('does not toggle legend while typing in an input', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    const legend = document.getElementById('legend');

    im.onKeyDown(keyEvent('KeyH', 'h', input));
    expect(legend.classList.contains('active')).toBe(false);
  });
});
