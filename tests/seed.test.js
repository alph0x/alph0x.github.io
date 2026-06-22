/**
 * @fileoverview Tests for seed serialization / deserialization.
 *
 * Decision: Verify v2 polygonal format and v1 rectangular fallback.
 * Rationale (OCP): New seed versions should be additive — tests guard
 * against breaking backward compatibility.
 */

import { describe, it, expect } from 'vitest';
import { serializeLayout, deserializeSeed } from '../docs/js/seed.ts';

// ── serializeLayout ─────────────────────────────────────────────

describe('serializeLayout', () => {
  it('serializes a minimal layout to v2 JSON', () => {
    const layout = {
      outline: [[-2.25, -1.75], [2.25, -1.75], [2.25, 1.75], [-2.25, 1.75]],
      placed: [{ type: 'bed', config: { position: [-1.4, 0, -0.8], rotation: 1.571 } }],
      playerSpawn: { x: 0, z: 0 },
      luluSpawn: { x: 0.3, z: 0.7 },
      mat: { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' },
    };
    const seed = serializeLayout(layout);
    const parsed = JSON.parse(atob(seed));

    expect(parsed.v).toBe(2);
    expect(parsed.outline).toHaveLength(4);
    expect(parsed.f).toHaveLength(1);
    expect(parsed.f[0].t).toBe('bed');
    expect(parsed.f[0].p).toEqual([-1.4, 0, -0.8]);
    expect(parsed.f[0].r).toBe(1.571);
    expect(parsed.ps).toEqual([0, 0]);
    expect(parsed.ls).toEqual([0.3, 0.7]);
    expect(parsed.mat.floor).toBe('#1c1917');
    expect(parsed.dec).toEqual([]);
  });

  it('rounds positions to 2 decimal places', () => {
    const layout = {
      outline: [[-2.25555, -1.75555]],
      placed: [{ type: 'desk', config: { position: [1.23456, 0, -0.98765] } }],
      playerSpawn: { x: 0, z: 0 },
      luluSpawn: { x: 0, z: 0 },
    };
    const seed = serializeLayout(layout);
    const parsed = JSON.parse(atob(seed));
    expect(parsed.outline[0]).toEqual([-2.26, -1.76]);
    expect(parsed.f[0].p).toEqual([1.23, 0, -0.99]);
  });

  it('includes optional furniture fields when present', () => {
    const layout = {
      outline: [[0, 0], [1, 0], [1, 1], [0, 1]],
      placed: [{
        type: 'terminal',
        config: {
          position: [0, 0, 0],
          rotation: 0.5,
          panelId: 'p1',
          name: 'T1',
          coat: 'salt',
          pose: 'laying',
          noCollision: true,
          color: 0xff0000,
          count: 5,
          intensity: 2.0,
          distance: 10,
        },
      }],
      playerSpawn: { x: 0, z: 0 },
      luluSpawn: { x: 0, z: 0 },
    };
    const seed = serializeLayout(layout);
    const parsed = JSON.parse(atob(seed));
    const item = parsed.f[0];

    expect(item.r).toBe(0.5);
    expect(item.pid).toBe('p1');
    expect(item.n).toBe('T1');
    expect(item.c).toBe('salt');
    expect(item.pos).toBe('laying');
    expect(item.nc).toBe(1);
    expect(item.col).toBe(0xff0000);
    expect(item.ct).toBe(5);
    expect(item.i).toBe(2.0);
    expect(item.dst).toBe(10);
  });

  it('omits optional fields when absent', () => {
    const layout = {
      outline: [[0, 0], [1, 0], [1, 1], [0, 1]],
      placed: [{ type: 'box', config: { position: [0, 0, 0] } }],
      playerSpawn: { x: 0, z: 0 },
      luluSpawn: { x: 0, z: 0 },
    };
    const seed = serializeLayout(layout);
    const parsed = JSON.parse(atob(seed));
    const item = parsed.f[0];

    expect(item).not.toHaveProperty('r');
    expect(item).not.toHaveProperty('pid');
    expect(item).not.toHaveProperty('nc');
  });

  it('serializes placed decorations into furniture array', () => {
    const layout = {
      outline: [[0, 0], [1, 0], [1, 1], [0, 1]],
      placed: [
        { type: 'poster', config: { position: [0, 1, 0], text: 'HI', color: 0xff0000 } },
        { type: 'fairyLights', config: { position: [1, 2, 1] } },
      ],
      playerSpawn: { x: 0, z: 0 },
      luluSpawn: { x: 0, z: 0 },
    };
    const seed = serializeLayout(layout);
    const parsed = JSON.parse(atob(seed));

    expect(parsed.f).toHaveLength(2);
    expect(parsed.dec).toEqual([]);
    const poster = parsed.f.find((f) => f.t === 'poster');
    expect(poster.text).toBe('HI');
    expect(poster.col).toBe(0xff0000);
  });

  it('uses default materials when mat is omitted', () => {
    const layout = {
      outline: [[0, 0], [1, 0]],
      placed: [],
      playerSpawn: { x: 0, z: 0 },
      luluSpawn: { x: 0, z: 0 },
    };
    const seed = serializeLayout(layout);
    const parsed = JSON.parse(atob(seed));
    expect(parsed.mat).toEqual({ floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' });
  });
});

// ── deserializeSeed ─────────────────────────────────────────────

describe('deserializeSeed', () => {
  it('deserializes v2 seed with polygon outline', () => {
    const seed = JSON.stringify({
      v: 2,
      outline: [[-1, -1], [1, -1], [1, 1], [-1, 1]],
      f: [{ t: 'bed', p: [0, 0, 0] }],
      ps: [0.5, 0.5],
      ls: [0.3, 0.7],
      dec: [],
    });
    const result = deserializeSeed(seed);

    expect(result.version).toBe(2);
    expect(result.outline).toHaveLength(4);
    expect(result.width).toBe(2);
    expect(result.depth).toBe(2);
    expect(result.wallThickness).toBe(0.2);
    expect(result.playerSpawn).toEqual([0.5, 0.5]);
    expect(result.luluSpawn).toEqual([0.3, 0.7]);
    expect(result.furniture).toHaveLength(3); // 1 + 2 default lamps
  });

  it('falls back to v1 rectangular room when no outline', () => {
    const seed = JSON.stringify({
      v: 1,
      w: 4.5,
      d: 3.5,
      f: [],
      ps: [0, 0],
      ls: [0.3, 0.7],
    });
    const result = deserializeSeed(seed);

    expect(result.version).toBe(1);
    expect(result.outline).toEqual([
      [-2.25, -1.75],
      [2.25, -1.75],
      [2.25, 1.75],
      [-2.25, 1.75],
    ]);
    expect(result.width).toBe(4.5);
    expect(result.depth).toBe(3.5);
  });

  it('auto-generates v1 defaults when fields are missing', () => {
    const seed = JSON.stringify({ v: 1, f: [] });
    const result = deserializeSeed(seed);
    expect(result.outline).toHaveLength(4);
    expect(result.width).toBe(4.5);
    expect(result.depth).toBe(3.5);
    expect(result.playerSpawn).toEqual([0, 0]);
    expect(result.luluSpawn).toEqual([0.3, 0.7]);
  });

  it('adds default ceiling lamps when none present', () => {
    const seed = JSON.stringify({
      v: 2,
      outline: [[0, 0], [1, 0], [1, 1], [0, 1]],
      f: [],
    });
    const result = deserializeSeed(seed);
    const lamps = result.furniture.filter((f) => f.type === 'ceilingLamp');
    expect(lamps).toHaveLength(2);
    expect(lamps[0].position).toEqual([0, 2.7, 0]);
    expect(lamps[0].intensity).toBe(2.0);
    expect(lamps[1].position).toEqual([1.3, 2.7, -0.7]);
  });

  it('does not add default ceiling lamps if already present', () => {
    const seed = JSON.stringify({
      v: 2,
      outline: [[0, 0], [1, 0], [1, 1], [0, 1]],
      f: [{ t: 'ceilingLamp', p: [0, 2.7, 0] }],
    });
    const result = deserializeSeed(seed);
    const lamps = result.furniture.filter((f) => f.type === 'ceilingLamp');
    expect(lamps).toHaveLength(1);
  });

  it('deserializes all furniture optional fields', () => {
    const seed = JSON.stringify({
      v: 2,
      outline: [[0, 0], [1, 0], [1, 1], [0, 1]],
      f: [{
        t: 'custom',
        p: [1, 2, 3],
        r: 1.5,
        pid: 'panel1',
        n: 'Name',
        c: 'salt',
        pos: 'laying',
        nc: 1,
        col: 0x00ff00,
        ct: 5,
        i: 2.0,
        dst: 10,
      }],
    });
    const result = deserializeSeed(seed);
    const f = result.furniture.find((x) => x.type === 'custom');

    expect(f.rotation).toBe(1.5);
    expect(f.panelId).toBe('panel1');
    expect(f.name).toBe('Name');
    expect(f.coat).toBe('salt');
    expect(f.pose).toBe('laying');
    expect(f.noCollision).toBe(true);
    expect(f.color).toBe(0x00ff00);
    expect(f.count).toBe(5);
    expect(f.intensity).toBe(2.0);
    expect(f.distance).toBe(10);
  });

  it('deserializes decoration fields merged into furniture', () => {
    const seed = JSON.stringify({
      v: 2,
      outline: [[0, 0], [1, 0], [1, 1], [0, 1]],
      dec: [
        { t: 'poster', p: [0, 1, 0], text: 'GAME\nON', color: 0x7c3aed },
        { t: 'fairyLights', p: [1, 2, 1] },
      ],
    });
    const result = deserializeSeed(seed);
    expect(result.furniture).toHaveLength(4); // 2 dec + 2 default lamps
    const poster = result.furniture.find((f) => f.type === 'poster');
    expect(poster.text).toBe('GAME\nON');
    expect(poster.color).toBe(0x7c3aed);
    const lights = result.furniture.find((f) => f.type === 'fairyLights');
    expect(lights).toBeDefined();
    expect(result).not.toHaveProperty('decorations');
  });

  it('returns a frozen object', () => {
    const seed = JSON.stringify({ v: 2, outline: [[0, 0], [1, 0], [1, 1], [0, 1]] });
    const result = deserializeSeed(seed);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('deserializes custom materials', () => {
    const seed = JSON.stringify({
      v: 2,
      outline: [[0, 0], [1, 0], [1, 1], [0, 1]],
      mat: { floor: '#ff0000', wall: '#00ff00', ceiling: '#0000ff' },
    });
    const result = deserializeSeed(seed);
    expect(result.mat.floor).toBe('#ff0000');
    expect(result.mat.wall).toBe('#00ff00');
    expect(result.mat.ceiling).toBe('#0000ff');
  });

  it('handles object input instead of string', () => {
    const obj = {
      v: 2,
      outline: [[0, 0], [1, 0], [1, 1], [0, 1]],
      f: [],
    };
    const result = deserializeSeed(obj);
    expect(result.version).toBe(2);
  });

  it('detects and decodes base64 seeds', () => {
    const json = JSON.stringify({ v: 2, outline: [[0, 0], [1, 0], [1, 1], [0, 1]], f: [{ t: 'bed', p: [0, 0, 0] }] });
    const b64 = btoa(json);
    const result = deserializeSeed(b64);
    expect(result.version).toBe(2);
    expect(result.furniture).toHaveLength(3); // 1 + 2 default lamps
  });

  it('still accepts raw JSON strings (backward compat)', () => {
    const json = JSON.stringify({ v: 2, outline: [[0, 0], [1, 0]], f: [] });
    const result = deserializeSeed(json);
    expect(result.version).toBe(2);
  });
});

// ── Round-trip with MOCK_SEED ─────────────────────────────────

describe('MOCK_SEED round-trip', () => {
  it('serializes back to equivalent layout after editor load', () => {
    const { MOCK_SEED } = require('./fixtures.js');
    const layout = deserializeSeed(MOCK_SEED);

    // Simulate how the editor builds `state.placed` in loadSeedIntoEditor
    const placed = layout.furniture.map((f) => {
      const cfg = {
        position: [...f.position],
        rotation: f.rotation || 0,
        type: f.type,
      };
      if (f.text != null) cfg.text = f.text;
      if (f.color != null) cfg.color = f.color;
      if (f.intensity != null) { cfg.intensity = f.intensity; cfg.distance = f.distance; }
      return { type: f.type, config: cfg };
    });

    const seed2 = serializeLayout({
      outline: layout.outline,
      placed,
      playerSpawn: { x: layout.playerSpawn[0], z: layout.playerSpawn[1] },
      luluSpawn: { x: layout.luluSpawn[0], z: layout.luluSpawn[1] },
      mat: layout.mat,
    });

    const layout2 = deserializeSeed(seed2);

    // Compare all furniture including ceiling lamps
    expect(layout2.furniture).toHaveLength(layout.furniture.length);

    for (let i = 0; i < layout.furniture.length; i++) {
      const a = layout.furniture[i];
      const b = layout2.furniture[i];
      expect(b.type).toBe(a.type);
      expect(b.position[0]).toBeCloseTo(a.position[0], 2);
      expect(b.position[1]).toBeCloseTo(a.position[1], 2);
      expect(b.position[2]).toBeCloseTo(a.position[2], 2);
      expect(b.rotation || 0).toBeCloseTo(a.rotation || 0, 3);
    }

    expect(layout2.playerSpawn).toEqual(layout.playerSpawn);
    expect(layout2.luluSpawn).toEqual(layout.luluSpawn);
    expect(layout2.mat).toEqual(layout.mat);
  });
});
