import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { InteractionSystem } from '../docs/js/systems/interaction.js';

describe('InteractionSystem panels', () => {
  let worldState;
  let controls;
  let system;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="crosshair" style="display:block"></div>
      <div id="panel-profile" class="info-panel active"></div>
      <button class="panel-close">[ CLOSE ]</button>
      <canvas id="game-canvas"></canvas>
    `;
    worldState = { ui: { isPanelOpen: true }, room: { interactables: [] } };
    controls = { lock: vi.fn(), unlock: vi.fn() };
    system = new InteractionSystem({ camera: {}, worldState, controls });
  });

  it('closes all panels and restores crosshair on closePanels', () => {
    system.closePanels();
    expect(worldState.ui.isPanelOpen).toBe(false);
    expect(document.querySelectorAll('.info-panel.active').length).toBe(0);
    expect(document.getElementById('crosshair').style.display).toBe('block');
    expect(controls.lock).toHaveBeenCalledOnce();
  });

  it('leaves no active panels after closePanels', () => {
    worldState.ui.isPanelOpen = false;
    document.querySelectorAll('.info-panel').forEach((p) => p.classList.add('active'));
    system.closePanels();
    expect(document.querySelectorAll('.info-panel.active').length).toBe(0);
  });

  it('opens a panel by id and hides crosshair', () => {
    system.closePanels();
    system.openPanel('panel-profile');
    expect(worldState.ui.isPanelOpen).toBe(true);
    expect(document.getElementById('panel-profile').classList.contains('active')).toBe(true);
    expect(document.getElementById('crosshair').style.display).toBe('none');
    expect(controls.unlock).toHaveBeenCalledOnce();
  });

  it('shows furniture label in prompt on hover', () => {
    document.body.innerHTML = '<div id="prompt"></div>';
    const camera = new THREE.PerspectiveCamera();
    const worldState = { ui: { isPanelOpen: false }, room: { interactables: [] } };
    const system = new InteractionSystem({ camera, worldState, controls });

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    mesh.position.set(0, 0, -2);
    mesh.updateMatrixWorld();
    worldState.room.interactables.push({ mesh, type: 'testType', panelId: 'panel-test', name: 'Test Label' });

    system.updatePrompt();
    const prompt = document.getElementById('prompt');
    expect(prompt.textContent).toBe('[E] Test Label');
    expect(prompt.classList.contains('active')).toBe(true);
  });

  it('falls back to type in prompt when label is missing', () => {
    document.body.innerHTML = '<div id="prompt"></div>';
    const camera = new THREE.PerspectiveCamera();
    const worldState = { ui: { isPanelOpen: false }, room: { interactables: [] } };
    const system = new InteractionSystem({ camera, worldState, controls });

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    mesh.position.set(0, 0, -2);
    mesh.updateMatrixWorld();
    worldState.room.interactables.push({ mesh, type: 'boxType', panelId: 'panel-box', name: '' });

    system.updatePrompt();
    const prompt = document.getElementById('prompt');
    expect(prompt.textContent).toBe('[E] boxType');
    expect(prompt.classList.contains('active')).toBe(true);
  });

  it('keeps crosshair hidden while any panel is open', () => {
    system.openPanel('panel-profile');
    expect(document.getElementById('crosshair').style.display).toBe('none');
  });
});

describe('Game click-outside-to-close wiring', () => {
  it('closes open panels when clicking outside panel and canvas', () => {
    document.body.innerHTML = `
      <div id="crosshair" style="display:none"></div>
      <div id="panel-profile" class="info-panel active"></div>
      <div id="outside"></div>
      <canvas id="game-canvas"></canvas>
    `;
    const worldState = { ui: { isPanelOpen: true }, room: { interactables: [] } };
    const controls = { lock: () => {}, unlock: () => {} };
    const system = new InteractionSystem({ camera: {}, worldState, controls });

    // Simulate the game.js document click handler logic
    const outside = document.getElementById('outside');
    if (worldState.ui.isPanelOpen && !outside.closest('.info-panel') && outside.tagName !== 'CANVAS') {
      system.closePanels();
    }

    expect(worldState.ui.isPanelOpen).toBe(false);
    expect(document.querySelectorAll('.info-panel.active').length).toBe(0);
  });
});

describe('nested mesh hierarchies (GLB models)', () => {
  it('prompt and interact resolve interactables through deep ancestors', () => {
    document.body.innerHTML = '<div id="prompt"></div><div id="panel-deep" class="info-panel"></div><div id="crosshair"></div>';
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, -2);
    camera.updateMatrixWorld(true);
    const worldState = { ui: { isPanelOpen: false }, room: { interactables: [] } };
    const controls = { lock: () => {}, unlock: () => {} };
    const system = new InteractionSystem({ camera, worldState, controls });

    // Mimic a GLB: root group > intermediate group > mesh (depth 2).
    const root = new THREE.Group();
    const inner = new THREE.Group();
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    inner.add(leaf);
    root.add(inner);
    root.position.set(0, 0, -2);
    root.updateMatrixWorld(true);
    worldState.room.interactables.push({ mesh: root, type: 'glbType', panelId: 'panel-deep', name: 'GLB Thing' });

    system.updatePrompt();
    expect(document.getElementById('prompt').textContent).toBe('[E] GLB Thing');

    system.interact();
    expect(document.getElementById('panel-deep').classList.contains('active')).toBe(true);
  });
});

describe('openPanel ordering (loading.ts unlock handler)', () => {
  it('marks the panel active before controls.unlock() fires', () => {
    document.body.innerHTML = '<div id="panel-profile" class="info-panel"></div><div id="crosshair"></div>';
    const worldState = { ui: { isPanelOpen: false }, room: { interactables: [] } };
    let panelActiveAtUnlock = null;
    // Mirror loading.ts: the unlock handler re-shows the start screen unless a
    // panel is already active at that moment.
    const controls = { lock: () => {}, unlock: () => { panelActiveAtUnlock = document.querySelectorAll('.info-panel.active').length > 0; } };
    const system = new InteractionSystem({ camera: {}, worldState, controls });

    system.openPanel('panel-profile');
    expect(panelActiveAtUnlock).toBe(true);
  });
});

describe('terminal zoom (panel-alphgpt)', () => {
  it('does not unlock pointer at zoom start (start screen would flash over the room)', () => {
    document.body.innerHTML = '<div id="prompt"></div><div id="panel-alphgpt" class="info-panel"></div><div id="crosshair"></div>';
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, -2);
    camera.updateMatrixWorld(true);
    const worldState = { ui: { isPanelOpen: false }, room: { interactables: [] } };
    const controls = { lock: vi.fn(), unlock: vi.fn() };
    const system = new InteractionSystem({ camera, worldState, controls });

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    mesh.position.set(0, 0, -2);
    mesh.updateMatrixWorld();
    worldState.room.interactables.push({ mesh, type: 'macBook', panelId: 'panel-alphgpt', name: 'MACBOOK' });

    system.interact(); // starts the zoom; unlock must wait for openPanel
    expect(controls.unlock).not.toHaveBeenCalled();
  });
});
