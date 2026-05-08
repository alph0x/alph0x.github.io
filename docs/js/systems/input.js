/**
 * @fileoverview Input handling — SRP: keyboard + mouse bindings only.
 */

export class InputSystem {
  constructor({ game }) {
    this.game = game;
    this.input = game.worldState.input;
    this.controls = game.controls;
  }

  bind() {
    this._onKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.input.moveForward = true; break;
        case 'KeyS': case 'ArrowDown': this.input.moveBackward = true; break;
        case 'KeyA': case 'ArrowLeft': this.input.moveLeft = true; break;
        case 'KeyD': case 'ArrowRight': this.input.moveRight = true; break;
        case 'KeyE': this.game.interact(); break;
        case 'Escape': this.game.closePanels(); break;
      }
    };
    this._onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.input.moveForward = false; break;
        case 'KeyS': case 'ArrowDown': this.input.moveBackward = false; break;
        case 'KeyA': case 'ArrowLeft': this.input.moveLeft = false; break;
        case 'KeyD': case 'ArrowRight': this.input.moveRight = false; break;
      }
    };
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
  }

  unbind() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('mousedown', this._onMouseDown);
  }
}
