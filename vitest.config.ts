import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['scripts/**/*.test.ts', 'packages/*/src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.spec.*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['scripts/**/*.ts', 'packages/*/src/**/*.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
  },
});
