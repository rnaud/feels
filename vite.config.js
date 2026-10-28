import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/feels/' : '/',
  build: {
    rollupOptions: {
      input: { main: 'index.html', illustrated: 'illustrated/index.html' },
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
}));
