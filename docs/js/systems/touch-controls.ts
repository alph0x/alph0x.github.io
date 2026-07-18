/**
 * @fileoverview Touch controls for mobile — virtual joystick + look + interact.
 */

import * as THREE from 'three';
import type { WorldState } from '../domain/world-state.js';

const JOYSTICK_MAX_RADIUS = 50; // px
const LOOK_SENSITIVITY = 0.003;
const DEADZONE = 10; // px

const _euler = new THREE.Euler(); // scratch — avoids a per-frame allocation

interface TouchElements {
  container: HTMLDivElement;
  joystickBase: HTMLElement;
  joystickKnob: HTMLElement;
  interact: HTMLElement;
  hint: HTMLElement;
}

export class TouchControls {
  camera: THREE.Camera;
  input: WorldState['input'];
  onInteract: () => void;
  isActive: boolean;

  private _joystickTouchId: number | null;
  private _joystickOrigin: { x: number; y: number };
  private _joystickCurrent: { x: number; y: number };

  private _lookTouchId: number | null;
  private _lookLast: { x: number; y: number };
  private _lookDelta: { x: number; y: number };

  private _els: Partial<TouchElements>;
  private _boundStart: (e: TouchEvent) => void;
  private _boundMove: (e: TouchEvent) => void;
  private _boundEnd: (e: TouchEvent) => void;

  constructor({
    camera,
    worldState,
    onInteract,
  }: {
    camera: THREE.Camera;
    worldState: WorldState;
    onInteract: () => void;
  }) {
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

  init(): void {
    this._buildDOM();
    document.addEventListener('touchstart', this._boundStart, { passive: false });
    document.addEventListener('touchmove', this._boundMove, { passive: false });
    document.addEventListener('touchend', this._boundEnd);
    document.addEventListener('touchcancel', this._boundEnd);
  }

  destroy(): void {
    document.removeEventListener('touchstart', this._boundStart);
    document.removeEventListener('touchmove', this._boundMove);
    document.removeEventListener('touchend', this._boundEnd);
    document.removeEventListener('touchcancel', this._boundEnd);
    if (this._els.container) this._els.container.remove();
  }

  // ── DOM ─────────────────────────────────────────────────────────

  private _buildDOM(): void {
    const c = document.createElement('div');
    c.id = 'touch-controls';
    c.innerHTML = `
      <div id="touch-joystick-base"><div id="touch-joystick-knob"></div></div>
      <div id="touch-interact"><span>E</span></div>
      <div id="touch-hint">DRAG TO LOOK</div>
    `;
    document.body.appendChild(c);

    this._els.container = c;
    this._els.joystickBase = c.querySelector('#touch-joystick-base') as HTMLElement;
    this._els.joystickKnob = c.querySelector('#touch-joystick-knob') as HTMLElement;
    this._els.interact = c.querySelector('#touch-interact') as HTMLElement;
    this._els.hint = c.querySelector('#touch-hint') as HTMLElement;

    this._els.interact.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._els.interact!.classList.add('active');
      this.onInteract();
    }, { passive: false });

    this._els.interact.addEventListener('touchend', () => {
      this._els.interact!.classList.remove('active');
    });

    // Hide hint after first interaction
    const hideHint = () => {
      if (this._els.hint) this._els.hint.style.opacity = '0';
      document.removeEventListener('touchstart', hideHint);
    };
    document.addEventListener('touchstart', hideHint, { once: true });
  }

  // ── Touch handling ──────────────────────────────────────────────

  private _isJoystickArea(x: number): boolean {
    return x < window.innerWidth * 0.45;
  }

  private _onTouchStart(e: TouchEvent): void {
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

  private _onTouchMove(e: TouchEvent): void {
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

  private _onTouchEnd(e: TouchEvent): void {
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

  private _showJoystick(x: number, y: number): void {
    const base = this._els.joystickBase!;
    base.style.left = x + 'px';
    base.style.top = y + 'px';
    base.style.opacity = '1';
    this._els.joystickKnob!.style.transform = 'translate(-50%, -50%)';
  }

  private _hideJoystick(): void {
    this._els.joystickBase!.style.opacity = '0';
    this._els.joystickKnob!.style.transform = 'translate(-50%, -50%)';
  }

  private _updateJoystick(x: number, y: number): void {
    const dx = x - this._joystickOrigin.x;
    const dy = y - this._joystickOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, JOYSTICK_MAX_RADIUS);
    const angle = Math.atan2(dy, dx);

    this._joystickCurrent = {
      x: this._joystickOrigin.x + Math.cos(angle) * clamped,
      y: this._joystickOrigin.y + Math.sin(angle) * clamped,
    };

    const knob = this._els.joystickKnob!;
    knob.style.transform = `translate(calc(-50% + ${Math.cos(angle) * clamped}px), calc(-50% + ${Math.sin(angle) * clamped}px))`;
  }

  // ── Per-frame update ────────────────────────────────────────────

  update(): void {
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
      const euler = _euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
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
