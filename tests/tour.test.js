/**
 * @fileoverview Tests for the Portfolio Tour feature.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { Game } from '../docs/js/game.js';
import { createWorldState } from '../docs/js/domain/world-state.js';

function makeCamera() {
  const cam = new THREE.PerspectiveCamera();
  cam.position.set(0.5, 1.7, 0.5);
  cam.quaternion.identity();
  return cam;
}

function makeGame(camera = makeCamera(), scene = { traverse: vi.fn() }) {
  const worldState = createWorldState({ playerSpawn: [0.5, 0.5], playerHeight: 1.7 });
  return new Game({
    renderer: { render: vi.fn(), setSize: vi.fn() },
    scene,
    camera,
    controls: { isLocked: false, lock: vi.fn(), unlock: vi.fn(), addEventListener: vi.fn() },
    worldState,
    touchControls: null,
  });
}

describe('Portfolio tour', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="start-screen" style="display:flex"></div>
      <button id="tour-skip" style="display:none"></button>
      <div id="crosshair" style="display:block"></div>
      <div id="panel-profile" class="info-panel"></div>
      <div id="panel-alphgpt" class="info-panel"></div>
    `;
  });

  it('starts inactive', () => {
    const game = makeGame();
    expect(game.tour.active).toBe(false);
    expect(game.tour.phase).toBe('idle');
    expect(game.tour.index).toBe(0);
  });

  it('startTour activates tour and updates UI', () => {
    const game = makeGame();
    game.startTour();
    expect(game.tour.active).toBe(true);
    expect(game.tour.phase).toBe('move');
    expect(game.tour.index).toBe(0);
    expect(document.getElementById('start-screen').style.display).toBe('none');
    expect(document.getElementById('tour-skip').style.display).toBe('block');
  });

  it('updateTour moves camera toward the first stop', () => {
    const camera = makeCamera();
    const startPos = camera.position.clone();
    const game = makeGame(camera);
    game.startTour();
    game.updateTour(0.5);
    expect(camera.position.distanceTo(startPos)).toBeGreaterThan(0);
    expect(camera.position.distanceTo(game.tour.stops[0].position)).toBeLessThan(startPos.distanceTo(game.tour.stops[0].position));
  });

  it('updateTour opens the relevant panel when movement finishes', () => {
    const game = makeGame();
    game.startTour();
    // Step through the move and dwell cycle for the first stop
    for (let i = 0; i < 80; i += 1) {
      game.updateTour(0.05);
    }
    expect(document.getElementById('panel-profile').classList.contains('active')).toBe(true);
    expect(game.worldState.ui.isPanelOpen).toBe(true);
  });

  it('stopTour stops an active tour', () => {
    const game = makeGame();
    game.startTour();
    expect(game.stopTour()).toBe(true);
    expect(game.tour.active).toBe(false);
    expect(game.tour.phase).toBe('idle');
    expect(game.tour.index).toBe(0);
    expect(document.getElementById('tour-skip').style.display).toBe('none');
  });

  it('stopTour is a no-op when not touring', () => {
    const game = makeGame();
    expect(game.stopTour()).toBe(false);
    expect(game.tour.active).toBe(false);
  });

  it('stops at the last stop after all dwells complete', () => {
    const game = makeGame();
    game.startTour();
    // Fast-forward through all stops
    for (let i = 0; i < 2000; i += 1) {
      game.updateTour(0.05);
    }
    expect(game.tour.active).toBe(false);
    expect(game.tour.index).toBe(0);
  });
});

describe('Portfolio tour input wiring', () => {
  function makeGameWithScene() {
    const scene = {
      add: vi.fn(),
      traverse: vi.fn((cb) => cb({ isMesh: false })),
    };
    const game = makeGame(makeCamera(), scene);
    game.init();
    return game;
  }

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="start-screen" style="display:flex">
        <button id="start-btn">ENTER</button>
      </div>
      <button id="tour-skip" style="display:none"></button>
      <div id="crosshair" style="display:block"></div>
      <div id="panel-profile" class="info-panel"></div>
    `;
  });

  it('Escape calls stopTour on an active tour', () => {
    const game = makeGameWithScene();
    game.startTour();
    expect(game.tour.active).toBe(true);

    const ev = new KeyboardEvent('keydown', { code: 'Escape', bubbles: true });
    document.dispatchEvent(ev);

    expect(game.tour.active).toBe(false);
    expect(document.getElementById('tour-skip').style.display).toBe('none');
  });
});
