import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['node_modules', 'tests/e2e/**', 'tests/fixtures/**'],
    setupFiles: ['./tests/config/setup.ts'],
    testTimeout: 60000,
    hookTimeout: 30000,
    reporters: ['default', 'verbose'],
    outputFile: {
      json: './tests/reports/vitest-results.json',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './tests/reports/coverage',
      include: ['lib/**', 'components/**', 'app/**'],
      exclude: ['node_modules', 'tests/**'],
    },
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(process.cwd()) },
    ],
  },
});
