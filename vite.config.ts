import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build: {
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
