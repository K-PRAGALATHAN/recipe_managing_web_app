import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    proxy: {
      '/api': 'http://localhost:4001',
    },
  },
});
