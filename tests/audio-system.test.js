/**
 * @fileoverview Tests for AudioSystem — footstep and ambient audio.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioSystem } from '../docs/js/systems/audio.js';

describe('AudioSystem', () => {
  let audio;

  beforeEach(() => {
    audio = new AudioSystem();
  });

  afterEach(() => {
    audio.stopAmbient();
  });

  it('constructs without errors', () => {
    expect(audio).toBeInstanceOf(AudioSystem);
    expect(audio._ctx).toBeNull();
  });

  it('setMoving stores movement state', () => {
    audio.setMoving(true);
    expect(audio._isMoving).toBe(true);
    audio.setMoving(false);
    expect(audio._isMoving).toBe(false);
  });

  it('tolerates a missing AudioContext', () => {
    expect(() => {
      audio.update(0.016);
      audio.startAmbient();
      audio.stopAmbient();
    }).not.toThrow();
  });

  it('accumulates step timer while moving', () => {
    audio.setMoving(true);
    const initialTimer = audio._stepTimer;
    audio.update(0.1);
    expect(audio._stepTimer).toBeGreaterThan(initialTimer);
  });

  it('resets step timer when movement stops', () => {
    audio.setMoving(true);
    audio.update(0.1);
    audio.setMoving(false);
    audio.update(0.1);
    expect(audio._stepTimer).toBe(0);
  });

  it('plays step sound when interval is reached (with mocked AudioContext)', () => {
    const mockOsc = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), frequency: { value: 0 }, type: '' };
    const mockGain = { connect: vi.fn(), gain: { setValueAtTime: vi.fn(), value: 0 } };
    const mockFilter = { connect: vi.fn(), frequency: { value: 0 }, Q: { value: 0 }, type: '' };
    const mockBufferSource = { start: vi.fn(), connect: vi.fn(), disconnect: vi.fn(), onended: null };
    const mockBuffer = { getChannelData: vi.fn(() => new Float32Array(100)) };
    const mockDestination = {};

    const mockCtx = {
      sampleRate: 48000,
      currentTime: 0,
      state: 'running',
      createBuffer: vi.fn(() => mockBuffer),
      createBufferSource: vi.fn(() => mockBufferSource),
      createBiquadFilter: vi.fn(() => mockFilter),
      createGain: vi.fn(() => mockGain),
      createOscillator: vi.fn(() => mockOsc),
      destination: mockDestination,
      resume: vi.fn(() => Promise.resolve()),
    };

    // Inject mocked context
    audio._ctx = mockCtx;

    audio.setMoving(true);
    audio._stepTimer = audio._stepInterval; // force step
    audio.update(0.016);

    // Step timer should reset after playing
    expect(audio._stepTimer).toBe(0);
    expect(mockBufferSource.start).toHaveBeenCalled();
  });

  it('creates ambient nodes when started (with mocked AudioContext)', () => {
    const mockOsc = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), frequency: { value: 0 }, type: '' };
    const mockGain = { connect: vi.fn(), gain: { value: 0 } };

    const mockCtx = {
      sampleRate: 48000,
      currentTime: 0,
      state: 'running',
      createOscillator: vi.fn(() => mockOsc),
      createGain: vi.fn(() => mockGain),
      destination: {},
      resume: vi.fn(() => Promise.resolve()),
    };

    audio._ctx = mockCtx;
    audio.startAmbient();

    expect(audio._ambientNode).not.toBeNull();
    expect(mockOsc.start).toHaveBeenCalledTimes(2);
  });
});
