/**
 * @fileoverview Tests for TouchControls mobile input system.
 */


import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { TouchControls } from '../docs/js/systems/touch-controls.js';

function makeTouch(id, x, y) {
  return { identifier: id, clientX: x, clientY: y };
}

function dispatchTouch(type, touches) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  event.changedTouches = touches;
  document.dispatchEvent(event);
  return event;
}

describe('TouchControls', () => {
  let camera, worldState, onInteract, tc;

  beforeEach(() => {
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    camera.rotation.order = 'YXZ';
    worldState = {
      input: { moveForward: false, moveBackward: false, moveLeft: false, moveRight: false },
    };
    onInteract = vi.fn();
    tc = new TouchControls({ camera, worldState, onInteract });
    tc.init();
  });

  afterEach(() => {
    tc.destroy();
  });

  it('initializes with inactive state', () => {
    expect(tc.isActive).toBe(false);
    expect(tc._joystickTouchId).toBeNull();
    expect(tc._lookTouchId).toBeNull();
  });

  it('creates DOM elements', () => {
    expect(document.getElementById('touch-controls')).toBeTruthy();
    expect(document.getElementById('touch-joystick-base')).toBeTruthy();
    expect(document.getElementById('touch-interact')).toBeTruthy();
  });

  it('activates joystick on touch in left area', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    dispatchTouch('touchstart', [makeTouch(1, w * 0.2, h * 0.8)]);

    expect(tc.isActive).toBe(true);
    expect(tc._joystickTouchId).toBe(1);
  });

  it('does not activate joystick on touch in right area', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    dispatchTouch('touchstart', [makeTouch(1, w * 0.6, h * 0.8)]);

    expect(tc._joystickTouchId).toBeNull();
    expect(tc._lookTouchId).toBe(1);
  });

  it('maps joystick down to moveForward', () => {
    const x = 100;
    const y = 300;
    dispatchTouch('touchstart', [makeTouch(1, x, y)]);
    dispatchTouch('touchmove', [makeTouch(1, x, y - 30)]);
    tc.update();

    expect(worldState.input.moveForward).toBe(true);
    expect(worldState.input.moveBackward).toBe(false);
    expect(worldState.input.moveLeft).toBe(false);
    expect(worldState.input.moveRight).toBe(false);
  });

  it('maps joystick right to moveRight', () => {
    const x = 100;
    const y = 300;
    dispatchTouch('touchstart', [makeTouch(1, x, y)]);
    dispatchTouch('touchmove', [makeTouch(1, x + 30, y)]);
    tc.update();

    expect(worldState.input.moveRight).toBe(true);
    expect(worldState.input.moveForward).toBe(false);
  });

  it('clears input when joystick released', () => {
    const x = 100;
    const y = 300;
    dispatchTouch('touchstart', [makeTouch(1, x, y)]);
    dispatchTouch('touchmove', [makeTouch(1, x + 30, y)]);
    tc.update();
    expect(worldState.input.moveRight).toBe(true);

    dispatchTouch('touchend', [makeTouch(1, x + 30, y)]);
    tc.update();

    expect(worldState.input.moveRight).toBe(false);
    expect(worldState.input.moveForward).toBe(false);
    expect(worldState.input.moveBackward).toBe(false);
    expect(worldState.input.moveLeft).toBe(false);
  });

  it('applies look delta to camera rotation', () => {
    const w = window.innerWidth;
    const startY = camera.rotation.y;

    // Touch on right side to activate look
    dispatchTouch('touchstart', [makeTouch(2, w * 0.7, 200)]);
    dispatchTouch('touchmove', [makeTouch(2, w * 0.7 + 100, 200)]);
    tc.update();

    expect(camera.rotation.y).not.toBe(startY);
  });

  it('calls onInteract when interact button is touched', () => {
    const btn = document.getElementById('touch-interact');
    const touchEvent = new Event('touchstart', { bubbles: true, cancelable: true });
    btn.dispatchEvent(touchEvent);

    expect(onInteract).toHaveBeenCalled();
  });

  it('removes DOM on destroy', () => {
    tc.destroy();
    expect(document.getElementById('touch-controls')).toBeNull();
  });
});
