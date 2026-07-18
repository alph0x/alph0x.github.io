/**
 * @fileoverview Input handling — SRP: keyboard + mouse bindings only.
 */

import type { WorldState } from '../domain/world-state.js';
import type { ControlsLike } from '../core.js';

interface GameLike {
  worldState: WorldState;
  controls: ControlsLike;
  interact(): void;
  closePanels(): void;
  stopTour?(): boolean;
}

export class InputSystem {
  game: GameLike;
  input: WorldState['input'];
  controls: ControlsLike;

  private _onKeyDown!: (e: KeyboardEvent) => void;
  private _onKeyUp!: (e: KeyboardEvent) => void;

  constructor({ game }: { game: GameLike }) {
    this.game = game;
    this.input = game.worldState.input;
    this.controls = game.controls;
  }

  private _isTypingTarget(e: KeyboardEvent): boolean {
    const target = e.target as HTMLElement | null;
    if (!target) return false;
    return (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    );
  }

  private _toggleLegend(): void {
    const legend = document.getElementById('legend');
    if (!legend) return;
    if (legend.classList.contains('active')) {
      this._closeLegend();
    } else {
      legend.classList.add('active');
      this.controls.unlock();
    }
  }

  private _closeLegend(): void {
    const legend = document.getElementById('legend');
    if (legend) legend.classList.remove('active');
    if (!this.game.worldState.ui.isPanelOpen) {
      try {
        this.controls.lock();
      } catch {
        /* pointer lock may not be available */
      }
    }
  }

  bind(): void {
    this._onKeyDown = (e) => {
      if (this._isTypingTarget(e)) return;
      const legendActive = document.getElementById('legend')?.classList.contains('active');
      if (legendActive && e.code !== 'Escape' && e.code !== 'KeyH' && e.code !== 'Slash') return;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.moveForward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.moveBackward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.moveLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.moveRight = true;
          break;
        case 'KeyE':
          this.game.interact();
          break;
        case 'KeyH':
        case 'Slash':
          this._toggleLegend();
          break;
        case 'Escape':
          if (document.getElementById('legend')?.classList.contains('active')) {
            this._closeLegend();
          } else if (this.game.stopTour && this.game.stopTour()) {
            // handled active tour
          } else {
            this.game.closePanels();
          }
          break;
      }
    };

    this._onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.moveForward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.moveBackward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.moveLeft = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.moveRight = false;
          break;
      }
    };

    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);

  }
  unbind(): void {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
  }
}
