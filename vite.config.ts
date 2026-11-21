import { defineConfig } from 'vite';

// A static site. `base: './'` lets the build run from any folder, such as GitHub Pages' /gadget-anatomy/.
export default defineConfig({
  base: './',
  build: { target: 'es2022', sourcemap: true, chunkSizeWarningLimit: 900 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
} as never);
