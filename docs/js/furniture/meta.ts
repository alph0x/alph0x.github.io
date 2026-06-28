/**
 * @fileoverview Furniture metadata — categories, dimensions, icons.
 * Applied to existing registry entries so builders don't need to change.
 */

import { FurnitureRegistry } from './registry.js';

interface MetaEntry {
  category: string;
  dimensions: string;
  icon: string;
}

const META: Record<string, MetaEntry> = {
  // ── Furniture ───────────────────────────────────────────────────
  bed:            { category: 'furniture', dimensions: '2.0 × 1.4 × 1.0 m',   icon: '🛏️' },
  nightstand:     { category: 'furniture', dimensions: '0.5 × 0.4 × 0.5 m',   icon: '🗄️' },
  bookshelf:      { category: 'furniture', dimensions: '1.0 × 0.3 × 1.8 m',   icon: '📚' },
  desk:           { category: 'furniture', dimensions: '1.8 × 0.9 × 0.84 m',  icon: '🖥️' },
  deskChair:      { category: 'furniture', dimensions: '0.5 × 0.5 × 0.9 m',   icon: '🪑' },
  coffeeTable:    { category: 'furniture', dimensions: '1.0 × 0.6 × 0.4 m',   icon: '☕' },
  door:           { category: 'furniture', dimensions: '0.9 × 0.1 × 2.0 m',   icon: '🚪' },
  window:         { category: 'furniture', dimensions: '1.2 × 0.1 × 1.2 m',   icon: '🪟' },
  rug:            { category: 'furniture', dimensions: '2.5 × 1.8 × 0.02 m',  icon: '🧶' },

  // ── Decor ───────────────────────────────────────────────────────
  plant:          { category: 'decor', dimensions: '0.3 × 0.3 × 0.8 m',   icon: '🪴' },
  boxStack:       { category: 'decor', dimensions: '0.4 × 0.4 × 0.5 m',   icon: '📦' },
  trash:          { category: 'decor', dimensions: '0.3 × 0.3 × 0.6 m',   icon: '🗑️' },
  bookStack:      { category: 'decor', dimensions: '0.3 × 0.2 × 0.2 m',   icon: '📖' },
  shoes:          { category: 'decor', dimensions: '0.3 × 0.2 × 0.15 m',  icon: '👟' },
  clothes:        { category: 'decor', dimensions: '0.5 × 0.3 × 1.7 m',   icon: '👕' },
  gun:            { category: 'decor', dimensions: '0.3 × 0.1 × 0.15 m',  icon: '🔫' },
  mug:            { category: 'decor', dimensions: '0.08 × 0.08 × 0.1 m',  icon: '☕' },
  paper:          { category: 'decor', dimensions: '0.3 × 0.01 × 0.4 m',  icon: '📄' },
  bottle:         { category: 'decor', dimensions: '0.08 × 0.08 × 0.3 m',  icon: '🍾' },
  can:            { category: 'decor', dimensions: '0.06 × 0.06 × 0.12 m', icon: '🥫' },
  poster:         { category: 'decor', dimensions: '0.5 × 0.02 × 0.7 m',  icon: '🖼️' },
  miniSchnauzer:  { category: 'decor', dimensions: '0.3 × 0.5 × 0.4 m',   icon: '🐕' },
  drone:          { category: 'decor', dimensions: '0.3 × 0.3 × 0.1 m',   icon: '🚁' },

  // ── Lights ──────────────────────────────────────────────────────
  ceilingLamp:    { category: 'lights', dimensions: '0.15 × 0.15 × 2.0 m',  icon: '💡' },
  floorLamp:      { category: 'lights', dimensions: '0.2 × 0.2 × 1.65 m',  icon: '🕯️' },
  fairyLights:    { category: 'lights', dimensions: '1.8 × 0.02 × 0.02 m', icon: '✨' },

  // ── Electronics ─────────────────────────────────────────────────
  tv:             { category: 'electronics', dimensions: '1.1 × 0.03 × 0.62 m', icon: '📺' },
  terminal:       { category: 'electronics', dimensions: '0.6 × 0.5 × 1.2 m',   icon: '💻' },
  monitor:        { category: 'electronics', dimensions: '0.5 × 0.05 × 0.3 m',  icon: '🖥️' },
  gamingPC:       { category: 'electronics', dimensions: '0.25 × 0.5 × 0.5 m',  icon: '🎮' },
  macBook:        { category: 'electronics', dimensions: '0.3 × 0.2 × 0.02 m',  icon: '💻' },
  controller:     { category: 'electronics', dimensions: '0.15 × 0.05 × 0.08 m',icon: '🎮' },
  headset:        { category: 'electronics', dimensions: '0.2 × 0.1 × 0.2 m',   icon: '🎧' },
  server:         { category: 'electronics', dimensions: '0.6 × 0.8 × 1.8 m',   icon: '🖨️' },
};

for (const [type, meta] of Object.entries(META)) {
  const entry = FurnitureRegistry.get(type);
  if (entry) {
    entry.meta = { ...entry.meta, ...meta };
  } else {
    console.warn('[meta.js] No registry entry for type:', type);
  }
}
