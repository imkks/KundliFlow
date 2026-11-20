import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/test/**/*.test.ts'],
    setupFiles: ['./packages/engine/test/setup.ts'],
    testTimeout: 20000,
  },
});
