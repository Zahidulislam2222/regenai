import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    include: ['app/**/*.{test,spec}.{ts,tsx}', 'tests/unit/**/*.{test,spec}.{ts,tsx}'],
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.{ts,tsx}'],
      exclude: [
        'app/**/*.d.ts',
        'app/**/*.stories.{ts,tsx}',
        'app/**/*.generated.*',
        'app/assets/**',
      ],
      thresholds: {
        lines: 40,   // grows toward 70% by Day 10
        functions: 40,
        branches: 40,
        statements: 40,
      },
    },
  },
});
