/**
 * @fileoverview Touch controls for mobile — virtual joystick + look + interact.
 *
 * Architecture:
 * - Left 45% of screen: virtual joystick → maps to worldState.input (WASD)
 * - Right side + anywhere else: drag to look (camera rotation)
 * - Bottom-right button: interact (E)
 * - All state is applied in update() called per frame.
 */

import * as THREE from 'three';

const JOYSTICK_MAX_RADIUS = 50; // px
const LOOK_SENSITIVITY = 0.003;
const DEADZONE = 10; // px

export class TouchControls {
  /**
   * @param {object} opts
   * @param {THREE.Camera} opts.camera
   * @param {object} opts.worldState
   * @param {Function} opts.onInteract
   */
  constructor({ camera, worldState, onInteract }) {
    this.camera = camera;
    this.input = worldState.input;
    this.onInteract = onInteract;
    this.isActive = false;

    this._joystickTouchId = null;
    this._joystickOrigin = { x: 0, y: 0 };
    this._joystickCurrent = { x: 0, y: 0 };

    this._lookTouchId = null;
    this._lookLast = { x: 0, y: 0 };
    this._lookDelta = { x: 0, y: 0 };

    this._els = {};
    this._boundStart = this._onTouchStart.bind(this);
    this._boundMove = this._onTouchMove.bind(this);
    this._boundEnd = this._onTouchEnd.bind(this);
  }

  init() {
    this._buildDOM();
    document.addEventListener('touchstart', this._boundStart, { passive: false });
    document.addEventListener('touchmove', this._boundMove, { passive: false });
    document.addEventListener('touchend', this._boundEnd);
    document.addEventListener('touchcancel', this._boundEnd);
  }

  destroy() {
    document.removeEventListener('touchstart', this._boundStart);
    document.removeEventListener('touchmove', this._boundMove);
    document.removeEventListener('touchend', this._boundEnd);
    document.removeEventListener('touchcancel', this._boundEnd);
    if (this._els.container) this._els.container.remove();
  }

  // ── DOM ─────────────────────────────────────────────────────────

  _buildDOM() {
    const c = document.createElement('div');
    c.id = 'touch-controls';
    c.innerHTML = `
      <div id="touch-joystick-base"><div id="touch-joystick-knob"></div></div>
      <div id="touch-interact"><span>E</span></div>
      <div id="touch-hint">DRAG TO LOOK</div>
    `;
    document.body.appendChild(c);

    this._els.container = c;
    this._els.joystickBase = c.querySelector('#touch-joystick-base');
    this._els.joystickKnob = c.querySelector('#touch-joystick-knob');
    this._els.interact = c.querySelector('#touch-interact');
    this._els.hint = c.querySelector('#touch-hint');

    this._els.interact.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._els.interact.classList.add('active');
      this.onInteract();
    }, { passive: false });

    this._els.interact.addEventListener('touchend', () => {
      this._els.interact.classList.remove('active');
    });

    // Hide hint after first interaction
    const hideHint = () => {
      if (this._els.hint) this._els.hint.style.opacity = '0';
      document.removeEventListener('touchstart', hideHint);
    };
    document.addEventListener('touchstart', hideHint, { once: true });
  }

  // ── Touch handling ──────────────────────────────────────────────

  _isJoystickArea(x) {
    return x < window.innerWidth * 0.45;
  }

  _onTouchStart(e) {
    for (const t of e.changedTouches) {
      const { clientX: x, clientY: y } = t;

      if (this._joystickTouchId === null && this._isJoystickArea(x)) {
        this._joystickTouchId = t.identifier;
        this._joystickOrigin = { x, y };
        this._joystickCurrent = { x, y };
        this._showJoystick(x, y);
        this.isActive = true;
        e.preventDefault();
      } else if (this._lookTouchId === null && t.identifier !== this._joystickTouchId) {
        this._lookTouchId = t.identifier;
        this._lookLast = { x, y };
        this.isActive = true;
      }
    }
  }

  _onTouchMove(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === this._joystickTouchId) {
        this._updateJoystick(t.clientX, t.clientY);
        e.preventDefault();
      } else if (t.identifier === this._lookTouchId) {
        this._lookDelta.x += (t.clientX - this._lookLast.x) * LOOK_SENSITIVITY;
        this._lookDelta.y += (t.clientY - this._lookLast.y) * LOOK_SENSITIVITY;
        this._lookLast = { x: t.clientX, y: t.clientY };
      }
    }
  }

  _onTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === this._joystickTouchId) {
        this._joystickTouchId = null;
        this._hideJoystick();
      } else if (t.identifier === this._lookTouchId) {
        this._lookTouchId = null;
      }
    }
    if (this._joystickTouchId === null && this._lookTouchId === null) {
      this.isActive = false;
    }
  }

  // ── Joystick visuals ────────────────────────────────────────────

  _showJoystick(x, y) {
    const base = this._els.joystickBase;
    base.style.left = x + 'px';
    base.style.top = y + 'px';
    base.style.opacity = '1';
    this._els.joystickKnob.style.transform = 'translate(-50%, -50%)';
  }

  _hideJoystick() {
    this._els.joystickBase.style.opacity = '0';
    this._els.joystickKnob.style.transform = 'translate(-50%, -50%)';
  }

  _updateJoystick(x, y) {
    const dx = x - this._joystickOrigin.x;
    const dy = y - this._joystickOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, JOYSTICK_MAX_RADIUS);
    const angle = Math.atan2(dy, dx);

    this._joystickCurrent = {
      x: this._joystickOrigin.x + Math.cos(angle) * clamped,
      y: this._joystickOrigin.y + Math.sin(angle) * clamped,
    };

    const knob = this._els.joystickKnob;
    knob.style.transform = `translate(calc(-50% + ${Math.cos(angle) * clamped}px), calc(-50% + ${Math.sin(angle) * clamped}px))`;
  }

  // ── Per-frame update ────────────────────────────────────────────

  update() {
    // Joystick → input
    if (this._joystickTouchId !== null) {
      const dx = this._joystickCurrent.x - this._joystickOrigin.x;
      const dy = this._joystickCurrent.y - this._joystickOrigin.y;

      this.input.moveRight = dx > DEADZONE;
      this.input.moveLeft = dx < -DEADZONE;
      this.input.moveBackward = dy > DEADZONE;
      this.input.moveForward = dy < -DEADZONE;
    } else {
      this.input.moveForward = false;
      this.input.moveBackward = false;
      this.input.moveLeft = false;
      this.input.moveRight = false;
    }

    // Look delta → camera rotation
    if (this._lookDelta.x !== 0 || this._lookDelta.y !== 0) {
      const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
      euler.y -= this._lookDelta.x;
      euler.x -= this._lookDelta.y;
      // Clamp pitch to avoid flipping
      euler.x = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, euler.x));
      this.camera.quaternion.setFromEuler(euler);
      this._lookDelta.x = 0;
      this._lookDelta.y = 0;
    }
  }
}
