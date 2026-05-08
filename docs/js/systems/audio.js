/**
 * @fileoverview AudioSystem — procedural footstep and ambient room tone.
 * Uses Web Audio API with lazy initialization (required for browser autoplay policy).
 */

export class AudioSystem {
  constructor() {
    this._ctx = null;
    this._ambientNode = null;
    this._stepTimer = 0;
    this._stepInterval = 0.42; // seconds between steps
    this._isMoving = false;
    this._resumeHandler = null;
  }

  // ── Public API ──────────────────────────────────────────────────

  /** Call when player starts moving. */
  setMoving(isMoving) {
    this._isMoving = isMoving;
  }

  /** Update loop — call every frame with delta time. */
  update(delta) {
    if (!this._isMoving) {
      this._stepTimer = 0;
      return;
    }

    this._stepTimer += delta;
    if (this._stepTimer >= this._stepInterval) {
      this._stepTimer = 0;
      if (this._ensureContext()) {
        this._playStep();
      }
    }

    if (this._ensureContext()) {
      this._updateAmbient();
    }
  }

  /** Start ambient drone (idempotent). */
  startAmbient() {
    if (!this._ensureContext()) return;
    if (this._ambientNode) return;

    const ctx = this._ctx;
    const master = ctx.createGain();
    master.gain.value = 0.025;
    master.connect(ctx.destination);

    // Low drone + harmonic
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 55;

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 110;

    const gain1 = ctx.createGain();
    gain1.gain.value = 1.0;
    const gain2 = ctx.createGain();
    gain2.gain.value = 0.5;

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(master);
    gain2.connect(master);

    osc1.start();
    osc2.start();

    this._ambientNode = { master, osc1, osc2, gain1, gain2 };
  }

  /** Stop ambient drone. */
  stopAmbient() {
    if (!this._ambientNode) return;
    try {
      this._ambientNode.osc1.stop();
      this._ambientNode.osc2.stop();
    } catch { /* may already be stopped */ }
    this._ambientNode = null;
  }

  // ── Private ─────────────────────────────────────────────────────

  _ensureContext() {
    if (this._ctx) return true;
    if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') {
      return false;
    }
    const AC = typeof AudioContext !== 'undefined' ? AudioContext : webkitAudioContext;
    this._ctx = new AC();

    // Auto-resume on first user interaction (browser autoplay policy)
    this._resumeHandler = () => {
      if (this._ctx && this._ctx.state === 'suspended') {
        this._ctx.resume().catch(() => {});
      }
    };
    document.addEventListener('pointerdown', this._resumeHandler, { once: true });
    document.addEventListener('keydown', this._resumeHandler, { once: true });

    return true;
  }

  _playStep() {
    const ctx = this._ctx;
    const sampleRate = ctx.sampleRate;
    const duration = 0.08; // 80ms
    const samples = Math.floor(sampleRate * duration);

    const buffer = ctx.createBuffer(1, samples, sampleRate);
    const data = buffer.getChannelData(0);

    // White noise with exponential decay envelope
    for (let i = 0; i < samples; i++) {
      const env = Math.exp(-i / (samples * 0.25));
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600 + Math.random() * 500;
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.value = 0.12;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();

    // Auto-cleanup
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  _updateAmbient() {
    if (!this._ambientNode) return;
    // Subtle volume modulation for "alive" feel
    const t = this._ctx.currentTime;
    const baseVol = 0.025;
    const variation = Math.sin(t * 0.3) * 0.005;
    this._ambientNode.master.gain.setValueAtTime(baseVol + variation, t);
  }
}
