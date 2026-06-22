/**
 * @fileoverview Tests for InputSystem keyboard legend toggle.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InputSystem } from '../docs/js/systems/input.js';
import { createWorldState } from '../docs/js/domain/world-state.js';

function press(code, target = document) {
  const ev = new KeyboardEvent('keydown', { code, bubbles: true });
  target.dispatchEvent(ev);
}

describe('InputSystem legend overlay', () => {
  let game;
  let system;

  beforeEach(() => {
    document.body.innerHTML = '<div id="legend" class="legend-overlay"></div>';
    const worldState = createWorldState({ playerSpawn: [0, 0], playerHeight: 1.6 });
    game = {
      worldState,
      controls: { lock: vi.fn(), unlock: vi.fn() },
      interact: vi.fn(),
      closePanels: vi.fn(),
    };
    system = new InputSystem({ game });
    system.bind();
  });

  afterEach(() => {
    system.unbind();
  });

  it('toggles the legend on H', () => {
    const legend = document.getElementById('legend');
    expect(legend.classList.contains('active')).toBe(false);

    press('KeyH');
    expect(legend.classList.contains('active')).toBe(true);
    expect(game.controls.unlock).toHaveBeenCalled();

    press('KeyH');
    expect(legend.classList.contains('active')).toBe(false);
    expect(game.controls.lock).toHaveBeenCalled();
  });

  it('toggles the legend on Slash (?)', () => {
    const legend = document.getElementById('legend');
    press('Slash');
    expect(legend.classList.contains('active')).toBe(true);
    press('Slash');
    expect(legend.classList.contains('active')).toBe(false);
  });

  it('closes the legend with Escape and falls back to closePanels when closed', () => {
    const legend = document.getElementById('legend');
    press('KeyH');
    expect(legend.classList.contains('active')).toBe(true);

    press('Escape');
    expect(legend.classList.contains('active')).toBe(false);
    expect(game.closePanels).not.toHaveBeenCalled();

    press('Escape');
    expect(game.closePanels).toHaveBeenCalled();
  });

  it('does not toggle legend while typing in an input', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    const legend = document.getElementById('legend');

    press('KeyH', input);
    expect(legend.classList.contains('active')).toBe(false);
    input.remove();
  });
});
