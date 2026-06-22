import { describe, it, expect, beforeEach, vi } from 'vitest';
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
