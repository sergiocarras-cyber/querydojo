import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { problemsPlugin } from './plugins/problems.ts';

export default defineConfig({
  // Relative base so the static build works on GitHub Pages under /<repo>/.
  base: './',
  plugins: [react(), tailwindcss(), problemsPlugin()],
  optimizeDeps: {
    exclude: ['@electric-sql/pglite', 'pyodide'],
  },
  worker: {
    format: 'es',
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 60_000,
  },
});
