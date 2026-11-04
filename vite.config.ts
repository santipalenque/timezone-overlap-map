import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build: {
    // Lightning CSS would rewrite light-dark() for older browsers with page-level variables, which
    // break inside the shadow DOM: target browsers that have it (styles.css falls back with @supports)
    cssTarget: ['chrome123', 'edge123', 'firefox120', 'safari17.5'],
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'timezone-overlap-map',
    },
    rolldownOptions: {
      // peer dependencies: the host app's bundler provides them
      external: [/^react(\/.*)?$/, /^react-dom(\/.*)?$/],
    },
  },
  test: {
    environment: 'happy-dom',
  },
});
