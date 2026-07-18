import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ASSETS_ROOT = path.resolve(import.meta.dirname, '../docs/public/assets');

function dirSizeMB(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile() && entry.name !== 'LICENSES.md') {
      total += fs.statSync(path.join(entry.parentPath, entry.name)).size;
    }
  }
  return total / (1024 * 1024);
}

describe('asset size budgets', () => {
  it('HDRI environment stays within 4 MB', () => {
    expect(dirSizeMB(path.join(ASSETS_ROOT, 'env'))).toBeLessThanOrEqual(4);
  });

  it('texture sets stay within 8 MB total', () => {
    expect(dirSizeMB(path.join(ASSETS_ROOT, 'tex'))).toBeLessThanOrEqual(8);
  });

  it('every vendored asset is precached by the service worker', () => {
    const sw = fs.readFileSync(path.resolve(import.meta.dirname, '../docs/public/sw.js'), 'utf-8');
    const files = [];
    for (const entry of fs.readdirSync(ASSETS_ROOT, { withFileTypes: true, recursive: true })) {
      if (entry.isFile() && entry.name !== 'LICENSES.md') {
        files.push('/assets/' + path.relative(ASSETS_ROOT, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'));
      }
    }
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      expect(sw).toContain(`'${f}'`);
    }
  });
});
