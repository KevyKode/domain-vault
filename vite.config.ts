import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  root: path.resolve(__dirname, './'),
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
})