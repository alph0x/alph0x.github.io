/**
 * @fileoverview Seed serialization — compact JSON format for room layouts.
 */

// ── Types ───────────────────────────────────────────────────────

export interface FurnitureConfig {
  type: string;
  position: number[];
  rotation?: number;
  panelId?: string;
  name?: string;
  coat?: string;
  pose?: string;
  noCollision?: boolean;
  color?: number;
  count?: number;
  intensity?: number;
  distance?: number;
  text?: string;
}

export interface SeedData {
  version: number;
  outline: number[][];
  width: number;
  depth: number;
  wallThickness: number;
  playerSpawn: number[];
  luluSpawn: number[];
  furniture: FurnitureConfig[];
  mat: { floor: string; wall: string; ceiling: string };
}

export interface SerializedItem {
  t: string;
  p: number[];
  r?: number;
  pid?: string;
  n?: string;
  c?: string;
  pos?: string;
  nc?: number;
  col?: number;
  ct?: number;
  i?: number;
  dst?: number;
  text?: string;
}

export interface SeedV2 {
  v: number;
  outline: number[][];
  f: SerializedItem[];
  ps: number[];
  ls: number[];
  mat: { floor: string; wall: string; ceiling: string };
  dec: unknown[];
}

export interface SeedV1 {
  v: number;
  w: number;
  d: number;
  f: SerializedItem[];
  ps: number[];
  ls: number[];
  dec: unknown[];
}

// ── Serialization ───────────────────────────────────────────────

export interface SerializeLayoutInput {
  outline: number[][];
  placed: { type: string; name?: string; config: FurnitureConfig }[];
  playerSpawn: { x: number; z: number };
  luluSpawn: { x: number; z: number };
  mat: { floor: string; wall: string; ceiling: string } | null;
}

export function serializeLayout({ outline, placed, playerSpawn, luluSpawn, mat }: SerializeLayoutInput): string {
  const f: SerializedItem[] = [];

  for (const item of placed) {
    const cfg = item.config;
    const o: SerializedItem = { t: item.type, p: cfg.position.map((n) => Math.round(n * 100) / 100) };
    if (cfg.rotation) o.r = Math.round(cfg.rotation * 1000) / 1000;
    if (cfg.panelId) o.pid = cfg.panelId;
    if (item.name) o.n = item.name;
    else if (cfg.name) o.n = cfg.name;
    if (cfg.coat) o.c = cfg.coat;
    if (cfg.pose) o.pos = cfg.pose;
    if (cfg.noCollision) o.nc = 1;
    if (cfg.color != null) o.col = cfg.color;
    if (cfg.count) o.ct = cfg.count;
    if (cfg.intensity != null) { o.i = cfg.intensity; o.dst = cfg.distance; }
    if (cfg.text != null) o.text = cfg.text;
    f.push(o);
  }

  const payload: SeedV2 = {
    v: 2,
    outline: outline.map((v) => [Math.round(v[0] * 100) / 100, Math.round(v[1] * 100) / 100]),
    f,
    ps: [Math.round(playerSpawn.x * 100) / 100, Math.round(playerSpawn.z * 100) / 100],
    ls: [Math.round(luluSpawn.x * 100) / 100, Math.round(luluSpawn.z * 100) / 100],
    mat: mat || { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' },
    dec: [],
  };

  return btoa(JSON.stringify(payload));
}

// ── Deserialization ─────────────────────────────────────────────

export function deserializeSeed(seedStr: string | object): SeedData {
  let raw: unknown = seedStr;
  if (typeof seedStr === 'string') {
    const isBase64 = seedStr.length % 4 === 0 && /^[A-Za-z0-9+/=]+$/.test(seedStr);
    raw = isBase64 ? JSON.parse(atob(seedStr)) : JSON.parse(seedStr);
  }
  const s = raw as Partial<SeedV2 & SeedV1>;

  const v = s.v || 1;

  let outline: number[][];
  let width: number;
  let depth: number;

  if (v >= 2 && s.outline) {
    outline = s.outline;
    const xs = outline.map((v) => v[0]);
    const zs = outline.map((v) => v[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);
    width = maxX - minX;
    depth = maxZ - minZ;
  } else {
    width = s.w || 4.5;
    depth = s.d || 3.5;
    const hw = width / 2, hd = depth / 2;
    outline = [
      [-hw, -hd],
      [hw, -hd],
      [hw, hd],
      [-hw, hd],
    ];
  }

  const furniture: FurnitureConfig[] = (s.f || []).map((item) => {
    const cfg: FurnitureConfig = { type: item.t, position: item.p };
    if (item.r != null) cfg.rotation = item.r;
    if (item.pid) cfg.panelId = item.pid;
    if (item.n != null) cfg.name = item.n;
    if (item.c) cfg.coat = item.c;
    if (item.pos) cfg.pose = item.pos;
    if (item.nc) cfg.noCollision = true;
    if (item.col != null) cfg.color = item.col;
    if (item.ct) cfg.count = item.ct;
    if (item.i != null) { cfg.intensity = item.i; cfg.distance = item.dst || 4; }
    if (item.text != null) cfg.text = item.text;
    return cfg;
  });

  const hasCeiling = furniture.some((f) => f.type === 'ceilingLamp');
  if (!hasCeiling) {
    furniture.push({ type: 'ceilingLamp', position: [0, 2.7, 0], color: 0xf5f5f4, intensity: 2.0, distance: 8 });
    furniture.push({ type: 'ceilingLamp', position: [1.3, 2.7, -0.7], color: 0xbfdbfe, intensity: 1.2, distance: 6 });
  }

  for (const d of (s.dec || []) as { t: string; p: number[]; r?: number; text?: string; color?: number }[]) {
    const cfg: FurnitureConfig = { type: d.t, position: d.p };
    if (d.r != null) cfg.rotation = d.r;
    if (d.text != null) cfg.text = d.text;
    if (d.color != null) cfg.color = d.color;
    furniture.push(cfg);
  }

  const mat = s.mat || { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' };

  return Object.freeze({
    version: v,
    outline,
    width,
    depth,
    wallThickness: 0.2,
    playerSpawn: s.ps || [0, 0],
    luluSpawn: s.ls || [0.3, 0.7],
    furniture,
    mat,
  } as SeedData);
}
