import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.js'],
    exclude: ['tests/e2e/**', 'tests/visual/**', 'node_modules/**'],
    setupFiles: ['tests/setup-canvas-mock.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['docs/js/**/*.js', 'docs/js/**/*.ts'],
    },
  }
});
