import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = resolve(__dirname, '../docs');

function walkSync(dir, callback) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSync(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}

function extractRelativeImports(source) {
  const imports = [];
  const importRegex = /import\s+(?:[^'"]*\s+from\s+)?['"](\.\.?\/[^'"]+)['"];?/g;
  let match;
  while ((match = importRegex.exec(source)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

describe('Project integrity', () => {
  it('no docs files start with underscore (Jekyll/GitHub Pages risk)', () => {
    const underscoreFiles = [];
    walkSync(DOCS_ROOT, (fullPath) => {
      const basename = fullPath.split('/').pop();
      if (basename.startsWith('_')) {
        underscoreFiles.push(fullPath.replace(DOCS_ROOT + '/', ''));
      }
    });

    expect(underscoreFiles).toEqual([]);
  });

  it('all relative ES module imports in docs/ resolve to existing files', () => {
    const missing = [];

    walkSync(DOCS_ROOT, (fullPath) => {
      if (!fullPath.endsWith('.js')) return;

      const content = readFileSync(fullPath, 'utf-8');
      const imports = extractRelativeImports(content);
      const fileDir = dirname(fullPath);
      const relPath = fullPath.replace(DOCS_ROOT + '/', '');

      for (const imp of imports) {
        const resolved = resolve(fileDir, imp);
        const candidates = extname(resolved)
          ? [resolved]
          : [resolved + '.js', resolved + '.mjs', join(resolved, 'index.js'), join(resolved, 'index.mjs')];

        const exists = candidates.some(c => existsSync(c));
        if (!exists) {
          missing.push({
            importer: relPath,
            import: imp,
            resolved: candidates[0].replace(DOCS_ROOT + '/', ''),
          });
        }
      }
    });

    if (missing.length > 0) {
      console.error('Broken relative imports found:');
      for (const m of missing) {
        console.error(`  ${m.importer} → "${m.import}" (resolved to ${m.resolved})`);
      }
    }

    expect(missing).toEqual([]);
  });
});
