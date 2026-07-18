import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('service worker assets', () => {
  it('precaches both GLB models', () => {
    const swPath = path.resolve(process.cwd(), 'docs/sw.js');
    const sw = fs.readFileSync(swPath, 'utf-8');
    expect(sw).toContain("'/assets/models/lulu.glb'");
    expect(sw).toContain("'/assets/models/macbook.glb'");
  });

  it('bumped cache version to v2', () => {
    const swPath = path.resolve(process.cwd(), 'docs/sw.js');
    const sw = fs.readFileSync(swPath, 'utf-8');
    expect(sw).toContain("alph0x-portfolio-v2");
  });
});
