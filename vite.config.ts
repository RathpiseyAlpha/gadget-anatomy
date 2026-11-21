import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// A static site. `base: './'` lets the build run from any folder, such as GitHub Pages' /gadget-anatomy/.
export default defineConfig({
  base: './',
  // The reused PC Anatomy code (SPEC decision 15), reached only through its adapter; types in src/vendor/pc-anatomy/api.d.ts.
  resolve: { alias: { 'pc-anatomy': fileURLToPath(new URL('./src/vendor/pc-anatomy/kit.ts', import.meta.url)) } },
  build: { target: 'es2022', sourcemap: true, chunkSizeWarningLimit: 900 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
} as never);
